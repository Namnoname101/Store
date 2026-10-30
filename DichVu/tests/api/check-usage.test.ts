import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/check-usage/route";
import { NextRequest } from "next/server";

describe("API Route: POST /api/check-usage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 if apiKey is missing or empty", async () => {
    const req = new NextRequest("http://localhost:3000/api/check-usage", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Vui lòng nhập API Key");
  });

  it("should forward request to upstream partner with browser headers and return result", async () => {
    const mockUpstreamResponse = {
      success: true,
      usage: {
        totalCost: 15.2,
        costLimit: 50.0,
        totalRequests: 540,
        totalTokens: 1250000,
        status: "Active",
      },
      daily: [],
      overage: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: vi.fn().mockResolvedValue(mockUpstreamResponse),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/check-usage", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-ant-api03-test-mock-key",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.usage.totalCost).toBe(15.2);
    expect(data.usage.totalRequests).toBe(540);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://genzshop.vn/api/check-usage.php",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "User-Agent": expect.stringContaining("Mozilla/5.0"),
        }),
      })
    );
  });

  it("should support action 'requests' with pagination parameters", async () => {
    const mockRequestsResponse = {
      success: true,
      total: 50,
      requests: [{ id: 1, model: "claude-3-5-sonnet", cost: 0.02 }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: vi.fn().mockResolvedValue(mockRequestsResponse),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/check-usage", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-ant-api03-test-mock-key",
        action: "requests",
        page: 2,
        limit: 20,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.requests.length).toBe(1);
    expect(data.total).toBe(50);
  });
});
