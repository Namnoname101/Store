import { NextRequest, NextResponse } from "next/server";
import { retryUpstreamFulfillment } from "@/services/upstream-fulfillment.service";

interface RouteParams {
  params: {
    orderId: string;
  } | Promise<{
    orderId: string;
  }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await Promise.resolve(params);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const result = await retryUpstreamFulfillment(orderId);

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
