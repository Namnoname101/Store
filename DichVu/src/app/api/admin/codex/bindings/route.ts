import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const bindings = await prisma.customerApiKeyBinding.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        topupOrders: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const totalToppedUpUsd = bindings.reduce((sum, b) => sum + b.totalCreditUsd, 0);

    return NextResponse.json({
      success: true,
      bindings,
      totalBindings: bindings.length,
      totalToppedUpUsd,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/codex/bindings Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải danh sách liên kết API Key" },
      { status: 500 }
    );
  }
}
