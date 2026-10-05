import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createUserSessionToken, getUserCookieOptions } from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên đăng nhập/email và mật khẩu" },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(username).trim().toLowerCase();

    // Query user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(String(password), user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const token = await createUserSessionToken({
      userId: user.id,
      username: user.username!,
      role: user.role,
    });

    const cookieOpts = getUserCookieOptions();
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        totalDeposited: user.totalDeposited,
      },
    });

    response.cookies.set(cookieOpts.name, token, cookieOpts);
    return response;
  } catch (error) {
    console.error("[Login Error]:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi đăng nhập" },
      { status: 500 }
    );
  }
}
