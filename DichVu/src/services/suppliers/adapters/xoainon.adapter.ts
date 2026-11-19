import crypto from "crypto";
import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";
import { sanitizeDeliveredKeys } from "./taphoammo.adapter";

export const XOAINON_API_ALIASES: Record<string, string> = {
  "51": "70",
  "34": "21",
  "28": "71",
  "10": "33",
};

/**
 * Adapter for Shop Xoài Non Customer API v1 (REST)
 * Docs: https://shopxoainon.online/api/docs
 * Base URL: https://shopxoainon.online/api/v1
 */
export class XoaiNonAdapter implements ISupplierAdapter {
  private formatBaseUrl(baseUrl?: string): string {
    const raw = baseUrl?.trim() || "https://shopxoainon.online/api/v1";
    return raw.replace(/\/+$/, "");
  }

  private buildHeaders(apiKey?: string, idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": apiKey?.trim() || "",
    };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return headers;
  }

  /**
   * Normalize product ID:
   * "73" -> "local_73"
   * "local_73" -> "local_73"
   * "28" -> alias "71" -> "local_71"
   */
  public normalizeProductCode(code: string): string {
    const trimmed = String(code || "").trim();
    const cleanNum = trimmed.startsWith("local_") ? trimmed.slice(6) : trimmed;
    const aliased = XOAINON_API_ALIASES[cleanNum] || cleanNum;
    return aliased.startsWith("local_") ? aliased : `local_${aliased}`;
  }

  /**
   * Deterministic Idempotency Key based on orderCode
   * Ensures safe retries on timeouts without duplicate charges
   */
  public generateIdempotencyKey(orderCode?: string): string {
    if (orderCode && orderCode.trim()) {
      const hash = crypto.createHash("sha256").update(orderCode.trim()).digest("hex");
      return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    }
    return crypto.randomUUID();
  }

  public async checkBalance(creds: SupplierCredentials): Promise<number> {
    try {
      const baseUrl = this.formatBaseUrl(creds.baseUrl);
      const res = await fetch(`${baseUrl}/wallet/balance`, {
        method: "GET",
        headers: this.buildHeaders(creds.apiKey),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[XoaiNonAdapter] checkBalance failed (${res.status}): ${errText}`);
        return 0;
      }

      const data = await res.json();
      return Math.round(Number(data?.data?.vnd ?? data?.vnd ?? 0));
    } catch (err) {
      console.error("[XoaiNonAdapter] checkBalance error:", err);
      return 0;
    }
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const targetId = this.normalizeProductCode(supplierProductCode);

    // 1. First try realtime quote for fast & accurate stock
    try {
      const quoteRes = await fetch(`${baseUrl}/products/${targetId}/quote`, {
        method: "POST",
        headers: this.buildHeaders(creds.apiKey),
        body: JSON.stringify({
          variant_id: targetId,
          quantity: 1,
          currency_code: "vnd",
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        const q = quoteData?.data;
        if (q) {
          const avail = Number(q.available_quantity ?? 0);
          return {
            supplierProductCode: targetId,
            name: String(q.title || targetId),
            price: Math.round(Number(q.unit_price ?? q.total ?? 0)),
            inStock: q.can_purchase && avail > 0 ? avail : 0,
          };
        }
      }
    } catch {
      // Fallback to /products list
    }

    // 2. Fallback to /products catalog
    const res = await fetch(`${baseUrl}/products?limit=200`, {
      method: "GET",
      headers: this.buildHeaders(creds.apiKey),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Xoài Non API lỗi (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const products: any[] = Array.isArray(data?.data) ? data.data : [];

    const found = products.find(
      (p) => String(p.id) === targetId || String(p.id) === supplierProductCode
    );

    if (!found) {
      throw new Error(
        `Không tìm thấy sản phẩm ${supplierProductCode} (${targetId}) trên Xoài Non API`
      );
    }

    const variant = found.variants?.[0] || {};
    const stockQty = Number(variant.available_quantity ?? (found.in_stock ? 1 : 0));

    return {
      supplierProductCode: String(found.id),
      name: String(found.title || ""),
      price: Math.round(Number(variant.prices?.vnd ?? 0)),
      inStock: Boolean(found.in_stock) && stockQty > 0 ? stockQty : 0,
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode?: string
  ): Promise<SupplierOrderResult> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const targetId = this.normalizeProductCode(supplierProductCode);
    const qty = quantity > 0 ? quantity : 1;
    const idempotencyKey = this.generateIdempotencyKey(orderCode);

    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: this.buildHeaders(creds.apiKey, idempotencyKey),
      body: JSON.stringify({
        items: [{ variant_id: targetId, quantity: qty }],
        currency_code: "vnd",
        payment_method: "wallet",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 400) {
      const errJson = await res.json().catch(() => null);
      const msg = errJson?.error?.message || errJson?.message || "Số dư ví không đủ hoặc sản phẩm hết hàng";
      return {
        success: false,
        deliveredKeys: [],
        error: `Xoài Non từ chối đơn hàng (400): ${msg}`,
      };
    }

    if (res.status === 401) {
      return {
        success: false,
        deliveredKeys: [],
        error: "API Key Xoài Non không hợp lệ hoặc đã hết hạn",
      };
    }

    if (res.status === 429) {
      return {
        success: false,
        deliveredKeys: [],
        error: "Đã vượt quá giới hạn tần suất gọi API Xoài Non (60 requests/phút). Vui lòng thử lại sau.",
      };
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        success: false,
        deliveredKeys: [],
        error: `Xoài Non API lỗi (${res.status}): ${errText}`,
      };
    }

    const orderData = await res.json();
    const orderId = String(orderData?.data?.order_id ?? orderData?.data?.checkout_id ?? "");
    let status = orderData?.data?.status;

    // Poll GET /orders/{id} if not completed immediately (up to 5 attempts, 1.5s delay)
    if (orderId && status !== "completed") {
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          const checkRes = await fetch(`${baseUrl}/orders/${orderId}`, {
            method: "GET",
            headers: this.buildHeaders(creds.apiKey),
            signal: AbortSignal.timeout(5000),
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            status = checkData?.data?.status;
            if (status === "completed") break;
          }
        } catch {
          // Continue polling
        }
      }
    }

    // Retrieve delivery credentials from /orders/{id}/delivery
    if (orderId) {
      try {
        const delivRes = await fetch(`${baseUrl}/orders/${orderId}/delivery`, {
          method: "GET",
          headers: this.buildHeaders(creds.apiKey),
          signal: AbortSignal.timeout(8000),
        });

        if (delivRes.ok) {
          const delivData = await delivRes.json();
          const deliveredKeys = this.parseDeliveryCredentials(delivData);
          if (deliveredKeys.length > 0) {
            return {
              success: true,
              deliveredKeys,
              upstreamOrderId: orderId,
              rawResponse: { order: orderData, delivery: delivData },
            };
          }
        } else if (delivRes.status === 409) {
          return {
            success: false,
            deliveredKeys: [],
            upstreamOrderId: orderId,
            error: "Đơn hàng đang chờ sàn nguồn kích hoạt / giao tài khoản (409 Pending)",
            rawResponse: orderData,
          };
        }
      } catch (err: any) {
        console.warn("[XoaiNonAdapter] Error fetching delivery credentials:", err?.message);
      }
    }

    return {
      success: false,
      deliveredKeys: [],
      upstreamOrderId: orderId,
      error: "Không nhận được mã bàn giao từ sàn nguồn Xoài Non",
      rawResponse: orderData,
    };
  }

  /**
   * Helper to parse flexible credential formats from /delivery endpoint
   */
  public parseDeliveryCredentials(data: any): string[] {
    if (!data) return [];
    const root = data.data ?? data;

    let rawList: any[] = [];
    if (Array.isArray(root)) {
      rawList = root;
    } else if (Array.isArray(root.items)) {
      rawList = root.items;
    } else if (Array.isArray(root.credentials)) {
      rawList = root.credentials;
    } else if (typeof root === "string") {
      rawList = [root];
    } else if (root.content || root.credential || root.delivered || root.code) {
      rawList = [root.content || root.credential || root.delivered || root.code];
    } else {
      rawList = [JSON.stringify(root)];
    }

    const items = rawList.map((x) => (typeof x === "string" ? x : x.content || x.code || x.credential || JSON.stringify(x)));
    return sanitizeDeliveredKeys(items);
  }
}
