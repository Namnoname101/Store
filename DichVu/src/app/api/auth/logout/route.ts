import { NextRequest, NextResponse } from "next/server";
import { getUserCookieOptions } from "@/lib/user-auth";

export async function POST(req?: NextRequest) {
  const cookieOpts = getUserCookieOptions();
  const response = NextResponse.json({
    success: true,
    message: "Đăng xuất thành công",
  });

  response.cookies.set(cookieOpts.name, "", {
    ...cookieOpts,
    maxAge: 0,
  });

  return response;
}
