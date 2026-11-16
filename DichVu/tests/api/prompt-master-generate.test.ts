import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tools/prompt-master/generate/route";
import { NextRequest } from "next/server";
import * as geminiClient from "@/lib/gemini-client";
import * as rateLimiter from "@/lib/rate-limiter";

describe("POST /api/tools/prompt-master/generate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 if prompt is missing or shorter than 3 characters", async () => {
    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "x", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("should return 429 if generate rate limit is exceeded", async () => {
    vi.spyOn(rateLimiter, "checkRateLimit").mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 3600,
    });

    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "tạo auth jwt nextjs", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("quá giới hạn");
  });

  it("should stream response with text/event-stream headers and SSE chunks", async () => {
    vi.spyOn(rateLimiter, "checkRateLimit").mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Math.floor(Date.now() / 1000) + 3600,
    });

    const encoder = new TextEncoder();
    const mockRawStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("# Master Prompt for Next.js"));
        controller.close();
      },
    });

    const streamSpy = vi
      .spyOn(geminiClient, "callGeminiGenerateStream")
      .mockResolvedValue(mockRawStream);

    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt: "tạo auth jwt nextjs",
        category: "coding",
        answers: { stack: "TypeScript" },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("cache-control")).toContain("no-cache");

    expect(streamSpy).toHaveBeenCalledWith(
      "tạo auth jwt nextjs",
      "coding",
      {
        stack: "TypeScript",
      },
      "standard",
      "all"
    );

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    const { value } = await reader!.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("data: ");
    expect(text).toContain("# Master Prompt for Next.js");
  });

  it("returns a useful 503 response when the AI remains unavailable", async () => {
    vi.spyOn(geminiClient, "callGeminiGenerateStream").mockRejectedValue(new geminiClient.GeminiApiError(503));
    const res = await POST(new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST", body: JSON.stringify({ prompt: "tạo website", category: "coding" }),
    }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("quá tải");
  });

  it("sends an SSE error without a success marker after a mid-stream failure", async () => {
    let sent = false;
    vi.spyOn(geminiClient, "callGeminiGenerateStream").mockResolvedValue(new ReadableStream({
      pull(controller) {
        if (!sent) {
          sent = true;
          controller.enqueue(new TextEncoder().encode("partial prompt"));
        } else {
          controller.error(new geminiClient.GeminiApiError(503));
        }
      },
    }));
    const res = await POST(new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST", body: JSON.stringify({ prompt: "tạo website", category: "coding" }),
    }));
    const sse = await res.text();
    expect(sse).toContain("partial prompt");
    expect(sse).toContain('"error":');
    expect(sse).not.toContain("[DONE]");
  });

  it("preserves Vietnamese characters split between output chunks", async () => {
    const bytes = new TextEncoder().encode("Ý tưởng hoàn chỉnh");
    vi.spyOn(geminiClient, "callGeminiGenerateStream").mockResolvedValue(new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 1));
        controller.enqueue(bytes.slice(1));
        controller.close();
      },
    }));
    const res = await POST(new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST", body: JSON.stringify({ prompt: "tạo website", category: "coding" }),
    }));
    const sse = await res.text();
    expect(sse).toContain("Ý tưởng hoàn chỉnh");
    expect(sse).toContain("[DONE]");
    expect(sse).not.toContain("�");
  });
});
