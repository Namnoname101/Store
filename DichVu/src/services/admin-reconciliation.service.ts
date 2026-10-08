import {
  prisma,
  OrderStatus,
  FulfillmentType,
  ReconciliationStatus,
  AuditAction,
  PaymentIntentStatus,
} from "@/lib/prisma";
import { commitReservedItemsToSold } from "@/services/inventory.service";
import { fulfillOrderViaUpstream } from "@/services/upstream-fulfillment.service";

export interface PendingReconciliationStats {
  underpaidCount: number;
  overpaidCount: number;
  expiredPaymentCount: number;
  unmatchedCount: number;
  totalPending: number;
}

/**
 * Retrieves all pending reconciliation transactions with summary counts.
 */
export async function getPendingReconciliations() {
  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      reconciliationStatus: {
        in: [
          ReconciliationStatus.UNDERPAID,
          ReconciliationStatus.OVERPAID,
          ReconciliationStatus.EXPIRED_PAYMENT,
          ReconciliationStatus.UNMATCHED_ORDER,
        ],
      },
    },
    include: {
      order: {
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats: PendingReconciliationStats = {
    underpaidCount: 0,
    overpaidCount: 0,
    expiredPaymentCount: 0,
    unmatchedCount: 0,
    totalPending: transactions.length,
  };

  for (const t of transactions) {
    if (t.reconciliationStatus === ReconciliationStatus.UNDERPAID) stats.underpaidCount++;
    else if (t.reconciliationStatus === ReconciliationStatus.OVERPAID) stats.overpaidCount++;
    else if (t.reconciliationStatus === ReconciliationStatus.EXPIRED_PAYMENT) stats.expiredPaymentCount++;
    else if (t.reconciliationStatus === ReconciliationStatus.UNMATCHED_ORDER) stats.unmatchedCount++;
  }

  return { transactions, stats };
}

export interface ResolveReconciliationOptions {
  orderCode?: string;
  note?: string;
  performedBy?: string;
  refundProof?: string;
  refundStatus?: "REFUND_PENDING" | "REFUNDED";
}

/**
 * Executes Owner-authorized resolution actions with transparent AuditLog trails.
 */
export async function resolveReconciliation(
  txId: string,
  action: "MATCH_AND_FULFILL" | "MARK_REFUNDED" | "DISMISS",
  options: ResolveReconciliationOptions = {}
) {
  const actor = options.performedBy || "OWNER";
  const tx = await prisma.paymentTransaction.findUnique({
    where: { id: txId },
    include: { order: true },
  });

  if (!tx) {
    throw new Error(`Transaction ${txId} not found`);
  }

  if (action === "MATCH_AND_FULFILL") {
    let order = tx.order;
    if (!order && options.orderCode) {
      order = await prisma.order.findUnique({
        where: { orderCode: options.orderCode.trim() },
      });
    }

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng để khớp và giao hàng.");
    }

    const note = options.note || "Khớp thủ công bởi Chủ sở hữu";

    await prisma.$transaction(async (db) => {
      // 1. Update order
      await db.order.update({
        where: { id: order!.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          reconciliationStatus: ReconciliationStatus.MANUAL_RESOLVED,
          reconciliationNote: note,
          reconciledAt: new Date(),
          reconciledBy: actor,
        },
      });

      // 2. Update transaction
      await db.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          orderId: order!.id,
          reconciliationStatus: ReconciliationStatus.MANUAL_RESOLVED,
          reconciliationNote: note,
          resolvedAt: new Date(),
          resolvedBy: actor,
        },
      });

      // 3. Mark payment intent PAID
      await db.paymentIntent.updateMany({
        where: { orderId: order!.id, status: PaymentIntentStatus.ACTIVE },
        data: { status: PaymentIntentStatus.PAID },
      });

      // 4. Commit local keys if reserved
      await commitReservedItemsToSold(order!.id, db);

      // 5. Create AuditLog
      await db.auditLog.create({
        data: {
          action: AuditAction.RECONCILE_MATCH,
          entityType: "Order",
          entityId: order!.id,
          performedBy: actor,
          details: JSON.stringify({
            transactionId: tx.transactionId,
            orderCode: order!.orderCode,
            amount: tx.amount,
            note,
          }),
        },
      });
    });

    // Upstream fulfillment if dropship
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    const hasDropship = fullOrder?.orderItems.some(
      (item) => item.product?.fulfillmentType === FulfillmentType.API_DROPSHIP
    );

    if (hasDropship) {
      try {
        await fulfillOrderViaUpstream(order.id);
      } catch (err) {
        console.error("Manual match upstream error:", err);
      }
    }

    return { success: true, action, orderCode: order.orderCode };
  }

  if (action === "MARK_REFUNDED") {
    if (!options.refundProof || !options.refundProof.trim()) {
      throw new Error("Vui lòng cung cấp mã giao dịch ngân hàng hoặc bằng chứng chuyển khoản hoàn tiền thực tế.");
    }

    const refundProof = options.refundProof.trim();
    const refundStatus = options.refundStatus || "REFUNDED";
    const refundedAt = refundStatus === "REFUNDED" ? new Date() : null;
    const note =
      options.note ||
      (refundStatus === "REFUNDED"
        ? "Đã chuyển hoàn tiền cho khách qua ngân hàng"
        : "Đang xử lý chuyển tiền hoàn");

    await prisma.$transaction(async (db) => {
      await db.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          reconciliationStatus: refundStatus,
          refundStatus,
          refundProof,
          refundedAt,
          reconciliationNote: note,
          resolvedAt: new Date(),
          resolvedBy: actor,
        },
      });

      if (tx.orderId) {
        await db.order.update({
          where: { id: tx.orderId },
          data: {
            reconciliationStatus: refundStatus,
            refundStatus,
            refundProof,
            refundedAt,
            reconciliationNote: note,
            reconciledAt: new Date(),
            reconciledBy: actor,
          },
        });
      }

      await db.auditLog.create({
        data: {
          action: AuditAction.RECONCILE_REFUND,
          entityType: "PaymentTransaction",
          entityId: tx.id,
          performedBy: actor,
          details: JSON.stringify({
            transactionId: tx.transactionId,
            amount: tx.amount,
            refundProof,
            refundStatus,
            note,
            isManualBankTransfer: true,
          }),
        },
      });
    });

    return { success: true, action, refundStatus, refundProof };
  }

  if (action === "DISMISS") {
    const note = options.note || "Đã bỏ qua / giao dịch không hợp lệ";

    await prisma.$transaction(async (db) => {
      await db.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          reconciliationStatus: "DISMISSED",
          reconciliationNote: note,
          resolvedAt: new Date(),
          resolvedBy: actor,
        },
      });

      await db.auditLog.create({
        data: {
          action: AuditAction.RECONCILE_DISMISS,
          entityType: "PaymentTransaction",
          entityId: tx.id,
          performedBy: actor,
          details: JSON.stringify({
            transactionId: tx.transactionId,
            amount: tx.amount,
            note,
          }),
        },
      });
    });

    return { success: true, action };
  }

  throw new Error(`Hành động "${action}" không được hỗ trợ`);
}
