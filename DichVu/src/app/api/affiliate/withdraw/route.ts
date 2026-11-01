import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { requestWithdrawal } from "@/services/affiliate.service";

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
    const amount = Number(body.amount);
    const bankName = String(body.bankName || "").trim();
    const accountNumber = String(body.accountNumber || "").trim();
    const accountName = String(body.accountName || "").trim();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Số tiền rút không hợp lệ" },
        { status: 400 }
      );
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { success: false, message: "Vui lòng điền đầy đủ thông tin ngân hàng" },
        { status: 400 }
      );
    }

    const result = await requestWithdrawal({
      userId: session.userId,
      amount,
      bankName,
      accountNumber,
      accountName,
    });

    return NextResponse.json({
      success: true,
      message: "Tạo yêu cầu rút tiền thành công. Admin sẽ duyệt trong 24h.",
      data: result,
    });
  } catch (error: any) {
    console.error("[Affiliate Withdraw Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi tạo yêu cầu rút tiền" },
      { status: 400 }
    );
  }
}
