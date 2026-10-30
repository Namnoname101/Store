import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_URL = "https://genzshop.vn/api/check-usage.php";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey, action, page, limit } = body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập API Key để kiểm tra." },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {
      apiKey: apiKey.trim(),
    };

    if (action) payload.action = action;
    if (page !== undefined) payload.page = page;
    if (limit !== undefined) payload.limit = limit;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await upstreamResponse.json().catch(() => null);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: `Máy chủ kiểm tra trả về mã lỗi ${upstreamResponse.status}. Vui lòng thử lại sau.`,
        },
        { status: upstreamResponse.status || 502 }
      );
    }

    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch (err: any) {
    console.error("[POST /api/check-usage Error]:", err);
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Yêu cầu kiểm tra bị quá thời gian chờ (15s). Vui lòng thử lại." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: err?.message || "Không thể kết nối đến hệ thống kiểm tra." },
      { status: 500 }
    );
  }
}
