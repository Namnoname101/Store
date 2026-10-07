import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
  SupplierOrderStatusResult,
} from "../supplier-adapter.interface";

export class HackTimAdapter implements ISupplierAdapter {
  private formatBaseUrl(baseUrl: string): string {
    const trimmed = (baseUrl || "https://hacktim.com/api/v2").replace(/\/+$/, "");
    return trimmed.endsWith("/api/v2") ? trimmed : `${trimmed}/api/v2`;
  }

  private getExchangeRate(creds: SupplierCredentials): number {
    const custom = creds.apiSecret ? Number(creds.apiSecret) : NaN;
    return !isNaN(custom) && custom > 0 ? custom : 27000;
  }

  public async checkBalance(creds: SupplierCredentials): Promise<number> {
    const url = this.formatBaseUrl(creds.baseUrl);
    const body = new URLSearchParams({
      key: creds.apiKey.trim(),
      action: "balance",
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HackTim balance API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`HackTim error: ${data.error}`);
    }

    const usdBalance = Number(data.balance || 0);
    const rate = this.getExchangeRate(creds);
    return Math.round(usdBalance * rate);
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const url = this.formatBaseUrl(creds.baseUrl);
    const body = new URLSearchParams({
      key: creds.apiKey.trim(),
      action: "services",
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HackTim services API error (${res.status}): ${errText}`);
    }

    const services = await res.json();
    if (!Array.isArray(services)) {
      throw new Error(
        `HackTim API response invalid: ${JSON.stringify(services)}`
      );
    }

    const targetCode = String(supplierProductCode).trim();
    const found = services.find(
      (s: any) => String(s.service) === targetCode
    );

    if (!found) {
      throw new Error(`Service ${supplierProductCode} not found on HackTim`);
    }

    const rateUSD = Number(found.rate || 0);
    const usdToVnd = this.getExchangeRate(creds);
    // Rate in SMM API v2 is per 1,000 units. Calculate cost per 1 unit in VND (minimum 1 VND).
    const costPerUnit = Math.ceil((rateUSD * usdToVnd) / 1000);
    const costVnd = Math.max(1, costPerUnit);

    return {
      supplierProductCode: String(found.service),
      name: String(found.name || ""),
      price: costVnd,
      inStock: 999999, // SMM service stock is unlimited
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string,
    extra?: any
  ): Promise<SupplierOrderResult> {
    const url = this.formatBaseUrl(creds.baseUrl);

    // Extract customer link from extra / note
    const link =
      extra?.link ||
      extra?.targetLink ||
      extra?.customerNote ||
      `https://tiktok.com/@order_${orderCode}`;

    const body = new URLSearchParams({
      key: creds.apiKey.trim(),
      action: "add",
      service: String(supplierProductCode).trim(),
      link: String(link).trim(),
      quantity: String(quantity),
    });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          success: false,
          error: `HackTim order API error (${res.status}): ${errText}`,
          deliveredKeys: [],
        };
      }

      const data = await res.json();

      if (data.error) {
        return {
          success: false,
          error: String(data.error),
          deliveredKeys: [],
          rawResponse: data,
        };
      }

      const upstreamOrderId = String(data.order || data.id || "");
      const deliveredMessage = `Đơn dịch vụ đã được khởi tạo tự động thành công trên hệ thống.\nMã theo dõi đơn hàng: #${upstreamOrderId}\nĐích đến (Link): ${link}\nSố lượng: ${quantity}`;

      return {
        success: true,
        upstreamOrderId,
        deliveredKeys: [deliveredMessage],
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Lỗi kết nối tới máy chủ HackTim",
        deliveredKeys: [],
      };
    }
  }

  public async checkOrderStatus(
    creds: SupplierCredentials,
    upstreamOrderId: string
  ): Promise<SupplierOrderStatusResult> {
    const url = this.formatBaseUrl(creds.baseUrl);
    const body = new URLSearchParams({
      key: creds.apiKey.trim(),
      action: "status",
      order: String(upstreamOrderId).trim(),
    });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          success: false,
          status: "PROCESSING",
          error: `HackTim status error (${res.status}): ${errText}`,
        };
      }

      const data = await res.json();
      if (data.error) {
        return {
          success: false,
          status: "PROCESSING",
          error: String(data.error),
        };
      }

      const raw = String(data.status || "").toLowerCase();
      let status: SupplierOrderStatusResult["status"] = "IN_PROGRESS";
      if (raw.includes("pending")) {
        status = "PENDING";
      } else if (raw.includes("process")) {
        status = "PROCESSING";
      } else if (raw.includes("progress")) {
        status = "IN_PROGRESS";
      } else if (raw.includes("completed") || raw.includes("success")) {
        status = "COMPLETED";
      } else if (raw.includes("partial")) {
        status = "PARTIAL";
      } else if (raw.includes("cancel")) {
        status = "CANCELLED";
      }

      return {
        success: true,
        status,
        startCount: data.start_count !== undefined ? Number(data.start_count) : undefined,
        remains: data.remains !== undefined ? Number(data.remains) : undefined,
        charge: data.charge !== undefined ? Number(data.charge) : undefined,
        rawStatus: String(data.status || ""),
      };
    } catch (err: any) {
      return {
        success: false,
        status: "PROCESSING",
        error: err?.message || "Lỗi kiểm tra tiến trình",
      };
    }
  }
}
