import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            product: { select: { title: true, type: true } },
          },
        },
        deliveredItems: {
          select: { secretContent: true },
        },
      },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      transactions,
      orders,
    });
  } catch (error) {
    console.error("[Wallet History Error]:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi tải lịch sử ví" },
      { status: 500 }
    );
  }
}
