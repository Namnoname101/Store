import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SupplierType } from "../../../src/lib/prisma";
import { SupplierCredentials } from "../../../src/services/suppliers/supplier-adapter.interface";
import { GenzShopAdapter } from "../../../src/services/suppliers/adapters/genzshop.adapter";
import {
  getSupplierAdapter,
  resetAdapterRegistry,
} from "../../../src/services/suppliers/adapter.registry";

describe("GenzShopAdapter", () => {
  const mockCreds: SupplierCredentials = {
    baseUrl: "https://genzshop.vn/api/partner/v1",
    apiKey: "gzsk_test_mock_key_123456",
  };

  let adapter: GenzShopAdapter;

  beforeEach(() => {
    adapter = new GenzShopAdapter();
    vi.restoreAllMocks();
    resetAdapterRegistry();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Registry integration", () => {
    it("should resolve GenzShopAdapter from registry by SupplierType.GENZSHOP", () => {
      const resolved = getSupplierAdapter(SupplierType.GENZSHOP);
      expect(resolved).toBeInstanceOf(GenzShopAdapter);
    });

    it("should resolve GenzShopAdapter case-insensitively", () => {
      const resolved = getSupplierAdapter("genzshop");
      expect(resolved).toBeInstanceOf(GenzShopAdapter);
    });
  });

  describe("checkBalance", () => {
    it("should fetch balance successfully from /balance.php", async () => {
      const mockResponse = {
        success: true,
        walletCurrency: "VND",
        balance: 250000,
        balanceText: "250.000 VND",
      };

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const balance = await adapter.checkBalance(mockCreds);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://genzshop.vn/api/partner/v1/balance.php",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-API-Key": "gzsk_test_mock_key_123456",
          }),
        })
      );
      expect(balance).toBe(250000);
    });

    it("should throw an error when checkBalance returns failure status", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, errorCode: "UNAUTHORIZED", detail: "Invalid key" }),
      } as any);

      await expect(adapter.checkBalance(mockCreds)).rejects.toThrow(/status 401|Invalid key/i);
    });
  });

  describe("fetchProductInfo", () => {
    it("should fetch products from /products.php and return info for target product_id", async () => {
      const mockResponse = {
        success: true,
        walletCurrency: "VND",
        products: [
          {
            product_id: "CUR-0010",
            name: "API Cursor 30 Ngày",
            description: "1300 Request",
            type: "cursor",
            walletPricing: 100000,
            available: 12,
          },
          {
            product_id: "GEM-0099",
            name: "API Gemini",
            description: "100$ Credit",
            type: "gemini",
            walletPricing: 100000,
            available: 99,
          },
        ],
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const info = await adapter.fetchProductInfo(mockCreds, "CUR-0010");

      expect(info).toEqual({
        supplierProductCode: "CUR-0010",
        name: "API Cursor 30 Ngày",
        price: 100000,
        inStock: 12,
      });
    });

    it("should throw an error if product code is not found in products list", async () => {
      const mockResponse = {
        success: true,
        products: [
          {
            product_id: "CUR-0010",
            name: "API Cursor 30 Ngày",
            walletPricing: 100000,
            available: 12,
          },
        ],
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      await expect(adapter.fetchProductInfo(mockCreds, "UNKNOWN-SKU")).rejects.toThrow(
        /not found/i
      );
    });
  });

  describe("buyProduct", () => {
    it("should successfully purchase and parse delivered accounts", async () => {
      const mockResponse = {
        success: true,
        order_id: "GZ-ORD-8899",
        deliveredAccounts: ["sk-cursor-key-001", "sk-cursor-key-002"],
      };

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await adapter.buyProduct(
        mockCreds,
        "CUR-0010",
        2,
        "MYSTORE-ORD-1234"
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://genzshop.vn/api/partner/v1/purchase.php",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-Key": "gzsk_test_mock_key_123456",
          }),
          body: JSON.stringify({
            product_id: "CUR-0010",
            quantity: 2,
            idempotency_key: "MYSTORE-ORD-1234",
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.upstreamOrderId).toBe("GZ-ORD-8899");
      expect(result.deliveredKeys).toEqual(["sk-cursor-key-001", "sk-cursor-key-002"]);
    });

    it("should handle error response (e.g. INSUFFICIENT_BALANCE or OUT_OF_STOCK)", async () => {
      const mockResponse = {
        success: false,
        errorCode: "INSUFFICIENT_BALANCE",
        detail: "Số dư ví không đủ. Cần 150.000 VND, số dư hiện tại 0 VND.",
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      } as any);

      const result = await adapter.buyProduct(
        mockCreds,
        "CUR-0010",
        1,
        "MYSTORE-ORD-1235"
      );

      expect(result.success).toBe(false);
      expect(result.deliveredKeys).toEqual([]);
      expect(result.error).toContain("Số dư ví không đủ");
    });
  });

  describe("URL Normalization", () => {
    it("should normalize baseUrl if provided without /api/partner/v1", async () => {
      const credsWithoutPath: SupplierCredentials = {
        baseUrl: "https://genzshop.vn/",
        apiKey: "test-key",
      };

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, balance: 50000 }),
      } as any);

      await adapter.checkBalance(credsWithoutPath);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://genzshop.vn/api/partner/v1/balance.php",
        expect.anything()
      );
    });
  });
});
