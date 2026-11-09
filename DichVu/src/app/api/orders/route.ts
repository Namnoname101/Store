export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createOrder } from "@/services/order.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { getUserSession } from "@/lib/user-auth";
import prisma from "@/lib/prisma";

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

    // 1. Bắt buộc đăng nhập tài khoản trước khi mua hàng
    const session = await getUserSession(request);
    if (!session || !session.userId) {
      return NextResponse.json(
        {
          error: "Vui lòng đăng nhập hoặc tạo tài khoản để tiến hành đặt hàng và lưu đơn hàng vào tài khoản của bạn.",
          requireAuth: true,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerEmail, items, customerNote, couponCode } = body || {};

    // 2. Tự động lấy email từ tài khoản người dùng nếu chưa có email nhập tay
    let finalEmail =
      typeof customerEmail === "string" && customerEmail.trim()
        ? customerEmail.trim()
        : null;

    if (!finalEmail && session.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });
      finalEmail = dbUser?.email || null;
    }

    // 3. Tạo đơn hàng và gán cố định userId từ phiên đăng nhập
    const order = await createOrder({
      customerEmail: finalEmail,
      items,
      userId: session.userId,
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
