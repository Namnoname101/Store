import { NextResponse } from "next/server";
import { getOrderDetails } from "@/services/order.service";

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

    return NextResponse.json({
      status: order.status,
      upstreamStatus: order.upstreamStatus,
      reconciliationStatus: order.reconciliationStatus,
      reconciliationNote: order.reconciliationNote,
      totalAmount: order.totalAmount,
      refundInfo: order.refundInfo ? JSON.parse(order.refundInfo) : null,
      paidAt: order.paidAt ?? null,
      deliveredItems: order.deliveredItems ?? [],
      vietQrUrl: order.vietQrUrl,
      expiresAt: order.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve order status" },
      { status: 500 }
    );
  }
}
