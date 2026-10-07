import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const logs = await LocketAutoService.getLogs(Number.isNaN(limit) ? 50 : limit);

    return NextResponse.json({
      ok: true,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Lỗi lấy nhật ký Locket Auto" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
        { status: 401 }
      );
    }

    await LocketAutoService.clearLogs();

    return NextResponse.json({
      ok: true,
      message: "Đã xóa toàn bộ nhật ký thực thi",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Lỗi xóa nhật ký Locket Auto" },
      { status: 500 }
    );
  }
}
