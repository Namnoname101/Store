import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const affiliates = await prisma.user.findMany({
      where: { isAffiliate: true },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        affiliateCode: true,
        affiliateTier: true,
        balance: true,
        totalCommission: true,
        totalAffOrders: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        createdAt: true,
        affiliateCoupons: {
          select: {
            code: true,
            value: true,
            affiliateRate: true,
            usedCount: true,
          },
        },
      },
      orderBy: { totalCommission: "desc" },
    });

    const withdrawals = await prisma.withdrawalRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            affiliateCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      affiliates,
      withdrawals,
    });
  } catch (error: any) {
    console.error("[Admin Affiliates GET Error]:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách CTV" },
      { status: 500 }
    );
  }
}
