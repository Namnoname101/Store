import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createUserSessionToken, getUserCookieOptions } from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, email } = body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập phải có ít nhất 3 ký tự" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới (_)" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    const cleanEmail = email && typeof email === "string" && email.trim().length > 0
      ? email.trim().toLowerCase()
      : null;

    // Check unique username
    const existingUsername = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác" },
        { status: 400 }
      );
    }

    // Check unique email if provided
    if (cleanEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: "Email này đã được đăng ký tài khoản" },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    const token = await createUserSessionToken({
      userId: user.id,
      username: user.username!,
      role: user.role,
    });

    const cookieOpts = getUserCookieOptions();
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          totalDeposited: user.totalDeposited,
        },
      },
      { status: 201 }
    );

    response.cookies.set(cookieOpts.name, token, cookieOpts);
    return response;
  } catch (error) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi đăng ký tài khoản" },
      { status: 500 }
    );
  }
}
