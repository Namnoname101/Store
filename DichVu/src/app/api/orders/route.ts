import { NextResponse } from "next/server";
import { createOrder } from "@/services/order.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerEmail, items, userId, customerNote, couponCode } = body || {};
    const sanitizedEmail =
      typeof customerEmail === "string" && customerEmail.trim()
        ? customerEmail.trim()
        : null;

    const order = await createOrder({
      customerEmail: sanitizedEmail,
      items,
      userId,
      customerNote,
      couponCode,
    });

    return NextResponse.json(
      {
        success: true,
        order: {
          orderCode: order.orderCode,
          expiresAt: order.expiresAt,
          totalAmount: order.totalAmount,
          subtotalAmount: order.subtotalAmount,
          discountAmount: order.discountAmount,
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
