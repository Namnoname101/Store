import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/cron/sync-suppliers/route";
import * as pricingService from "@/services/pricing.service";

describe("Supplier Auto-Sync Cron Route (/api/cron/sync-suppliers)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject unauthorized requests with 401 status", async () => {
    const req = new NextRequest("https://example.com/api/cron/sync-suppliers", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.1",
        host: "daitruong-store.fly.dev",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Unauthorized");
  });

  it("should authorize requests with valid x-cron-secret and run syncAllActiveSuppliers", async () => {
    vi.spyOn(pricingService, "syncAllActiveSuppliers").mockResolvedValueOnce({
      totalMappings: 5,
      syncedCount: 5,
      pausedCount: 1,
      errors: [],
    });

    const req = new NextRequest("https://example.com/api/cron/sync-suppliers", {
      method: "POST",
      headers: {
        "x-cron-secret": "internal_sync_secret_token",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.totalMappings).toBe(5);
    expect(data.syncedCount).toBe(5);
    expect(data.pausedCount).toBe(1);
    expect(pricingService.syncAllActiveSuppliers).toHaveBeenCalledTimes(1);
  });

  it("should also support GET requests with secret query parameter", async () => {
    vi.spyOn(pricingService, "syncAllActiveSuppliers").mockResolvedValueOnce({
      totalMappings: 2,
      syncedCount: 2,
      pausedCount: 0,
      errors: [],
    });

    const req = new NextRequest(
      "https://example.com/api/cron/sync-suppliers?secret=internal_sync_secret_token",
      {
        method: "GET",
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.syncedCount).toBe(2);
  });
});
