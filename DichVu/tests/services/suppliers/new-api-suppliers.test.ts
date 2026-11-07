import { describe, it, expect, beforeEach } from "vitest";
import { getSupplierAdapter, resetAdapterRegistry } from "../../../src/services/suppliers/adapter.registry";
import { CanbosoAdapter } from "../../../src/services/suppliers/adapters/canboso.adapter";
import { DbotAdapter } from "../../../src/services/suppliers/adapters/dbot.adapter";
import { KhoMmoAdapter } from "../../../src/services/suppliers/adapters/khommo.adapter";

describe("New API Suppliers (Canboso, DBot, KhoMMO)", () => {
  beforeEach(() => {
    resetAdapterRegistry();
  });

  it("should resolve Canboso adapter for CANBOSO_BUYER, DKEY, and HXN", () => {
    const adapter1 = getSupplierAdapter("CANBOSO_BUYER");
    const adapter2 = getSupplierAdapter("DKEY");
    const adapter3 = getSupplierAdapter("HXN");

    expect(adapter1).toBeInstanceOf(CanbosoAdapter);
    expect(adapter2).toBeInstanceOf(CanbosoAdapter);
    expect(adapter3).toBeInstanceOf(CanbosoAdapter);
  });

  it("should resolve DBot adapter for DBOT_API and CHODAUMOI", () => {
    const adapter1 = getSupplierAdapter("DBOT_API");
    const adapter2 = getSupplierAdapter("CHODAUMOI");

    expect(adapter1).toBeInstanceOf(DbotAdapter);
    expect(adapter2).toBeInstanceOf(DbotAdapter);
  });

  it("should resolve KhoMMO adapter for KHOMMO_API and KHOMMO", () => {
    const adapter1 = getSupplierAdapter("KHOMMO_API");
    const adapter2 = getSupplierAdapter("KHOMMO");

    expect(adapter1).toBeInstanceOf(KhoMmoAdapter);
    expect(adapter2).toBeInstanceOf(KhoMmoAdapter);
  });

  it("should mock buyProduct safely in test environment for all new adapters", async () => {
    const canboso = getSupplierAdapter("DKEY");
    const dbot = getSupplierAdapter("CHODAUMOI");
    const khommo = getSupplierAdapter("KHOMMO");

    const res1 = await canboso.buyProduct(
      { baseUrl: "https://canboso.com", apiKey: "test" },
      "prod_dkey_123",
      1,
      "ORD_TEST_1"
    );
    expect(res1.success).toBe(true);
    expect(res1.deliveredKeys.length).toBeGreaterThan(0);

    const res2 = await dbot.buyProduct(
      { baseUrl: "https://dbot.pro.vn", apiKey: "test" },
      "prod_dbot_123",
      1,
      "ORD_TEST_2"
    );
    expect(res2.success).toBe(true);
    expect(res2.deliveredKeys.length).toBeGreaterThan(0);

    const res3 = await khommo.buyProduct(
      { baseUrl: "https://api.khommo.vn", apiKey: "test" },
      "prod_khommo_123",
      1,
      "ORD_TEST_3"
    );
    expect(res3.success).toBe(true);
    expect(res3.deliveredKeys.length).toBeGreaterThan(0);
  });
});
