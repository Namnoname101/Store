import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { payOrderWithWallet } from "@/services/wallet.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderCode: string } }
) {
  try {
    const session = await getUserSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để thanh toán bằng số dư ví" },
        { status: 401 }
      );
    }

    const { orderCode } = params;
    if (!orderCode) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã đơn hàng" },
        { status: 400 }
      );
    }

    const result = await payOrderWithWallet(orderCode, session.userId);

    return NextResponse.json({
      success: true,
      order: result,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[Pay With Wallet Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Lỗi thanh toán bằng số dư ví",
      },
      { status: 400 }
    );
  }
}
