import { NextResponse } from "next/server";
import { regeneratePaymentIntent } from "@/services/payment-intent.service";

export async function POST(
  request: Request,
  { params }: { params: { orderCode: string } }
) {
  try {
    const { orderCode } = params;
    if (!orderCode) {
      return NextResponse.json(
        { success: false, error: "Mã đơn hàng không hợp lệ" },
        { status: 400 }
      );
    }

    let token: string | undefined;
    try {
      const body = await request.json();
      token = body?.accessToken || body?.token;
    } catch {
      // Empty or non-JSON body is acceptable; check query param
      const url = new URL(request.url);
      token = url.searchParams.get("token") || undefined;
    }

    const result = await regeneratePaymentIntent(orderCode, token);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tạo lại mã QR" },
      { status: 400 }
    );
  }
}
