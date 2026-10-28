import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tools/prompt-master/clarify/route";
import { NextRequest } from "next/server";
import * as geminiClient from "@/lib/gemini-client";
import * as rateLimiter from "@/lib/rate-limiter";

describe("POST /api/tools/prompt-master/clarify", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 if prompt is missing or shorter than 3 characters", async () => {
    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/clarify", {
      method: "POST",
      body: JSON.stringify({ prompt: "ab", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("should return 400 if prompt exceeds 1000 characters", async () => {
    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/clarify", {
      method: "POST",
      body: JSON.stringify({ prompt: "a".repeat(1005), category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("1000");
  });

  it("should return 429 if rate limit is exceeded", async () => {
    vi.spyOn(rateLimiter, "checkRateLimit").mockReturnValue({
      success: false,
      limit: 15,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 3600,
    });

    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/clarify", {
      method: "POST",
      body: JSON.stringify({ prompt: "viết bot telegram", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("quá giới hạn");
  });

  it("should return clarify questions on valid request", async () => {
    vi.spyOn(rateLimiter, "checkRateLimit").mockReturnValue({
      success: true,
      limit: 15,
      remaining: 14,
      reset: Math.floor(Date.now() / 1000) + 3600,
    });

    vi.spyOn(geminiClient, "callGeminiClarify").mockResolvedValue({
      isSufficient: false,
      questions: [
        {
          id: "library",
          question: "Bạn muốn dùng thư viện nào?",
          options: ["Grammy", "Telegraf"],
        },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/clarify", {
      method: "POST",
      body: JSON.stringify({ prompt: "viết bot telegram", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.questions).toHaveLength(1);
    expect(data.questions[0].id).toBe("library");
  });
});
