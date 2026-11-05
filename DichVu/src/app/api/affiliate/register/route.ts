export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { registerAffiliate } from "@/services/affiliate.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const result = await registerAffiliate({
      userId: session.userId,
      customCode: body.customCode,
      bankName: body.bankName,
      bankAccountNumber: body.bankAccountNumber,
      bankAccountName: body.bankAccountName,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Affiliate Register Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi đăng ký CTV" },
      { status: 400 }
    );
  }
}
