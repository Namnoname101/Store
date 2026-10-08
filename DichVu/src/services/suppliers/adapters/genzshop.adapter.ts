import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";
import { sanitizeDeliveredKeys } from "./taphoammo.adapter";

export class GenzShopAdapter implements ISupplierAdapter {
  private formatBaseUrl(baseUrl: string): string {
    let clean = baseUrl.trim().replace(/\/+$/, "");
    if (!clean.includes("/api/partner/v1")) {
      clean = `${clean}/api/partner/v1`;
    }
    return clean;
  }

  private buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      Authorization: `Bearer ${apiKey}`,
    };
  }

  public async checkBalance(creds: SupplierCredentials): Promise<number> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/balance.php`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(creds.apiKey),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.success === false) {
      const err = data?.detail || data?.message || data?.errorCode || `status ${res.status}`;
      throw new Error(`GenzShop checkBalance failed: ${err}`);
    }

    const balance = data?.balance ?? 0;
    return Number(balance);
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/products.php`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(creds.apiKey),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.success === false) {
      const err = data?.detail || data?.message || data?.errorCode || `status ${res.status}`;
      throw new Error(`GenzShop fetchProductInfo failed: ${err}`);
    }

    const products: any[] = Array.isArray(data?.products) ? data.products : [];
    const prod = products.find(
      (p) => String(p.product_id).toUpperCase() === supplierProductCode.trim().toUpperCase()
    );

    if (!prod) {
      throw new Error(`Product ${supplierProductCode} not found on GenzShop`);
    }

    return {
      supplierProductCode: prod.product_id,
      name: prod.name,
      price: Number(prod.walletPricing ?? prod.price ?? 0),
      inStock: Number(prod.available ?? prod.stock ?? prod.inStock ?? 0),
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/purchase.php`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(creds.apiKey),
        body: JSON.stringify({
          product_id: supplierProductCode,
          quantity,
          idempotency_key: orderCode,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success === false) {
        const errorMsg =
          json?.detail ||
          json?.message ||
          json?.errorCode ||
          `GenzShop buyProduct failed with status ${res.status}`;

        return {
          success: false,
          deliveredKeys: [],
          error: errorMsg,
          rawResponse: json,
        };
      }

      // Successful response extraction
      const rawAccounts = json?.deliveredAccounts ?? json?.data ?? json?.keys ?? [];
      const deliveredKeys = sanitizeDeliveredKeys(rawAccounts);

      const upstreamOrderId =
        json.order_id ??
        json.orderId ??
        json.idempotency_key ??
        orderCode;

      return {
        success: true,
        upstreamOrderId: upstreamOrderId ? String(upstreamOrderId) : undefined,
        deliveredKeys,
        rawResponse: json,
      };
    } catch (error: any) {
      return {
        success: false,
        deliveredKeys: [],
        error: error?.message || "Failed to communicate with GenzShop API",
      };
    }
  }
}
