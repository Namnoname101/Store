import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { retryCodexCreditOrder } from "@/services/codex-fulfillment.service";

export async function GET(_req: NextRequest) {
  try {
    // Orders with RECONCILE_REQUIRED or FAILED topup orders
    const reconcileOrders = await prisma.order.findMany({
      where: {
        creditTopupOrder: {
          status: { in: ["RECONCILE_REQUIRED", "FAILED"] },
        },
      },
      include: {
        creditTopupOrder: {
          include: {
            binding: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // CreditLedger entries with non-zero discrepancy
    const ledgerDiscrepancies = await prisma.creditLedger.findMany({
      where: {
        discrepancyDelta: { not: 0 },
      },
      include: {
        binding: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      reconcileRequiredOrders: reconcileOrders,
      ledgerDiscrepancies,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/codex/reconcile Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải dữ liệu đối soát" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body || {};

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã ID đơn hàng cần đối soát lại" },
        { status: 400 }
      );
    }

    const retryResult = await retryCodexCreditOrder(orderId, "OWNER");

    if (!retryResult.success) {
      return NextResponse.json(
        { error: retryResult.error || "Thử lại nạp credit thất bại", status: retryResult.status },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: retryResult.status,
      discrepancyDelta: retryResult.discrepancyDelta,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/codex/reconcile Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi thực hiện đối soát đơn hàng" },
      { status: 500 }
    );
  }
}
