import { NextRequest, NextResponse } from "next/server";
import { getLiveProductStock } from "@/services/live-stock.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`live-stock:${clientIp}`, {
      limit: 60, // 60 requests per minute per IP
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many live stock requests. Please wait." },
        { status: 429 }
      );
    }

    const { slug } = await Promise.resolve(params);
    if (!slug) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }

    const force = req.nextUrl.searchParams.get("force") === "true";
    const result = await getLiveProductStock(slug, force);

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to check live stock" },
      { status: 500 }
    );
  }
}
