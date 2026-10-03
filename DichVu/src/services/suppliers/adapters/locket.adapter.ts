import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";
import { sanitizeDeliveredKeys } from "./taphoammo.adapter";

export class LocketAdapter implements ISupplierAdapter {
  private formatBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, "");
  }

  private buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    };
  }

  public async checkBalance(_creds: SupplierCredentials): Promise<number> {
    // Locket.com.vn reseller API v1 deducts directly from wallet during /shop/order
    // and returns 402 when balance is insufficient.
    return 0;
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/shop/products`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(creds.apiKey),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Locket API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const products: any[] = Array.isArray(data?.products) ? data.products : [];

    const targetCode = String(supplierProductCode).trim();
    const found = products.find(
      (p) => String(p.id) === targetCode || String(p.name).toLowerCase() === targetCode.toLowerCase()
    );

    if (!found) {
      throw new Error(
        `Không tìm thấy sản phẩm có mã ID ${supplierProductCode} trên Locket.com.vn`
      );
    }

    return {
      supplierProductCode: String(found.id),
      name: String(found.name || ""),
      price: Math.round(Number(found.price_vnd ?? found.price ?? 0)),
      inStock: Math.max(0, Number(found.stock ?? 0)),
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    _orderCode?: string
  ): Promise<SupplierOrderResult> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/shop/order`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(creds.apiKey),
      body: JSON.stringify({
        product_id: Number(supplierProductCode),
        qty: quantity,
      }),
    });

    if (res.status === 402) {
      return {
        success: false,
        deliveredKeys: [],
        error: "Số dư ví đại lý trên Locket.com.vn không đủ để thanh toán đơn hàng",
      };
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        success: false,
        deliveredKeys: [],
        error: `Locket API lỗi (${res.status}): ${errText}`,
      };
    }

    const data = await res.json();
    const orderId = String(data?.order_id ?? "");
    let state = data?.state;
    let items = data?.items ?? [];

    // If state is pending_stock, poll order up to 3 times with 1s delay
    if (state === "pending_stock" && orderId) {
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const pollRes = await fetch(`${baseUrl}/shop/order/${orderId}`, {
            method: "GET",
            headers: this.buildHeaders(creds.apiKey),
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (
              pollData?.state === "done" &&
              Array.isArray(pollData?.items) &&
              pollData.items.length > 0
            ) {
              state = "done";
              items = pollData.items;
              break;
            }
          }
        } catch {
          // Continue polling
        }
      }
    }

    if (state === "done" && Array.isArray(items) && items.length > 0) {
      const deliveredKeys = sanitizeDeliveredKeys(items);
      return {
        success: true,
        deliveredKeys,
        upstreamOrderId: orderId,
        rawResponse: data,
      };
    }

    if (state === "pending_stock") {
      return {
        success: false,
        deliveredKeys: [],
        upstreamOrderId: orderId,
        error: "Sản phẩm tạm thời hết hàng trên sàn nguồn (Đang chờ nạp kho - pending_stock)",
        rawResponse: data,
      };
    }

    return {
      success: false,
      deliveredKeys: [],
      error: data?.message || "Không nhận được mã bàn giao từ sàn nguồn",
      rawResponse: data,
    };
  }
}
