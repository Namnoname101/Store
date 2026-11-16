import {
  CategoryType,
  ClarifyResult,
  OutputFormatType,
  TargetAiType,
  buildClarifySystemPrompt,
  buildGenerateSystemPrompt,
} from "./prompt-master-constants";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiApiError extends Error {
  constructor(public readonly status: number) {
    super(`Gemini API error (${status})`);
    this.name = "GeminiApiError";
  }

  get retryable(): boolean {
    return [429, 500, 502, 503, 504].includes(this.status);
  }
}

export function getGeminiErrorMessage(error: unknown): string {
  return error instanceof GeminiApiError && error.retryable
    ? "AI đang quá tải hoặc phản hồi chậm. Vui lòng thử lại sau ít phút."
    : "Không thể kết nối dịch vụ AI lúc này. Vui lòng thử lại sau.";
}

async function requestGemini(
  operation: "generateContent" | "streamGenerateContent",
  payload: object
): Promise<Response> {
  const apiKey = getApiKey();
  const query = operation === "streamGenerateContent" ? "?alt=sse" : "";
  const candidateModels = [getModel(), "gemini-3.5-flash-lite", "gemini-flash-lite-latest"].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  );

  for (let attempt = 0; ; attempt++) {
    const currentModel = candidateModels[attempt % candidateModels.length];
    const url = `${GEMINI_BASE_URL}/models/${currentModel}:${operation}${query}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(operation === "generateContent" ? 20_000 : 60_000),
      });
      if (response.ok) return response;

      await response.body?.cancel();
      throw new GeminiApiError(response.status);
    } catch (error) {
      const failure = error instanceof GeminiApiError
        ? error
        : error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
          ? new GeminiApiError(504)
          : error instanceof TypeError
            ? new GeminiApiError(503)
            : error;

      if (!(failure instanceof GeminiApiError) || !failure.retryable || attempt >= 2) {
        throw failure;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return key;
}

function getModel(): string {
  return process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
}

/**
 * Calls Gemini API to generate 2-3 structured clarification questions in JSON.
 */
export async function callGeminiClarify(
  prompt: string,
  category: CategoryType
): Promise<ClarifyResult> {
  const systemInstruction = buildClarifySystemPrompt(category);

  const response = await requestGemini("generateContent", {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\nCâu yêu cầu của người dùng: "${prompt}"`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
  });

  const data = await response.json();
  const rawText = (data.candidates?.[0]?.content?.parts || [])
    .filter((part: { thought?: boolean; text?: string }) => !part.thought)
    .map((part: { text?: string }) => part.text || "")
    .join("");

  if (!rawText) {
    throw new GeminiApiError(502);
  }

  try {
    const parsed = JSON.parse(rawText);
    const isSufficient = Boolean(parsed.is_sufficient ?? (parsed.questions?.length === 0));
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const validCats = ["coding", "content", "marketing", "image", "general"];
    const detectedCategory = validCats.includes(parsed.detected_category)
      ? (parsed.detected_category as CategoryType)
      : (category === "auto" ? "general" : category);

    return {
      detectedCategory,
      isSufficient: isSufficient || questions.length === 0,
      reason: parsed.reason,
      questions: isSufficient ? [] : questions,
    };
  } catch {
    throw new GeminiApiError(502);
  }
}

/**
 * Calls Gemini streamGenerateContent and returns a ReadableStream emitting text chunks.
 */
export async function callGeminiGenerateStream(
  prompt: string,
  category: CategoryType,
  answers?: Record<string, string>,
  formatType?: OutputFormatType,
  targetAi?: TargetAiType
): Promise<ReadableStream<Uint8Array>> {
  const systemInstruction = buildGenerateSystemPrompt(category, answers, formatType, targetAi);

  const response = await requestGemini("streamGenerateContent", {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\nÝ tưởng ban đầu của người dùng:\n"${prompt}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
  });

  if (!response.body) {
    throw new GeminiApiError(503);
  }

  const rawStream = response.body;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let buffer = "";
  let hasText = false;
  let finished = false;

  function emitLine(line: string, controller: TransformStreamDefaultController<Uint8Array>) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;

    let data;
    try {
      data = JSON.parse(trimmed.slice(5).trim());
    } catch {
      throw new GeminiApiError(502);
    }
    if (data.error) {
      throw new GeminiApiError(Number(data.error.code) || 503);
    }
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP") throw new GeminiApiError(502);
    if (finishReason === "STOP") finished = true;
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (typeof part.text === "string" && part.text && !part.thought) {
        hasText = true;
        controller.enqueue(encoder.encode(part.text));
      }
    }
  }

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        emitLine(line, controller);
      }
    },
    flush(controller) {
      emitLine(buffer + decoder.decode(), controller);
      if (!hasText || !finished) throw new GeminiApiError(502);
    },
  });

  return rawStream.pipeThrough(transformStream);
}
