export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    orderCode: string;
  } | Promise<{
    orderCode: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { orderCode } = await Promise.resolve(params);

    if (!orderCode) {
      return NextResponse.json(
        { error: "Mã đơn hàng không hợp lệ." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin đơn hàng." },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const token =
      url.searchParams.get("token") ||
      request.headers.get("x-order-token") ||
      undefined;

    const isGuest = !order.userId;
    const isTokenExpired =
      Date.now() - new Date(order.createdAt).getTime() >
      30 * 24 * 60 * 60 * 1000;

    if (isGuest && (!token || token !== order.accessToken || isTokenExpired)) {
      return NextResponse.json(
        {
          error: isTokenExpired
            ? "Mã xác thực đơn hàng đã hết hạn (quá 30 ngày)."
            : "Yêu cầu mã xác thực đơn hàng hợp lệ để gửi yêu cầu hoàn tiền.",
        },
        { status: 403 }
      );
    }

    // 30-minute fulfillment window guard: Shop owner has 30 minutes to fulfill / deposit before refund is allowed
    const REFUND_WAIT_TIME_MS = 30 * 60 * 1000; // 30 minutes
    const orderTime = order.paidAt
      ? new Date(order.paidAt).getTime()
      : new Date(order.createdAt).getTime();
    const elapsed = Date.now() - orderTime;

    if (elapsed < REFUND_WAIT_TIME_MS) {
      const remainingMinutes = Math.max(1, Math.ceil((REFUND_WAIT_TIME_MS - elapsed) / (60 * 1000)));
      return NextResponse.json(
        {
          error: `Đơn hàng đang trong thời gian xử lý và cấp phát (tối đa 30 phút). Quý khách vui lòng đợi thêm ${remainingMinutes} phút nữa hoặc liên hệ CSKH.`,
          canRequestRefund: false,
          remainingMinutes,
        },
        { status: 400 }
      );
    }

    if (order.upstreamStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Đơn hàng đã hoàn tất cấp phát mã thành công, không thể gửi yêu cầu hoàn tiền." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Dữ liệu yêu cầu không hợp lệ." },
        { status: 400 }
      );
    }

    const { bankName, accountNumber, accountName, note } = body;

    if (
      !bankName ||
      typeof bankName !== "string" ||
      !bankName.trim() ||
      !accountNumber ||
      typeof accountNumber !== "string" ||
      !accountNumber.trim() ||
      !accountName ||
      typeof accountName !== "string" ||
      !accountName.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Vui lòng cung cấp đầy đủ tên ngân hàng, số tài khoản và tên chủ tài khoản.",
        },
        { status: 400 }
      );
    }

    const refundPayload = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      note: typeof note === "string" ? note.trim() : "",
      requestedAt: new Date().toISOString(),
    };

    await prisma.order.update({
      where: { orderCode },
      data: {
        refundInfo: JSON.stringify(refundPayload),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Yêu cầu hoàn tiền đã được ghi nhận. Hệ thống sẽ xử lý và chuyển khoản cho bạn trong vòng 5-15 phút.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi khi tiếp nhận yêu cầu hoàn tiền." },
      { status: 500 }
    );
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { orderCode } = await Promise.resolve(params);

    if (!orderCode) {
      return NextResponse.json(
        { error: "Mã đơn hàng không hợp lệ." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: {
        id: true,
        orderCode: true,
        accessToken: true,
        userId: true,
        createdAt: true,
        paidAt: true,
        refundInfo: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin đơn hàng." },
        { status: 404 }
      );
    }

    const url = new URL(_request.url);
    const token =
      url.searchParams.get("token") ||
      _request.headers.get("x-order-token") ||
      undefined;

    const isGuest = !order.userId;
    const isTokenExpired =
      Date.now() - new Date(order.createdAt).getTime() >
      30 * 24 * 60 * 60 * 1000;

    if (isGuest && (!token || token !== order.accessToken || isTokenExpired)) {
      return NextResponse.json(
        {
          error: isTokenExpired
            ? "Mã xác thực đơn hàng đã hết hạn (quá 30 ngày)."
            : "Yêu cầu mã xác thực đơn hàng hợp lệ để xem thông tin hoàn tiền.",
        },
        { status: 403 }
      );
    }

    const REFUND_WAIT_TIME_MS = 30 * 60 * 1000;
    const orderTime = order.paidAt
      ? new Date(order.paidAt).getTime()
      : new Date(order.createdAt).getTime();
    const elapsed = Date.now() - orderTime;
    const canRequestRefund = elapsed >= REFUND_WAIT_TIME_MS;
    const remainingSeconds = Math.max(0, Math.ceil((REFUND_WAIT_TIME_MS - elapsed) / 1000));

    if (!order.refundInfo) {
      return NextResponse.json({
        hasRefundRequest: false,
        refundInfo: null,
        canRequestRefund,
        remainingSeconds,
      });
    }

    let parsedInfo = null;
    try {
      parsedInfo = JSON.parse(order.refundInfo);
    } catch {
      parsedInfo = { raw: order.refundInfo };
    }

    return NextResponse.json({
      hasRefundRequest: true,
      refundInfo: parsedInfo,
      canRequestRefund,
      remainingSeconds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi khi kiểm tra thông tin hoàn tiền." },
      { status: 500 }
    );
  }
}
