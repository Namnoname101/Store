import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/services/coupon.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, cartTotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, message: "Vui lòng nhập mã giảm giá" },
        { status: 400 }
      );
    }

    const total = typeof cartTotal === "number" && cartTotal > 0 ? cartTotal : 0;
    const result = await validateCoupon(code, total);

    return NextResponse.json({
      valid: result.valid,
      code: result.coupon?.code || code.trim().toUpperCase(),
      discountAmount: result.discountAmount,
      finalTotal: result.finalTotal,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: "Lỗi hệ thống khi kiểm tra mã giảm giá" },
      { status: 500 }
    );
  }
}
