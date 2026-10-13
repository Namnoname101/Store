import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { GET as usageHandler } from "@/app/api/developer/usage/route";
import { GET as logsHandler } from "@/app/api/developer/logs/route";
import { computeKeyFingerprint } from "@/lib/key-security";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { NextRequest } from "next/server";

describe("Developer Dashboard & Analytics API Tests", () => {
  const testApiKey = "sk-developer-test-key-12345678";
  let testBindingId: string;

  beforeEach(async () => {
    const fingerprint = computeKeyFingerprint(testApiKey);
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: 888123,
        keyFingerprint: fingerprint,
        maskedKey: "sk-devel...5678",
        keyName: "Dev Dashboard Key",
        status: "ACTIVE",
        totalCreditUsd: 20,
      },
    });
    testBindingId = binding.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (testBindingId) {
      await prisma.customerApiKeyBinding.delete({ where: { id: testBindingId } }).catch(() => {});
    }
  });

  it("should reject GET /api/developer/usage if no API Key provided with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/developer/usage", {
      method: "GET",
    });

    const res = await usageHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("API Key");
  });

  it("should reject GET /api/developer/usage for unrecognized key not in store with 404", async () => {
    const req = new NextRequest("http://localhost:3000/api/developer/usage", {
      method: "GET",
      headers: {
        "x-api-key": "sk-unrecognized-key-000000000",
      },
    });

    const res = await usageHandler(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("không thuộc hệ thống");
  });

  it("should return token usage and calculate USD balance for valid store key", async () => {
    vi.spyOn(ModelApiService, "fetchTokenUsage").mockResolvedValue({
      success: true,
      data: {
        quota: 5000000,
        used_quota: 2500000,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/developer/usage", {
      method: "GET",
      headers: {
        "x-api-key": testApiKey,
      },
    });

    const res = await usageHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.quota).toBe(5000000);
    expect(data.usedQuota).toBe(2500000);
    expect(data.balanceUsd).toBe(10);
    expect(data.usedUsd).toBe(5);
    expect(data.maskedKey).toBe("sk-devel...5678");
    expect(data.keyName).toBe("Dev Dashboard Key");
  });

  it("should correctly parse real upstream New API token_usage format (total_available, total_used, total_granted)", async () => {
    vi.spyOn(ModelApiService, "fetchTokenUsage").mockResolvedValue({
      code: true,
      data: {
        total_available: 4931088,
        total_granted: 5000000,
        total_used: 68912,
        name: "QUOCSCHOOL",
        object: "token_usage",
        unlimited_quota: false,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/developer/usage", {
      method: "GET",
      headers: {
        "x-api-key": testApiKey,
      },
    });

    const res = await usageHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.quota).toBe(4931088);
    expect(data.usedQuota).toBe(68912);
    expect(data.totalGrantedQuota).toBe(5000000);
    expect(data.balanceUsd).toBeCloseTo(9.862, 2);
    expect(data.usedUsd).toBeCloseTo(0.138, 2);
    expect(data.totalGrantedUsd).toBe(10);
    expect(data.consumptionRate).toBe(1.4);
    expect(data.isLowCredit).toBe(false);
  });

  it("should return paginated logs for valid store key", async () => {
    vi.spyOn(ModelApiService, "fetchTokenLogs").mockResolvedValue({
      success: true,
      data: [
        {
          id: 101,
          created_at: 1710000000,
          model_name: "gpt-4o",
          quota: 5000,
          prompt_tokens: 150,
          completion_tokens: 80,
        },
      ],
      total: 1,
    });

    const req = new NextRequest("http://localhost:3000/api/developer/logs?page=1&pageSize=10", {
      method: "GET",
      headers: {
        "x-api-key": testApiKey,
      },
    });

    const res = await logsHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.logs.length).toBe(1);
    expect(data.logs[0].model_name).toBe("gpt-4o");
  });
});
