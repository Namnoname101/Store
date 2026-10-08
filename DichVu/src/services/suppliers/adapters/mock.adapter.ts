import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";

export type MockSimulatedError =
  | "INSUFFICIENT_BALANCE"
  | "OUT_OF_STOCK"
  | "NETWORK_ERROR"
  | null;

export interface MockProductData {
  name?: string;
  price: number;
  inStock: number;
  keys?: string[];
}

export class MockSupplierAdapter implements ISupplierAdapter {
  private balance: number = 1000000;
  private products: Map<string, MockProductData> = new Map();
  private simulatedError: MockSimulatedError = null;
  private purchaseLog: Array<{
    creds: SupplierCredentials;
    productCode: string;
    quantity: number;
    orderCode: string;
    options?: any;
  }> = [];

  public setBalance(balance: number): void {
    this.balance = balance;
  }

  public getBalance(): number {
    return this.balance;
  }

  public getPurchaseLog() {
    return this.purchaseLog;
  }

  public clearPurchaseLog(): void {
    this.purchaseLog = [];
  }

  public setProduct(code: string, product: MockProductData): void {
    this.products.set(code, {
      ...product,
      keys: product.keys ? [...product.keys] : undefined,
    });
  }

  public getProduct(code: string): MockProductData | undefined {
    return this.products.get(code);
  }

  public simulateError(error: MockSimulatedError): void {
    this.simulatedError = error;
  }

  public async checkBalance(_creds: SupplierCredentials): Promise<number> {
    if (this.simulatedError === "NETWORK_ERROR") {
      throw new Error("NETWORK_ERROR: Simulated connection failure in checkBalance");
    }
    return this.balance;
  }

  public async fetchProductInfo(
    _creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    if (this.simulatedError === "NETWORK_ERROR") {
      throw new Error("NETWORK_ERROR: Simulated connection failure in fetchProductInfo");
    }

    const product = this.products.get(supplierProductCode);
    if (!product) {
      return {
        supplierProductCode,
        name: `Mock Product ${supplierProductCode}`,
        price: 50000,
        inStock: 10,
      };
    }

    return {
      supplierProductCode,
      name: product.name ?? `Product ${supplierProductCode}`,
      price: product.price,
      inStock: product.inStock,
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string,
    options?: any
  ): Promise<SupplierOrderResult> {
    this.purchaseLog.push({
      creds,
      productCode: supplierProductCode,
      quantity,
      orderCode,
      options,
    });

    if (this.simulatedError) {
      return {
        success: false,
        deliveredKeys: [],
        error: this.simulatedError,
      };
    }

    const product = this.products.get(supplierProductCode) ?? {
      price: 50000,
      inStock: 10,
    };

    if (product.inStock < quantity) {
      return {
        success: false,
        deliveredKeys: [],
        error: "OUT_OF_STOCK",
      };
    }

    const totalCost = product.price * quantity;
    if (this.balance < totalCost) {
      return {
        success: false,
        deliveredKeys: [],
        error: "INSUFFICIENT_BALANCE",
      };
    }

    this.balance -= totalCost;
    product.inStock -= quantity;

    let deliveredKeys: string[] = [];
    if (product.keys && product.keys.length >= quantity) {
      deliveredKeys = product.keys.splice(0, quantity);
    } else {
      deliveredKeys = Array.from(
        { length: quantity },
        (_, i) => `MOCK-KEY-${supplierProductCode}-${orderCode}-${i + 1}`
      );
    }

    return {
      success: true,
      upstreamOrderId: `MOCK-ORD-${Date.now()}-${orderCode}`,
      deliveredKeys,
      rawResponse: {
        orderCode,
        supplierProductCode,
        quantity,
        remainingBalance: this.balance,
      },
    };
  }
}
