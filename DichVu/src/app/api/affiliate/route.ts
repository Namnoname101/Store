export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { getAffiliateDashboardData } from "@/services/affiliate.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const data = await getAffiliateDashboardData(session.userId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[Affiliate Dashboard Error]:", error);
    if (error?.message === "Không tìm thấy người dùng") {
      return NextResponse.json(
        { success: false, message: "Phiên đăng nhập không tồn tại hoặc đã hết hạn" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi tải thông tin CTV" },
      { status: 500 }
    );
  }
}
