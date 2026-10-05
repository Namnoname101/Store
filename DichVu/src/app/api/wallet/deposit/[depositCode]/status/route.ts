import { NextRequest, NextResponse } from "next/server";
import { getDepositOrderStatus } from "@/services/deposit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { depositCode: string } }
) {
  try {
    const { depositCode } = params;
    if (!depositCode) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã nạp tiền" },
        { status: 400 }
      );
    }

    const status = await getDepositOrderStatus(depositCode);

    return NextResponse.json({
      success: true,
      deposit: status,
    });
  } catch (error: any) {
    console.error("[Deposit Status Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi kiểm tra trạng thái nạp tiền" },
      { status: 404 }
    );
  }
}
