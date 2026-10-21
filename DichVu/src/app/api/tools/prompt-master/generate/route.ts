import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { callGeminiGenerateStream } from "@/lib/gemini-client";
import { CategoryType, PROMPT_CATEGORIES } from "@/lib/prompt-master-constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`prompt-generate:${clientIp}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Bạn đã vượt quá giới hạn 10 lượt tạo Master Prompt/giờ. Vui lòng thử lại sau.",
          reset: rateCheck.reset,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, rateCheck.reset - Math.floor(Date.now() / 1000))),
          },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Dữ liệu yêu cầu không hợp lệ." }, { status: 400 });
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const category = body.category as CategoryType;
    const answers = body.answers && typeof body.answers === "object" ? body.answers : undefined;

    if (!prompt || prompt.length < 3) {
      return NextResponse.json(
        { error: "Vui lòng nhập câu prompt có độ dài tối thiểu 3 ký tự." },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "Câu prompt không được vượt quá 1000 ký tự." },
        { status: 400 }
      );
    }

    const validCategories = PROMPT_CATEGORIES.map((c) => c.id);
    const resolvedCategory: CategoryType = validCategories.includes(category)
      ? category
      : "general";

    const rawStream = await callGeminiGenerateStream(prompt, resolvedCategory, answers);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const sseTransform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk);
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      },
      flush(controller) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      },
    });

    const sseStream = rawStream.pipeThrough(sseTransform);

    return new Response(sseStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("[Prompt Master Generate Error]:", err);
    return NextResponse.json(
      {
        error: "Không thể tạo Master Prompt lúc này. Vui lòng thử lại sau.",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
