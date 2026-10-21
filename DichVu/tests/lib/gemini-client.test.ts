import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PROMPT_CATEGORIES,
  buildClarifySystemPrompt,
  buildGenerateSystemPrompt,
} from "@/lib/prompt-master-constants";
import { callGeminiClarify, callGeminiGenerateStream } from "@/lib/gemini-client";

describe("Prompt Master Constants & Gemini Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = "test-gemini-key";
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
          encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"# Master Prompt"}]}}]}\n\n')
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
});
