export interface SupplierCredentials {
  baseUrl: string;
  apiKey: string;
  apiSecret?: string | null;
}

export interface SupplierProductInfo {
  supplierProductCode: string;
  name?: string;
  price: number; // Cost in VND
  inStock: number;
}

export interface SupplierOrderResult {
  success: boolean;
  upstreamOrderId?: string;
  deliveredKeys: string[];
  rawResponse?: any;
  error?: string;
}

export interface SupplierOrderStatusResult {
  success: boolean;
  status: "PENDING" | "PROCESSING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL" | "CANCELLED";
  startCount?: number;
  remains?: number;
  charge?: number;
  rawStatus?: string;
  error?: string;
}

export interface ISupplierAdapter {
  checkBalance(creds: SupplierCredentials): Promise<number>;
  fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo>;
  buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string,
    extra?: any
  ): Promise<SupplierOrderResult>;
  checkOrderStatus?(
    creds: SupplierCredentials,
    upstreamOrderId: string
  ): Promise<SupplierOrderStatusResult>;
}
