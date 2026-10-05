import prisma, {
  OrderStatus,
  FulfillmentType,
  WalletTransactionType,
} from "@/lib/prisma";
import { commitReservedItemsToSold } from "@/services/inventory.service";
import { fulfillOrderViaUpstream } from "@/services/upstream-fulfillment.service";

export interface WalletPaymentResult {
  success: boolean;
  status: string;
  orderCode: string;
  totalAmount: number;
  message: string;
}

export async function payOrderWithWallet(
  orderCode: string,
  userId: string
): Promise<WalletPaymentResult> {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, fulfillmentType: true },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Không tìm thấy đơn hàng "${orderCode}"`);
  }

  if (order.status === OrderStatus.PAID) {
    throw new Error("Đơn hàng này đã được thanh toán");
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new Error(`Đơn hàng ở trạng thái ${order.status}, không thể thanh toán`);
  }

  if (new Date() > order.expiresAt) {
    throw new Error("Đơn hàng đã hết hạn thanh toán");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, balance: true },
  });

  if (!user || user.balance < order.totalAmount) {
    throw new Error("Số dư ví không đủ để thanh toán đơn hàng này");
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Atomic decrement with condition
      const updatedUser = await tx.user.update({
        where: {
          id: userId,
          balance: { gte: order.totalAmount },
        },
        data: {
          balance: { decrement: order.totalAmount },
        },
      });

      // 2. Mark order as PAID
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          userId,
          paymentMethod: "WALLET",
        },
      });

      // 3. Record ledger entry
      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.ORDER_PAYMENT,
          amount: -order.totalAmount,
          balanceBefore: updatedUser.balance + order.totalAmount,
          balanceAfter: updatedUser.balance,
          referenceId: order.orderCode,
          description: `Thanh toán đơn hàng ${order.orderCode} bằng số dư ví`,
        },
      });
    });
  } catch (err: any) {
    if (err?.code === "P2025") {
      throw new Error("Số dư ví không đủ để thanh toán đơn hàng này");
    }
    throw err;
  }

  // Post-transaction fulfillment
  const hasLocalStock = order.orderItems.some(
    (item) => item.product.fulfillmentType === FulfillmentType.LOCAL_STOCK
  );
  const hasApiDropship = order.orderItems.some(
    (item) => item.product.fulfillmentType === FulfillmentType.API_DROPSHIP
  );

  if (hasLocalStock) {
    await commitReservedItemsToSold(order.id);
  }

  if (hasApiDropship) {
    try {
      await fulfillOrderViaUpstream(order.id);
    } catch (err) {
      console.error(`[Wallet Fulfill Upstream Error]: ${order.id}:`, err);
    }
  }

  return {
    success: true,
    status: OrderStatus.PAID,
    orderCode: order.orderCode,
    totalAmount: order.totalAmount,
    message: "Thanh toán đơn hàng thành công",
  };
}
