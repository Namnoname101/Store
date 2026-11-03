import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";
import { TelegramBotAdapter } from "@/services/suppliers/adapters/telegram-bot.adapter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get("x-internal-secret") || req.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET || "internal_sync_secret_token";
    if (internalSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supplier = await prisma.supplier.findFirst({
      where: { code: "XOAINON_TELE" },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier XOAINON_TELE not found" }, { status: 404 });
    }

    const adapter = getSupplierAdapter(supplier.type) as TelegramBotAdapter;
    const creds = {
      baseUrl: supplier.baseUrl,
      apiKey: supplier.apiKey,
      apiSecret: supplier.apiSecret,
    };

    console.log("[InspectDeposit] Calling exploreXoaiNonDeposit...");
    const result = await adapter.exploreXoaiNonDeposit(creds);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("[InspectDeposit] Error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
