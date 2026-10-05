import { NextRequest, NextResponse } from "next/server";
import { listAdminUsers } from "@/services/admin-users.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;

    const result = await listAdminUsers({ search });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Lỗi khi tải danh sách người dùng admin:", err);
    return NextResponse.json(
      { error: err?.message || "Không thể tải danh sách thành viên" },
      { status: 500 }
    );
  }
}
