import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow login page and login API without auth
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/auth/login" ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isValid = token ? await verifyAdminSessionToken(token) : false;

  if (!isValid) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
