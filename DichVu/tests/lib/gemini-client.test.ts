import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PROMPT_CATEGORIES,
  buildClarifySystemPrompt,
  buildGenerateSystemPrompt,
} from "@/lib/prompt-master-constants";
import { callGeminiClarify, callGeminiGenerateStream, GeminiApiError } from "@/lib/gemini-client";

describe("Prompt Master Constants & Gemini Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("should define all 5 supported prompt categories", () => {
    expect(PROMPT_CATEGORIES.some((c) => c.id === "coding")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "content")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "marketing")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "image")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "general")).toBe(true);
  });

  it("should build valid system instructions for clarify and generate", () => {
    const clarifyPrompt = buildClarifySystemPrompt("coding");
    expect(clarifyPrompt).toContain("questions");
    expect(clarifyPrompt).toContain("JSON");

    const genPrompt = buildGenerateSystemPrompt("coding");
    expect(genPrompt.toLowerCase()).toContain("role");
    expect(genPrompt.toLowerCase()).toContain("instructions");
  });

  it("should call Gemini clarify and parse structured questions JSON", async () => {
    const mockJson = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  questions: [
                    {
                      id: "framework",
                      question: "Bạn dùng framework nào?",
                      options: ["Next.js", "Express", "FastAPI"],
                    },
                  ],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    } as any);

    const result = await callGeminiClarify("viết bot cào dữ liệu", "coding");
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].id).toBe("framework");
    expect(result.questions[0].options).toContain("Next.js");
  });

  it("should call Gemini generate and return a ReadableStream", async () => {
    const encoder = new TextEncoder();
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"# Master Prompt"}]},"finishReason":"STOP"}]}\n\n')
        );
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    } as any);

    const stream = await callGeminiGenerateStream("tạo web bán hàng", "coding", {
      framework: "Next.js",
    });
    expect(stream).toBeDefined();

    const reader = stream.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("# Master Prompt");
  });

  it("retries temporary overloads before returning clarification questions", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.mocked(fetch)
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(Response.json({
        candidates: [{ content: { parts: [{ text: '{"is_sufficient":true,"questions":[]}' }] } }],
      }));
    const result = expect(callGeminiClarify("tạo website", "coding"))
      .resolves.toMatchObject({ isSufficient: true });
    await vi.runAllTimersAsync();
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain("test-gemini-key");
    expect(options?.headers).toMatchObject({ "x-goog-api-key": "test-gemini-key" });
  });

  it("stops after three temporary failures without leaking upstream error bodies", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(async () => new Response("private upstream data", { status: 503 }));
    const result = expect(callGeminiClarify("tạo website", "coding"))
      .rejects.toThrow("Gemini API error (503)");
    await vi.runAllTimersAsync();
    await result;
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry invalid credentials", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("invalid key", { status: 403 }));
    await expect(callGeminiClarify("tạo website", "coding")).rejects.toMatchObject({ status: 403 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not mistake invalid clarification JSON for a sufficiently detailed idea", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({
      candidates: [{ content: { parts: [{ text: '{"questions":[' }] } }],
    }));
    await expect(callGeminiClarify("tạo website", "coding")).rejects.toBeInstanceOf(GeminiApiError);
  });

  it("keeps all output parts and Vietnamese characters across split SSE bytes", async () => {
    const bytes = new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"hidden","thought":true},{"text":"Ý tưởng"},{"text":" hoàn chỉnh"}]},"finishReason":"STOP"}]}\r\n\r\n');
    const split = bytes.indexOf(0xc3) + 1;
    vi.mocked(fetch).mockResolvedValue(new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, split));
        controller.enqueue(bytes.slice(split));
        controller.close();
      },
    })));
    const stream = await callGeminiGenerateStream("tạo website", "coding");
    expect(await new Response(stream).text()).toBe("Ý tưởng hoàn chỉnh");
  });

  it.each([
    'data: {"error":{"code":503,"message":"overloaded"}}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"partial"}]}}]}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"partial"}]},"finishReason":"MAX_TOKENS"}]}\n\n',
  ])("rejects an errored or incomplete upstream stream: %s", async (sse) => {
    vi.mocked(fetch).mockResolvedValue(new Response(sse));
    const stream = await callGeminiGenerateStream("tạo website", "coding");
    await expect(new Response(stream).text()).rejects.toBeInstanceOf(GeminiApiError);
  });
});
