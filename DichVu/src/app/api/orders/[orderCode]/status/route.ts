import { NextResponse } from "next/server";
import { getOrderDetails } from "@/services/order.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

interface RouteParams {
  params: {
    orderCode: string;
  };
}

export async function GET(
  _request: Request,
  { params }: RouteParams
) {
  try {
    const clientIp = getClientIp(_request);
    const rateCheck = checkRateLimit(`order-status:${clientIp}`, {
      limit: 120, // 120 status checks per minute per IP
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Quá nhiều yêu cầu tra cứu đơn hàng. Vui lòng thử lại sau giây lát." },
        {
          status: 429,
          headers: {
            "Retry-After": "30",
            "X-RateLimit-Limit": String(rateCheck.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateCheck.reset),
          },
        }
      );
    }

    const { orderCode } = await Promise.resolve(params);

    if (!orderCode) {
      return NextResponse.json(
        { error: "Order code is required" },
        { status: 400 }
      );
    }

    const order = await getOrderDetails(orderCode);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const url = new URL(_request.url);
    const token =
      url.searchParams.get("token") ||
      _request.headers.get("x-order-token") ||
      undefined;

    const isGuest = !order.userId;
    const isTokenExpired = Boolean(
      order.createdAt &&
        Date.now() - new Date(order.createdAt).getTime() >
          30 * 24 * 60 * 60 * 1000
    );

    const isTokenValid =
      !isGuest ||
      (Boolean(token) && token === order.accessToken && !isTokenExpired);

    return NextResponse.json({
      status: order.status,
      upstreamStatus: order.upstreamStatus,
      reconciliationStatus: order.reconciliationStatus,
      reconciliationNote: order.reconciliationNote,
      totalAmount: order.totalAmount,
      refundInfo: isTokenValid && order.refundInfo ? JSON.parse(order.refundInfo) : null,
      paidAt: order.paidAt ?? null,
      deliveredItems: isTokenValid ? (order.deliveredItems ?? []) : [],
      vietQrUrl: order.vietQrUrl,
      expiresAt: order.expiresAt,
      tokenExpired: isTokenExpired && token === order.accessToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve order status" },
      { status: 500 }
    );
  }
}
