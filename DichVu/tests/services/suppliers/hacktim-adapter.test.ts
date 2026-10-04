import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HackTimAdapter } from "@/services/suppliers/adapters/hacktim.adapter";
import { SupplierCredentials } from "@/services/suppliers/supplier-adapter.interface";

describe("HackTimAdapter", () => {
  let adapter: HackTimAdapter;
  const mockCreds: SupplierCredentials = {
    baseUrl: "https://hacktim.com/api/v2",
    apiKey: "test-hacktim-key",
  };

  beforeEach(() => {
    adapter = new HackTimAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkBalance", () => {
    it("should fetch balance and convert USD to VND accurately", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          balance: 10,
          currency: "USD",
        }),
      } as Response);

      const balanceVND = await adapter.checkBalance(mockCreds);
      // 10 USD * 27,000 = 270,000 VND
      expect(balanceVND).toBe(270000);
    });

    it("should handle error when checking balance", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(adapter.checkBalance(mockCreds)).rejects.toThrow();
    });
  });

  describe("fetchProductInfo", () => {
    it("should fetch service info and return cost in VND", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            service: 6799,
            name: "TikTok Likes Việt Nam",
            rate: 0.146, // 0.146 USD per 1000
            min: 50,
            max: 15000,
            category: "Tiktok",
          },
        ],
      } as Response);

      const info = await adapter.fetchProductInfo(mockCreds, "6799");
      expect(info.supplierProductCode).toBe("6799");
      expect(info.name).toBe("TikTok Likes Việt Nam");
      // 0.146 * 27000 = 3942 VND per 1000
      expect(info.price).toBeGreaterThan(0);
      expect(info.inStock).toBeGreaterThan(0);
    });

    it("should throw error if service is not found", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await expect(
        adapter.fetchProductInfo(mockCreds, "999999")
      ).rejects.toThrow("Service 999999 not found");
    });
  });

  describe("buyProduct", () => {
    it("should submit order with link and quantity to hacktim.com", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order: 123456,
        }),
      } as Response);

      const result = await adapter.buyProduct(
        mockCreds,
        "6799",
        1000,
        "ORD123456",
        { link: "https://www.tiktok.com/@user/video/123" }
      );

      expect(result.success).toBe(true);
      expect(result.upstreamOrderId).toBe("123456");
      expect(result.deliveredKeys.length).toBeGreaterThan(0);
      expect(result.deliveredKeys[0]).toContain("123456");
    });

    it("should handle error from hacktim API", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: "Not enough funds on balance",
        }),
      } as Response);

      const result = await adapter.buyProduct(
        mockCreds,
        "6799",
        1000,
        "ORD123456"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not enough funds");
    });
  });
});
