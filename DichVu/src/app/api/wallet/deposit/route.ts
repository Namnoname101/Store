import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { createDepositOrder } from "@/services/deposit.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để nạp tiền vào ví" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập số tiền cần nạp" },
        { status: 400 }
      );
    }

    const deposit = await createDepositOrder(session.userId, amount);

    return NextResponse.json(
      {
        success: true,
        deposit,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Deposit API Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tạo lệnh nạp tiền" },
      { status: 400 }
    );
  }
}
