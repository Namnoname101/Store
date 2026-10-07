import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HackTimAdapter } from "@/services/suppliers/adapters/hacktim.adapter";
import { SupplierCredentials } from "@/services/suppliers/supplier-adapter.interface";

describe("HackTimAdapter checkOrderStatus", () => {
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

  it("should parse HackTim order status response correctly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        charge: "0.278",
        start_count: "1250",
        status: "In progress",
        remains: "250",
      }),
    } as Response);

    const result = await adapter.checkOrderStatus(mockCreds, "999888");

    expect(result.status).toBe("IN_PROGRESS");
    expect(result.startCount).toBe(1250);
    expect(result.remains).toBe(250);
    expect(result.rawStatus).toBe("In progress");
  });

  it("should map Completed and Pending statuses properly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        charge: "0.5",
        start_count: "500",
        status: "Completed",
        remains: "0",
      }),
    } as Response);

    const result = await adapter.checkOrderStatus(mockCreds, "111222");

    expect(result.status).toBe("COMPLETED");
    expect(result.startCount).toBe(500);
    expect(result.remains).toBe(0);
  });

  it("should handle error response gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: "Incorrect order ID",
      }),
    } as Response);

    const result = await adapter.checkOrderStatus(mockCreds, "invalid-id");

    expect(result.status).toBe("PROCESSING");
    expect(result.error).toContain("Incorrect order ID");
  });
});
