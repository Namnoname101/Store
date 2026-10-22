import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { callGeminiClarify } from "@/lib/gemini-client";
import { CategoryType, PROMPT_CATEGORIES } from "@/lib/prompt-master-constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`prompt-clarify:${clientIp}`, {
      limit: 15,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Bạn đã vượt quá giới hạn 15 lượt phân tích/giờ. Vui lòng thử lại sau.",
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

    const clarifyResult = await callGeminiClarify(prompt, resolvedCategory);

    return NextResponse.json({
      success: true,
      isSufficient: clarifyResult.isSufficient,
      reason: clarifyResult.reason,
      questions: clarifyResult.questions,
    });
  } catch (err: any) {
    console.error("[Prompt Master Clarify Error]:", err);
    return NextResponse.json(
      {
        error: "Không thể phân tích prompt vào lúc này. Vui lòng thử lại sau.",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
