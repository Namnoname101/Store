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
        refundInfo: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin đơn hàng." },
        { status: 404 }
      );
    }

    if (!order.refundInfo) {
      return NextResponse.json({
        hasRefundRequest: false,
        refundInfo: null,
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
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi khi kiểm tra thông tin hoàn tiền." },
      { status: 500 }
    );
  }
}
