import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(USER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = await verifyUserSessionToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        balance: true,
        totalDeposited: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("[Me Error]:", error);
    return NextResponse.json(
      { authenticated: false, user: null, message: "Lỗi kiểm tra phiên" },
      { status: 500 }
    );
  }
}
