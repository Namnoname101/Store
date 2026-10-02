import { NextResponse } from "next/server";
import { createOrder } from "@/services/order.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerEmail, items, userId } = body || {};

    const order = await createOrder({
      customerEmail,
      items,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        order: {
          orderCode: order.orderCode,
          expiresAt: order.expiresAt,
          totalAmount: order.totalAmount,
          vietQrUrl: order.vietQrUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create order" },
      { status: 400 }
    );
  }
}
