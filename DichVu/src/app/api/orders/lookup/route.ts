import { NextRequest, NextResponse } from "next/server";
import { lookupOrders } from "@/services/order.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await lookupOrders(q);
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to lookup orders" },
      { status: 500 }
    );
  }
}
