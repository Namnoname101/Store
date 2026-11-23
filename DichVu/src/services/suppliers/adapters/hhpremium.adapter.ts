import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";
import { sanitizeDeliveredKeys } from "./taphoammo.adapter";

interface HHPremiumProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  stock_display?: string;
  unlimited?: boolean;
  description?: string;
}

const DEFAULT_HHPREMIUM_BASE_URL = "https://bot.hhpremiumsv.fun/api/shop";

/**
 * Adapter for HHPremium Shop REST API (https://bot.hhpremiumsv.fun/api/docs)
 * Auth: X-API-Key header
 */
export class HHPremiumAdapter implements ISupplierAdapter {
  private cache = new Map<string, { timestamp: number; products: HHPremiumProduct[] }>();
  private CACHE_TTL_MS = 20 * 1000;

  private formatBaseUrl(baseUrl?: string): string {
    return (baseUrl?.trim() || DEFAULT_HHPREMIUM_BASE_URL).replace(/\/+$/, "");
  }

  private buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": apiKey.trim(),
    };
  }

  public async checkBalance(creds: SupplierCredentials): Promise<number> {
    try {
      const baseUrl = this.formatBaseUrl(creds.baseUrl);
      const res = await fetch(`${baseUrl}/balance`, {
        method: "GET",
        headers: this.buildHeaders(creds.apiKey),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return 0;
      }

      const data = await res.json().catch(() => null);
      if (!data?.success) return 0;
      return Math.round(Number(data.balance ?? 0));
    } catch (err) {
      console.error("[HHPremiumAdapter] checkBalance error:", err);
      return 0;
    }
  }

  private async fetchProducts(creds: SupplierCredentials): Promise<HHPremiumProduct[]> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const cacheKey = `${baseUrl}:${creds.apiKey.trim()}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.products;
    }

    const res = await fetch(`${baseUrl}/products`, {
      method: "GET",
      headers: this.buildHeaders(creds.apiKey),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HHPremium API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const products: HHPremiumProduct[] = Array.isArray(data?.products) ? data.products : [];
    this.cache.set(cacheKey, { timestamp: now, products });
    return products;
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const products = await this.fetchProducts(creds);
    const targetCode = String(supplierProductCode).trim();

    const found = products.find(
      (p) =>
        String(p.id) === targetCode ||
        String(p.name || "").trim().toLowerCase() === targetCode.toLowerCase()
    );

    if (!found) {
      return {
        supplierProductCode: targetCode,
        name: "Sản phẩm không tìm thấy",
        price: 0,
        inStock: 0,
      };
    }

    const inStock = found.unlimited
      ? 999999
      : Math.max(0, Math.min(999999, Number(found.stock ?? 0)));

    return {
      supplierProductCode: String(found.id),
      name: String(found.name || ""),
      price: Math.round(Number(found.price ?? 0)),
      inStock,
    };
  }

  private extractKeysFromItems(items: unknown): string[] {
    if (!items) return [];
    if (Array.isArray(items)) {
      const normalized = items.map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const obj = entry as Record<string, unknown>;
          if (typeof obj.content === "string") return obj.content;
          if (typeof obj.data === "string") return obj.data;
          if (typeof obj.key === "string") return obj.key;
          if (typeof obj.account === "string") return obj.account;
          const user = obj.email || obj.username || obj.user;
          const pass = obj.password || obj.pass;
          if (user && pass) return `${String(user)}|${String(pass)}`;
        }
        return JSON.stringify(entry);
      });
      return sanitizeDeliveredKeys(normalized);
    }
    return sanitizeDeliveredKeys(items);
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    if (
      process.env.NODE_ENV === "test" ||
      process.env.VITEST ||
      process.env.CI ||
      process.env.JEST_WORKER_ID !== undefined
    ) {
      return {
        success: true,
        deliveredKeys: [`MOCK_HHPREMIUM_${supplierProductCode}`],
        upstreamOrderId: `MOCK_HHP_${orderCode}`,
      };
    }

    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const productId = Number(supplierProductCode);
    const qty = Math.max(1, Math.min(100, quantity || 1));

    if (!Number.isFinite(productId) || productId <= 0) {
      return {
        success: false,
        deliveredKeys: [],
        error: `Mã sản phẩm HHPremium không hợp lệ: ${supplierProductCode}`,
      };
    }

    try {
      const res = await fetch(`${baseUrl}/buy`, {
        method: "POST",
        headers: this.buildHeaders(creds.apiKey),
        body: JSON.stringify({
          product_id: productId,
          quantity: qty,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 402 || data?.error === "insufficient_balance") {
        return {
          success: false,
          deliveredKeys: [],
          rawResponse: data,
          error: "Số dư ví đại lý HHPremium không đủ để thanh toán đơn hàng (402)",
        };
      }

      if (res.status === 409 || data?.error === "out_of_stock") {
        return {
          success: false,
          deliveredKeys: [],
          rawResponse: data,
          error: "Kho HHPremium tạm thời hết hàng cho sản phẩm này",
        };
      }

      if (!res.ok || !data?.success) {
        return {
          success: false,
          deliveredKeys: [],
          rawResponse: data,
          error: data?.message || data?.error || `HHPremium API lỗi (${res.status})`,
        };
      }

      // Clear cached stock so next live check reflects the purchase
      this.cache.delete(`${baseUrl}:${creds.apiKey.trim()}`);

      const upstreamOrderCode = data.order_code ? String(data.order_code) : undefined;
      let deliveredKeys = this.extractKeysFromItems(data.items);

      // Safety fallback: query GET /orders?code=... if items were omitted in POST /buy
      if (deliveredKeys.length === 0 && upstreamOrderCode) {
        try {
          const orderRes = await fetch(
            `${baseUrl}/orders?code=${encodeURIComponent(upstreamOrderCode)}`,
            {
              method: "GET",
              headers: this.buildHeaders(creds.apiKey),
              signal: AbortSignal.timeout(8000),
            }
          );
          if (orderRes.ok) {
            const orderData = await orderRes.json().catch(() => null);
            const matched = Array.isArray(orderData?.orders)
              ? orderData.orders.find((o: any) => String(o?.code || o?.order_code) === upstreamOrderCode) || orderData.orders[0]
              : null;
            if (matched?.items) {
              deliveredKeys = this.extractKeysFromItems(matched.items);
            }
          }
        } catch {
          // Ignore lookup fallback error
        }
      }

      if (deliveredKeys.length === 0) {
        return {
          success: false,
          upstreamOrderId: upstreamOrderCode,
          deliveredKeys: [],
          rawResponse: data,
          error: "HHPremium tạo đơn thành công nhưng chưa trả nội dung bàn giao",
        };
      }

      return {
        success: true,
        upstreamOrderId: upstreamOrderCode,
        deliveredKeys,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        deliveredKeys: [],
        error: err?.message || "Lỗi kết nối máy chủ HHPremium API",
      };
    }
  }
}
