import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  OrderStatus,
  FulfillmentType,
  ReconciliationStatus,
  AuditAction,
  PaymentIntentStatus,
  ItemStatus,
} from "@/lib/prisma";
import { commitReservedItemsToSold, reserveItemsForOrder } from "@/services/inventory.service";
import { fulfillOrderViaUpstream } from "@/services/upstream-fulfillment.service";

interface RouteParams {
  params: {
    orderId: string;
  } | Promise<{
    orderId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await Promise.resolve(params);
    const body = await req.json().catch(() => ({}));
    const note = body.note || "Duyệt đơn thủ công bởi Quản trị viên";

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã định danh đơn hàng (orderId)" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng trong hệ thống" },
        { status: 404 }
      );
    }

    if (order.status === OrderStatus.PAID) {
      return NextResponse.json(
        { success: false, error: "Đơn hàng này đã được xác nhận thanh toán trước đó" },
        { status: 400 }
      );
    }

    // Atomic execution for manual confirmation
    await prisma.$transaction(async (db) => {
      // 1. Mark order as PAID
      await db.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          reconciliationStatus: ReconciliationStatus.MANUAL_RESOLVED,
          reconciliationNote: note,
          reconciledAt: new Date(),
          reconciledBy: "ADMIN_MANUAL",
        },
      });

      // 2. Mark active payment intents as PAID
      await db.paymentIntent.updateMany({
        where: { orderId: order.id, status: PaymentIntentStatus.ACTIVE },
        data: { status: PaymentIntentStatus.PAID },
      });

      // 3. Create a PaymentTransaction record so accounting & audit match
      await db.paymentTransaction.create({
        data: {
          orderId: order.id,
          transactionId: `MANUAL_${order.orderCode}_${Date.now().toString().slice(-6)}`,
          amount: order.totalAmount,
          bankCode: "MANUAL_CONFIRM",
          content: `Duyệt đơn thủ công: ${order.orderCode}`,
          reconciliationStatus: ReconciliationStatus.MANUAL_RESOLVED,
          reconciliationNote: note,
          resolvedAt: new Date(),
          resolvedBy: "ADMIN_MANUAL",
        },
      });

      // 4. Reserve stock if missing/expired, then commit
      for (const item of order.orderItems) {
        if (item.product.fulfillmentType === FulfillmentType.LOCAL_STOCK) {
          const reservedCount = await db.productItem.count({
            where: {
              orderId: order.id,
              status: ItemStatus.RESERVED,
            },
          });
          if (reservedCount < item.quantity) {
            const need = item.quantity - reservedCount;
            try {
              await reserveItemsForOrder(item.productId, need, order.id, 60, db);
            } catch (err: any) {
              console.warn(`[Manual Confirm] Could not reserve remaining ${need} items for ${item.productId}: ${err?.message}`);
            }
          }
        }
      }

      await commitReservedItemsToSold(order.id, db);

      // 5. Create AuditLog
      await db.auditLog.create({
        data: {
          action: AuditAction.RECONCILE_MATCH,
          entityType: "ORDER",
          entityId: order.id,
          performedBy: "ADMIN_MANUAL",
          details: JSON.stringify({
            orderCode: order.orderCode,
            amount: order.totalAmount,
            note,
          }),
        },
      });
    });

    // 6. Upstream dropship fulfillment if applicable
    const hasDropship = order.orderItems.some(
      (item) => item.product?.fulfillmentType === FulfillmentType.API_DROPSHIP
    );

    if (hasDropship) {
      try {
        await fulfillOrderViaUpstream(order.id);
      } catch (err: any) {
        console.error("Manual confirm upstream fulfillment error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã duyệt đơn #${order.orderCode} thành công!`,
    });
  } catch (error: any) {
    console.error("Manual confirm error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể duyệt đơn hàng" },
      { status: 500 }
    );
  }
}
