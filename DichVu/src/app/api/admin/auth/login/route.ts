import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  createAdminSessionToken,
  getAdminCookieOptions,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập mật khẩu quản trị" },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Mật khẩu quản trị không chính xác" },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken();
    const cookieOpts = getAdminCookieOptions();

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: cookieOpts.name,
      value: token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi hệ thống khi đăng nhập" },
      { status: 500 }
    );
  }
}
