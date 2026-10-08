import { NextResponse } from "next/server";
import { createOrder } from "@/services/order.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`order-create:${clientIp}`, {
      limit: 30, // 30 orders per minute per IP
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Quá nhiều yêu cầu tạo đơn hàng. Vui lòng thử lại sau giây lát." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(rateCheck.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateCheck.reset),
          },
        }
      );
    }

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
