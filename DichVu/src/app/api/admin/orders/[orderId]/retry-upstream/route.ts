import { NextRequest, NextResponse } from "next/server";
import { prisma, UpstreamStatus } from "@/lib/prisma";
import { retryUpstreamFulfillment } from "@/services/upstream-fulfillment.service";

interface RouteParams {
  params: {
    orderId: string;
  } | Promise<{
    orderId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await Promise.resolve(params);
    const body = await request.json().catch(() => ({}));

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderCode: orderId }],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order not found: ${orderId}` },
        { status: 404 }
      );
    }

    // Direct link upstream order id if specified
    if (body?.upstreamOrderId) {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          upstreamOrderId: String(body.upstreamOrderId).trim(),
          upstreamStatus: UpstreamStatus.PENDING_UPSTREAM,
          upstreamError: null,
        },
      });
      return NextResponse.json(
        { success: true, order: updated, upstreamOrderId: body.upstreamOrderId },
        { status: 200 }
      );
    }

    const result = await retryUpstreamFulfillment(order.id);

    if (!result.success) {
      if (result.error?.includes("Order not found")) {
        return NextResponse.json(result, { status: 404 });
      }
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retry upstream fulfillment" },
      { status: 500 }
    );
  }
}
