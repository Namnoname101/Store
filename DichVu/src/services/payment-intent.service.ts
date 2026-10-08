import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  PaymentIntentStatus,
} from "@/lib/prisma";
import { generateVietQrUrl } from "@/lib/vietqr";
import {
  reserveItemsForOrder,
  releaseExpiredReservations,
  getAvailableStockCount,
} from "@/services/inventory.service";
import { validateCoupon } from "@/services/coupon.service";
import type { PaymentIntent } from "@prisma/client";

export const QR_EXPIRY_MINUTES = 10;
export const QR_EXPIRY_MS = QR_EXPIRY_MINUTES * 60 * 1000;

/**
 * Creates an active 10-minute PaymentIntent for an order.
 */
export async function createPaymentIntentForOrder(
  orderId: string,
  customAmount?: number,
  txClient?: any
): Promise<PaymentIntent> {
  const db = txClient || prisma;
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { paymentIntents: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Supersede any existing active intents
  await db.paymentIntent.updateMany({
    where: { orderId: order.id, status: PaymentIntentStatus.ACTIVE },
    data: { status: PaymentIntentStatus.SUPERSEDED },
  });

  const intentIndex = (order.paymentIntents?.length || 0) + 1;
  const intentCode = `PI_${order.orderCode}_${intentIndex}`;
  const amount = customAmount !== undefined ? customAmount : order.totalAmount;
  const expiresAt = new Date(Date.now() + QR_EXPIRY_MS);

  const bankId = process.env.BANK_ID || "MB";
  const bankAccountNo = process.env.BANK_ACCOUNT_NO || "0987654321";
  const qrUrl = generateVietQrUrl(
    bankId,
    bankAccountNo,
    amount,
    order.orderCode,
    "compact2"
  );

  const paymentIntent = await db.paymentIntent.create({
    data: {
      orderId: order.id,
      intentCode,
      qrUrl,
      amount,
      expiresAt,
      status: PaymentIntentStatus.ACTIVE,
    },
  });

  return paymentIntent;
}

/**
 * Retrieves the currently active PaymentIntent for an order.
 * If expired, updates its status to EXPIRED.
 */
export async function getActivePaymentIntent(
  orderId: string
): Promise<PaymentIntent | null> {
  const intent = await prisma.paymentIntent.findFirst({
    where: {
      orderId,
      status: PaymentIntentStatus.ACTIVE,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!intent) return null;

  if (new Date() > intent.expiresAt) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: PaymentIntentStatus.EXPIRED },
    });
    return null;
  }

  return intent;
}

export interface RegenerateResult {
  success: boolean;
  paymentIntent: PaymentIntent;
  priceChanged: boolean;
  oldTotal: number;
  newTotal: number;
  message?: string;
}

/**
 * Safely regenerates an active 10-minute QR PaymentIntent for an existing pending order.
 * Re-validates live stock, product active status, prices, and coupon conditions.
 */
