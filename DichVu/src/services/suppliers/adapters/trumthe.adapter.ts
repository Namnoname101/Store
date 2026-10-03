import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";
import { sanitizeDeliveredKeys } from "./taphoammo.adapter";

export class TrumtheAdapter implements ISupplierAdapter {
  private formatBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, "");
  }

  private buildHeaders(creds: SupplierCredentials): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: creds.apiKey,
      Authorization: `Bearer ${creds.apiKey}`,
    };
    if (creds.apiSecret) {
      headers["secret"] = creds.apiSecret;
      headers["api-secret"] = creds.apiSecret;
    }
    return headers;
  }

  public async checkBalance(creds: SupplierCredentials): Promise<number> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/api/balance`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(creds),
    });

    if (!res.ok) {
      throw new Error(`Trumthe checkBalance failed with status ${res.status}`);
    }

    const data = await res.json();
    const balance =
      data.balance ??
      data.data?.balance ??
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
      headers: this.buildHeaders(creds),
    });

    if (!res.ok) {
      throw new Error(`Trumthe fetchProductInfo failed with status ${res.status}`);
    }

    const json = await res.json();
    const prod = json.data ?? json;

    return {
      supplierProductCode: prod.code ?? supplierProductCode,
      name: prod.name,
      price: Number(prod.price ?? 0),
      inStock: Number(prod.stock ?? prod.inStock ?? prod.in_stock ?? 0),
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    const baseUrl = this.formatBaseUrl(creds.baseUrl);
    const url = `${baseUrl}/api/buy`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(creds),
        body: JSON.stringify({
          product_code: supplierProductCode,
          quantity,
          partner_order_id: orderCode,
        }),
      });

      const json = await res.json().catch(() => null);

      const isErrorStatus =
        !res.ok ||
        json?.status === "error" ||
        (typeof json?.status === "number" && json.status >= 400) ||
        json?.success === false;

      if (isErrorStatus) {
        const errorMsg =
          json?.message ||
          json?.error ||
          `Trumthe buyProduct failed with status ${res.status}`;
        return {
          success: false,
          deliveredKeys: [],
          error: errorMsg,
          rawResponse: json,
        };
      }

      let deliveredKeys: string[] = [];

      if (Array.isArray(json?.cards)) {
        deliveredKeys = json.cards
          .map((card: any) => {
            if (typeof card === "string") return card.trim();
            if (card.pin && card.serial) {
              return `PIN: ${card.pin} | SERI: ${card.serial}`;
            }
            if (card.pin) return String(card.pin);
            if (card.code) return String(card.code);
            return JSON.stringify(card);
          })
          .filter((k: string) => k.length > 0);
      } else {
        let rawKeyData: unknown = undefined;
        if (Array.isArray(json?.data) || typeof json?.data === "string") {
          rawKeyData = json.data;
        } else if (json?.data && typeof json.data === "object") {
          rawKeyData = json.data.keys ?? json.data.cards ?? json.data;
        } else {
          rawKeyData = json?.keys ?? json?.cards;
        }

        deliveredKeys = sanitizeDeliveredKeys(rawKeyData);
      }

      const upstreamOrderId =
        json?.trans_id ??
        json?.transaction_id ??
        json?.order_id ??
        json?.data?.id ??
        json?.id;

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
        error: error?.message || "Failed to communicate with Trumthe API",
      };
    }
  }
}
