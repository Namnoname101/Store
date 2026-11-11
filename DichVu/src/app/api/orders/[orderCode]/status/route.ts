export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getOrderDetails } from "@/services/order.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { getUserSession } from "@/lib/user-auth";

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

    const isTokenExpired = Boolean(
      order.createdAt &&
        Date.now() - new Date(order.createdAt).getTime() >
          30 * 24 * 60 * 60 * 1000
    );

    // Verify ownership: if order belongs to registered user, user must be logged in as owner
    let isUserOwner = false;
    if (order.userId) {
      try {
        const session = await getUserSession(_request);
        if (session && session.userId === order.userId) {
          isUserOwner = true;
        }
      } catch {
        isUserOwner = false;
      }
    }

    const isTokenValid =
      isUserOwner ||
      (Boolean(token) && token === order.accessToken && !isTokenExpired);

    let paidAmount = order.status === "PAID" ? order.totalAmount : 0;
    let remainingAmount = order.status === "PAID" ? 0 : order.totalAmount;
    let deltaVietQrUrl: string | null = null;

    if (order.reconciliationStatus === "UNDERPAID" && order.reconciliationNote) {
      const matchReceived = order.reconciliationNote.match(/Đã nhận:\s*([\d.,]+)đ/);
      const matchDiff = order.reconciliationNote.match(/Chuyển thiếu\s*([\d.,]+)đ/);
      if (matchDiff) {
        const rawDiff = parseInt(matchDiff[1].replace(/[.,]/g, ""), 10);
        if (!isNaN(rawDiff) && rawDiff > 0) {
          remainingAmount = rawDiff;
        }
      }
      if (matchReceived) {
        const rawRecv = parseInt(matchReceived[1].replace(/[.,]/g, ""), 10);
        if (!isNaN(rawRecv) && rawRecv > 0) {
          paidAmount = rawRecv;
        }
      }

      const bankId = process.env.BANK_ID || "MB";
      const bankAccountNo = process.env.BANK_ACCOUNT_NO || "0987654321";
      deltaVietQrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact2.png?amount=${remainingAmount}&addInfo=${encodeURIComponent(order.orderCode)}`;
    }

    return NextResponse.json({
      status: order.status,
      upstreamStatus: order.upstreamStatus,
      reconciliationStatus: order.reconciliationStatus,
      reconciliationNote: order.reconciliationNote,
      totalAmount: order.totalAmount,
      paidAmount,
      remainingAmount,
      deltaVietQrUrl,
      refundInfo: isTokenValid && order.refundInfo ? JSON.parse(order.refundInfo) : null,
      paidAt: order.paidAt ?? null,
      createdAt: order.createdAt ?? null,
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
