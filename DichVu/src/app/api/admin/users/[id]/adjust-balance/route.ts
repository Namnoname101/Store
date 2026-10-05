import { NextRequest, NextResponse } from "next/server";
import { adjustUserBalance } from "@/services/admin-users.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await req.json();
    const { amount, reason, adminNote } = body || {};

    if (amount === undefined || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "Vui lòng nhập số tiền điều chỉnh hợp lệ khác 0" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập lý do điều chỉnh số dư ví" },
        { status: 400 }
      );
    }

    const result = await adjustUserBalance({
      userId,
      amount,
      reason,
      adminNote,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Lỗi khi điều chỉnh số dư thành viên:", err);
    return NextResponse.json(
      { error: err?.message || "Lỗi khi điều chỉnh số dư ví" },
      { status: 400 }
    );
  }
}
