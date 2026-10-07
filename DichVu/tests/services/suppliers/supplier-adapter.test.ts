import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SupplierType } from "../../../src/lib/prisma";
import {
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
  ISupplierAdapter,
} from "../../../src/services/suppliers/supplier-adapter.interface";
import { MockSupplierAdapter } from "../../../src/services/suppliers/adapters/mock.adapter";
import { TaphoammoAdapter } from "../../../src/services/suppliers/adapters/taphoammo.adapter";
import { TrumtheAdapter } from "../../../src/services/suppliers/adapters/trumthe.adapter";
import {
  getSupplierAdapter,
  registerSupplierAdapter,
  resetAdapterRegistry,
} from "../../../src/services/suppliers/adapter.registry";

describe("Supplier Adapter Engine", () => {
  const mockCreds: SupplierCredentials = {
    baseUrl: "https://api.supplier.example.com",
    apiKey: "test-api-key-xyz",
    apiSecret: "test-secret-123",
  };

  describe("MockSupplierAdapter", () => {
    let mockAdapter: MockSupplierAdapter;

    beforeEach(() => {
      mockAdapter = new MockSupplierAdapter();
    });

    it("should return configured balance", async () => {
      mockAdapter.setBalance(350000);
      const balance = await mockAdapter.checkBalance(mockCreds);
      expect(balance).toBe(350000);
    });

    it("should return configured product info", async () => {
      mockAdapter.setProduct("NETFLIX_1M", {
        name: "Netflix Premium 1 Month",
        price: 65000,
        inStock: 15,
      });

      const product = await mockAdapter.fetchProductInfo(mockCreds, "NETFLIX_1M");
      expect(product).toEqual({
        supplierProductCode: "NETFLIX_1M",
        name: "Netflix Premium 1 Month",
        price: 65000,
        inStock: 15,
      });
    });

    it("should complete successful purchase and deduct stock and balance", async () => {
      mockAdapter.setBalance(200000);
      mockAdapter.setProduct("SPOTIFY_1M", {
        name: "Spotify Premium",
        price: 30000,
        inStock: 5,
        keys: ["SPOTIFY-KEY-001", "SPOTIFY-KEY-002", "SPOTIFY-KEY-003"],
      });

      const result = await mockAdapter.buyProduct(mockCreds, "SPOTIFY_1M", 2, "ORD-1001");

      expect(result.success).toBe(true);
      expect(result.deliveredKeys).toEqual(["SPOTIFY-KEY-001", "SPOTIFY-KEY-002"]);
      expect(result.upstreamOrderId).toBeDefined();

      // Check balance deducted: 200000 - (30000 * 2) = 140000
      const remainingBalance = await mockAdapter.checkBalance(mockCreds);
      expect(remainingBalance).toBe(140000);

      // Check stock deducted: 5 - 2 = 3
      const updatedProduct = await mockAdapter.fetchProductInfo(mockCreds, "SPOTIFY_1M");
      expect(updatedProduct.inStock).toBe(3);
    });

    it("should auto-generate keys when pre-configured keys are empty", async () => {
      mockAdapter.setBalance(500000);
      mockAdapter.setProduct("CANVA_PRO", {
        name: "Canva Pro",
        price: 25000,
        inStock: 10,
      });

      const result = await mockAdapter.buyProduct(mockCreds, "CANVA_PRO", 2, "ORD-1002");
      expect(result.success).toBe(true);
      expect(result.deliveredKeys.length).toBe(2);
      expect(result.deliveredKeys[0]).toContain("CANVA_PRO");
    });

    it("should return OUT_OF_STOCK error when quantity exceeds inStock", async () => {
      mockAdapter.setBalance(500000);
      mockAdapter.setProduct("OFFICE_365", {
        price: 100000,
        inStock: 1,
      });

      const result = await mockAdapter.buyProduct(mockCreds, "OFFICE_365", 2, "ORD-1003");
      expect(result.success).toBe(false);
      expect(result.error).toBe("OUT_OF_STOCK");
      expect(result.deliveredKeys).toEqual([]);
    });

    it("should return INSUFFICIENT_BALANCE error when balance is not enough", async () => {
      mockAdapter.setBalance(40000);
      mockAdapter.setProduct("WINDOWS_11_PRO", {
        price: 50000,
        inStock: 10,
      });

      const result = await mockAdapter.buyProduct(mockCreds, "WINDOWS_11_PRO", 1, "ORD-1004");
      expect(result.success).toBe(false);
      expect(result.error).toBe("INSUFFICIENT_BALANCE");
      expect(result.deliveredKeys).toEqual([]);
    });

    it("should simulate controlled error states via simulateError()", async () => {
      mockAdapter.setBalance(500000);
      mockAdapter.setProduct("VPN_1Y", { price: 20000, inStock: 10 });

      // Simulate OUT_OF_STOCK
      mockAdapter.simulateError("OUT_OF_STOCK");
      let res = await mockAdapter.buyProduct(mockCreds, "VPN_1Y", 1, "ORD-ERR-1");
      expect(res.success).toBe(false);
      expect(res.error).toBe("OUT_OF_STOCK");

      // Simulate INSUFFICIENT_BALANCE
      mockAdapter.simulateError("INSUFFICIENT_BALANCE");
      res = await mockAdapter.buyProduct(mockCreds, "VPN_1Y", 1, "ORD-ERR-2");
      expect(res.success).toBe(false);
      expect(res.error).toBe("INSUFFICIENT_BALANCE");

      // Simulate NETWORK_ERROR
      mockAdapter.simulateError("NETWORK_ERROR");
      res = await mockAdapter.buyProduct(mockCreds, "VPN_1Y", 1, "ORD-ERR-3");
      expect(res.success).toBe(false);
      expect(res.error).toBe("NETWORK_ERROR");

      // Clear error
      mockAdapter.simulateError(null);
      res = await mockAdapter.buyProduct(mockCreds, "VPN_1Y", 1, "ORD-OK-1");
      expect(res.success).toBe(true);
    });
  });

  describe("TaphoammoAdapter", () => {
    let taphoaAdapter: TaphoammoAdapter;
    const originalFetch = global.fetch;

    beforeEach(() => {
      taphoaAdapter = new TaphoammoAdapter();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("should check balance from Taphoammo API", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { balance: 1250000 },
        }),
      } as any);

      const balance = await taphoaAdapter.checkBalance({
        baseUrl: "https://taphoammo.net",
        apiKey: "taphoa_api_key_123",
      });

      expect(balance).toBe(1250000);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("taphoammo.net"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("taphoa_api_key_123"),
          }),
        })
      );
    });

    it("should fetch product information from Taphoammo API", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: "PROD-99",
            name: "Netflix 1M",
            price: 52000,
            in_stock: 42,
          },
        }),
      } as any);

      const product = await taphoaAdapter.fetchProductInfo(
        { baseUrl: "https://taphoammo.net", apiKey: "taphoa_api_key_123" },
        "PROD-99"
      );

      expect(product).toEqual({
        supplierProductCode: "PROD-99",
        name: "Netflix 1M",
        price: 52000,
        inStock: 42,
      });
    });

    it("should sanitize and clean delivered multiline keys from Taphoammo purchase response", async () => {
      const rawKeysText = "user1@mail.com|pass123\r\n  user2@mail.com|pass456 \n\n\r\n user3@mail.com|pass789\r\n";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          order_id: "TAPHOA-ORD-888999",
          data: rawKeysText,
        }),
      } as any);

      const orderResult = await taphoaAdapter.buyProduct(
        { baseUrl: "https://taphoammo.net", apiKey: "taphoa_api_key_123" },
        "PROD-99",
        3,
        "ORD-CLIENT-100"
      );

      expect(orderResult.success).toBe(true);
      expect(orderResult.upstreamOrderId).toBe("TAPHOA-ORD-888999");
      expect(orderResult.deliveredKeys).toEqual([
        "user1@mail.com|pass123",
        "user2@mail.com|pass456",
        "user3@mail.com|pass789",
      ]);
    });

    it("should sanitize and clean delivered array keys from Taphoammo response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          order_id: "TAPHOA-ORD-777",
          data: [" key1|pass1 \r\n", " key2|pass2 "],
        }),
      } as any);

      const orderResult = await taphoaAdapter.buyProduct(
        { baseUrl: "https://taphoammo.net", apiKey: "taphoa_api_key_123" },
        "PROD-99",
        2,
        "ORD-CLIENT-101"
      );

      expect(orderResult.success).toBe(true);
      expect(orderResult.deliveredKeys).toEqual(["key1|pass1", "key2|pass2"]);
    });

    it("should handle error responses from Taphoammo gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: "Số dư tài khoản không đủ để thực hiện giao dịch",
        }),
      } as any);

      const orderResult = await taphoaAdapter.buyProduct(
        { baseUrl: "https://taphoammo.net", apiKey: "taphoa_api_key_123" },
        "PROD-99",
        1,
        "ORD-CLIENT-102"
      );

      expect(orderResult.success).toBe(false);
      expect(orderResult.deliveredKeys).toEqual([]);
      expect(orderResult.error).toContain("Số dư tài khoản không đủ");
    });

    it("should handle network failure from fetch gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection timeout"));

      const orderResult = await taphoaAdapter.buyProduct(
        { baseUrl: "https://taphoammo.net", apiKey: "taphoa_api_key_123" },
        "PROD-99",
        1,
        "ORD-CLIENT-103"
      );

      expect(orderResult.success).toBe(false);
      expect(orderResult.deliveredKeys).toEqual([]);
      expect(orderResult.error).toContain("Connection timeout");
    });
  });

  describe("TrumtheAdapter", () => {
    let trumtheAdapter: TrumtheAdapter;
    const originalFetch = global.fetch;

    beforeEach(() => {
      trumtheAdapter = new TrumtheAdapter();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("should check balance from Trumthe API", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 200,
          balance: 850000,
        }),
      } as any);

      const balance = await trumtheAdapter.checkBalance({
        baseUrl: "https://trumthe.vn",
        apiKey: "trumthe_key",
        apiSecret: "trumthe_secret",
      });

      expect(balance).toBe(850000);
    });

    it("should fetch product information from Trumthe API", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 200,
          data: {
            code: "VIETTEL_50K",
            name: "Thẻ Viettel 50K",
            price: 48000,
            stock: 120,
          },
        }),
      } as any);

      const product = await trumtheAdapter.fetchProductInfo(
        { baseUrl: "https://trumthe.vn", apiKey: "trumthe_key" },
        "VIETTEL_50K"
      );

      expect(product).toEqual({
        supplierProductCode: "VIETTEL_50K",
        name: "Thẻ Viettel 50K",
        price: 48000,
        inStock: 120,
      });
    });

    it("should buy product and parse structured card credentials (pin, serial)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 200,
          trans_id: "TRUMTHE-TX-5544",
          cards: [
            { pin: "889911223344", serial: "1000223344" },
            { pin: "776655443322", serial: "1000223345" },
          ],
        }),
      } as any);

      const result = await trumtheAdapter.buyProduct(
        { baseUrl: "https://trumthe.vn", apiKey: "trumthe_key" },
        "VIETTEL_50K",
        2,
        "ORD-TRUMTHE-1"
      );

      expect(result.success).toBe(true);
      expect(result.upstreamOrderId).toBe("TRUMTHE-TX-5544");
      expect(result.deliveredKeys).toEqual([
        "PIN: 889911223344 | SERI: 1000223344",
        "PIN: 776655443322 | SERI: 1000223345",
      ]);
    });

    it("should handle Trumthe API failure gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          status: 400,
          message: "Mã thẻ hiện tại đang hết hàng",
        }),
      } as any);

      const result = await trumtheAdapter.buyProduct(
        { baseUrl: "https://trumthe.vn", apiKey: "trumthe_key" },
        "VIETTEL_50K",
        1,
        "ORD-TRUMTHE-2"
      );

      expect(result.success).toBe(false);
      expect(result.deliveredKeys).toEqual([]);
      expect(result.error).toContain("Mã thẻ hiện tại đang hết hàng");
    });
  });

  describe("Adapter Registry", () => {
    beforeEach(() => {
      resetAdapterRegistry();
    });

    it("should return TaphoammoAdapter for TAPHOAMMO supplier type", () => {
      const adapter = getSupplierAdapter(SupplierType.TAPHOAMMO);
      expect(adapter).toBeInstanceOf(TaphoammoAdapter);
    });

    it("should return TrumtheAdapter for TRUMTHE supplier type", () => {
      const adapter = getSupplierAdapter(SupplierType.TRUMTHE);
      expect(adapter).toBeInstanceOf(TrumtheAdapter);
    });

    it("should return a valid adapter for CUSTOM_REST supplier type", () => {
      const adapter = getSupplierAdapter(SupplierType.CUSTOM_REST);
      expect(adapter).toBeDefined();
      expect(typeof adapter.checkBalance).toBe("function");
      expect(typeof adapter.buyProduct).toBe("function");
    });

    it("should return LocketAdapter for LOCKET_VN supplier type", () => {
      const adapter = getSupplierAdapter(SupplierType.LOCKET_VN);
      expect(adapter).toBeDefined();
      expect(typeof adapter.fetchProductInfo).toBe("function");
      expect(typeof adapter.buyProduct).toBe("function");
    });

    it("should support registering and overriding custom adapters", () => {
      const customMock = new MockSupplierAdapter();
      registerSupplierAdapter("MOCK", customMock);

      const resolved = getSupplierAdapter("MOCK");
      expect(resolved).toBe(customMock);
    });

    it("should throw error for unsupported supplier type", () => {
      expect(() => getSupplierAdapter("NON_EXISTENT_SUPPLIER")).toThrow(
        /Unsupported supplier type: NON_EXISTENT_SUPPLIER/i
      );
    });
  });

  describe("LocketAdapter", () => {
    let locketAdapter: import("@/services/suppliers/adapters/locket.adapter").LocketAdapter;
    const creds = {
      baseUrl: "https://locket.com.vn/api/reseller/v1",
      apiKey: "ntsh_test_key",
    };

    beforeEach(async () => {
      const { LocketAdapter } = await import("@/services/suppliers/adapters/locket.adapter");
      locketAdapter = new LocketAdapter();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("fetchProductInfo: parses product list and finds product by id", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          products: [
            { id: 19, name: "Gemini 18 Months", price_vnd: 19555, stock: 42 },
            { id: 82, name: "Duolingo 12 Tháng", price_vnd: 17777, stock: 49 },
          ],
        }),
      } as any);

      const info = await locketAdapter.fetchProductInfo(creds, "19");
      expect(info.price).toBe(19555);
      expect(info.inStock).toBe(42);
      expect(info.name).toBe("Gemini 18 Months");
    });

    it("buyProduct: delivers keys on state: done", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          state: "done",
          order_id: 12345,
          items: ["user_gemini@mail.com|pass123456"],
        }),
      } as any);

      const result = await locketAdapter.buyProduct(creds, "19", 1);
      expect(result.success).toBe(true);
      expect(result.deliveredKeys).toEqual(["user_gemini@mail.com|pass123456"]);
      expect(result.upstreamOrderId).toBe("12345");
    });

    it("buyProduct: handles 402 insufficient balance error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        text: async () => "Wallet balance is 0đ",
      } as any);

      const result = await locketAdapter.buyProduct(creds, "19", 1);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Số dư ví");
    });
  });

  describe("TelegramBotAdapter", () => {
    it("should return TelegramBotAdapter for TELEGRAM_BOT supplier type", async () => {
      const adapter = getSupplierAdapter(SupplierType.TELEGRAM_BOT);
      const { TelegramBotAdapter } = await import(
        "../../../src/services/suppliers/adapters/telegram-bot.adapter"
      );
      expect(adapter).toBeInstanceOf(TelegramBotAdapter);
    });

    it("fetchProductInfo returns correct product structure", async () => {
      const adapter = getSupplierAdapter(SupplierType.TELEGRAM_BOT);
      const info = await adapter.fetchProductInfo(
        { baseUrl: "@nghientrickshop_bot", apiKey: "test" },
        "19"
      );
      expect(info.supplierProductCode).toBe("19");
      expect(info.name).toBe("Gemini 18 Months");
      expect(info.price).toBe(14567);
      expect(info.inStock).toBeGreaterThan(0);
    });
  });
});