export async function regeneratePaymentIntent(
  orderCode: string,
  accessToken?: string | null
): Promise<RegenerateResult> {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      orderItems: {
        include: { product: true },
      },
      coupon: true,
    },
  });

  if (!order) {
    throw new Error(`Đơn hàng #${orderCode} không tồn tại`);
  }

  // Secure token validation for guest orders
  if (accessToken && order.accessToken !== accessToken) {
    throw new Error("Mã xác thực đơn hàng không hợp lệ");
  }

  if (order.status === OrderStatus.PAID) {
    throw new Error("Đơn hàng này đã được thanh toán thành công, không thể tạo lại QR.");
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Đơn hàng đã bị hủy, không thể tạo lại QR.");
  }

  // 1. Release expired reservations first
  await releaseExpiredReservations();

  // Release any items previously reserved for THIS order so they are counted as available
  await prisma.productItem.updateMany({
    where: {
      orderId: order.id,
      status: ItemStatus.RESERVED,
    },
    data: {
      status: ItemStatus.AVAILABLE,
      orderId: null,
      reservedUntil: null,
    },
  });

  // 2. Re-verify products and stock
  let newSubtotal = 0;
  let priceChanged = false;

  for (const item of order.orderItems) {
    const currentProduct = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!currentProduct || !currentProduct.isActive) {
      throw new Error(`Sản phẩm "${item.product?.title || item.productId}" hiện đã tạm dừng bán.`);
    }

    // Check available stock
    const isSMM =
      currentProduct.fulfillmentType === FulfillmentType.API_DROPSHIP ||
      currentProduct.title.toLowerCase().includes("tiktok") ||
      currentProduct.title.toLowerCase().includes("facebook");

    if (!isSMM && currentProduct.fulfillmentType === FulfillmentType.LOCAL_STOCK) {
      const liveStock = await getAvailableStockCount(currentProduct.id);
      if (liveStock < item.quantity) {
        throw new Error(
          `Kho chỉ còn ${liveStock} sản phẩm khả dụng cho "${currentProduct.title}", không đủ đáp ứng số lượng ${item.quantity}.`
        );
      }
    }

    if (currentProduct.price !== item.price) {
      priceChanged = true;
    }

    newSubtotal += currentProduct.price * item.quantity;
  }

  // 3. Re-validate coupon if order has coupon
  let discountAmount = 0;
  let validCouponId = order.couponId;
  if (order.coupon) {
    const couponVal = await validateCoupon(order.coupon.code, newSubtotal);
    if (couponVal.valid && couponVal.coupon) {
      discountAmount = couponVal.discountAmount;
    } else {
      validCouponId = null;
      discountAmount = 0;
    }
  }

  const newTotal = Math.max(1000, newSubtotal - discountAmount);
  const oldTotal = order.totalAmount;
  if (newTotal !== oldTotal) {
    priceChanged = true;
  }

  const newExpiresAt = new Date(Date.now() + QR_EXPIRY_MS);

  // 4. Atomic transaction: update order, re-reserve stock, and create fresh 10m PaymentIntent
  const result = await prisma.$transaction(async (tx) => {
    // Supersede old active intents
    await tx.paymentIntent.updateMany({
      where: { orderId: order.id, status: PaymentIntentStatus.ACTIVE },
      data: { status: PaymentIntentStatus.SUPERSEDED },
    });

    // Update order
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PENDING,
        totalAmount: newTotal,
        subtotalAmount: newSubtotal,
        discountAmount,
        couponId: validCouponId,
        expiresAt: newExpiresAt,
      },
    });

    // Re-reserve items for LOCAL_STOCK items
    for (const item of order.orderItems) {
      const product = item.product;
      if (product.fulfillmentType === FulfillmentType.LOCAL_STOCK) {
        await reserveItemsForOrder(
          item.productId,
          item.quantity,
          order.id,
          QR_EXPIRY_MINUTES,
          tx
        );
      }
    }

    // Create new PaymentIntent
    const intentCount = await tx.paymentIntent.count({ where: { orderId: order.id } });
    const intentCode = `PI_${order.orderCode}_${intentCount + 1}`;
    const bankId = process.env.BANK_ID || "MB";
    const bankAccountNo = process.env.BANK_ACCOUNT_NO || "0987654321";
    const qrUrl = generateVietQrUrl(
      bankId,
      bankAccountNo,
      newTotal,
      order.orderCode,
      "compact2"
    );

    const paymentIntent = await tx.paymentIntent.create({
      data: {
        orderId: order.id,
        intentCode,
        qrUrl,
        amount: newTotal,
        expiresAt: newExpiresAt,
        status: PaymentIntentStatus.ACTIVE,
      },
    });

    return paymentIntent;
  });

  return {
    success: true,
    paymentIntent: result,
    priceChanged,
    oldTotal,
    newTotal,
    message: priceChanged
      ? `Giá sản phẩm đã cập nhật từ ${oldTotal.toLocaleString("vi-VN")}đ sang ${newTotal.toLocaleString("vi-VN")}đ.`
      : undefined,
  };
}

/**
 * Sweeps all expired PaymentIntents and orders, releasing unconfirmed inventory reservations.
 * Can be called by background crons or periodic checks.
 */
export async function sweepExpiredPaymentIntents(): Promise<number> {
  const now = new Date();

  // 1. Mark expired active payment intents
  const expiredIntents = await prisma.paymentIntent.updateMany({
    where: {
      status: PaymentIntentStatus.ACTIVE,
      expiresAt: { lt: now },
    },
    data: {
      status: PaymentIntentStatus.EXPIRED,
    },
  });

  // 2. Mark pending orders past expiration as EXPIRED
  await prisma.order.updateMany({
    where: {
      status: OrderStatus.PENDING,
      expiresAt: { lt: now },
    },
    data: {
      status: OrderStatus.EXPIRED,
    },
  });

  // 3. Release unconfirmed inventory reservations
  await releaseExpiredReservations();

  return expiredIntents.count;
}
