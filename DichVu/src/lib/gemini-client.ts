import {
  CategoryType,
  ClarifyQuestion,
  OutputFormatType,
  buildClarifySystemPrompt,
  buildGenerateSystemPrompt,
} from "./prompt-master-constants";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

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
): Promise<{ questions: ClarifyQuestion[] }> {
  const apiKey = getApiKey();
  const model = getModel();
  const systemInstruction = buildClarifySystemPrompt(category);

  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    return { questions: [] };
  }

  try {
    const parsed = JSON.parse(rawText);
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    return { questions };
  } catch (err) {
    return { questions: [] };
  }
}

/**
 * Calls Gemini streamGenerateContent and returns a ReadableStream emitting text chunks.
 */
export async function callGeminiGenerateStream(
  prompt: string,
  category: CategoryType,
  answers?: Record<string, string>,
  formatType?: OutputFormatType
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey();
  const model = getModel();
  const systemInstruction = buildGenerateSystemPrompt(category, answers, formatType);

  const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini streaming error (${response.status}): ${errorBody}`);
  }

  const rawStream = response.body;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let buffer = "";

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const textDelta = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textDelta) {
              controller.enqueue(encoder.encode(textDelta));
            }
          } catch {
            // Ignore non-json or malformed SSE lines
          }
        }
      }
    },
    flush(controller) {
      if (buffer.trim().startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.trim().slice(6));
          const textDelta = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textDelta) {
            controller.enqueue(encoder.encode(textDelta));
          }
        } catch {}
      }
    },
  });

  return rawStream.pipeThrough(transformStream);
}
