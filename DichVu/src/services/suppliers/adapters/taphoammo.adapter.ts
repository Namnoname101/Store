import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";

export function sanitizeDeliveredKeys(input: unknown): string[] {
  if (!input) return [];

  if (typeof input === "string") {
    return input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  if (Array.isArray(input)) {
    return input
      .flatMap((item) => {
        if (typeof item === "string") {
          return sanitizeDeliveredKeys(item);
        }
        return [JSON.stringify(item)];
      })
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  if (typeof input === "object") {
    // If nested data has keys or cards property
    const obj = input as Record<string, unknown>;
    if (obj.keys) return sanitizeDeliveredKeys(obj.keys);
    if (obj.cards) return sanitizeDeliveredKeys(obj.cards);
  }

  return [];
}

export class TaphoammoAdapter implements ISupplierAdapter {
  private formatBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, "");
  }

  private buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      api_key: apiKey,
    };
  }

  public async checkBalance(creds: SupplierCredentials): Promise<number> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/api/user/balance`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(creds.apiKey),
    });

    if (!res.ok) {
      throw new Error(`Taphoammo checkBalance failed with status ${res.status}`);
    }

    const data = await res.json();
    const balance =
      data.data?.balance ??
      data.balance ??
      (typeof data.data === "number" ? data.data : 0);

    return Number(balance);
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/api/products/${supplierProductCode}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(creds.apiKey),
    });

    if (!res.ok) {
      throw new Error(`Taphoammo fetchProductInfo failed with status ${res.status}`);
    }

    const json = await res.json();
    const prod = json.data ?? json;

    return {
      supplierProductCode,
      name: prod.name,
      price: Number(prod.price ?? 0),
      inStock: Number(prod.in_stock ?? prod.stock ?? prod.inStock ?? 0),
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/api/orders`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(creds.apiKey),
        body: JSON.stringify({
          product_id: supplierProductCode,
          quantity,
          order_id: orderCode,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success === false) {
        const errorMsg =
          json?.message ||
          json?.error ||
          `Taphoammo buyProduct failed with status ${res.status}`;
        return {
          success: false,
          deliveredKeys: [],
          error: errorMsg,
          rawResponse: json,
        };
      }

      let rawKeyData: unknown = undefined;
      if (Array.isArray(json?.data) || typeof json?.data === "string") {
        rawKeyData = json.data;
      } else if (json?.data && typeof json.data === "object") {
        rawKeyData = json.data.keys ?? json.data.cards ?? json.data;
      } else {
        rawKeyData = json?.keys ?? json?.cards;
      }

      const deliveredKeys = sanitizeDeliveredKeys(rawKeyData);

      const upstreamOrderId =
        json.order_id ??
        json.orderId ??
        json.data?.order_id ??
        json.data?.id;

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
        error: error?.message || "Failed to communicate with Taphoammo API",
      };
    }
  }
}
