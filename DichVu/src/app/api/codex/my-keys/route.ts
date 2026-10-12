import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/key-security";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.userId) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem danh sách API Key" },
        { status: 401 }
      );
    }

    const keys = await prisma.customerApiKeyBinding.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      keys,
    });
  } catch (err: any) {
    console.error("[GET /api/codex/my-keys Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ nội bộ khi tải danh sách key" },
      { status: 500 }
    );
  }
}
