import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  PaymentIntentStatus,
} from "@/lib/prisma";
import {
  reserveItemsForOrder,
  releaseExpiredReservations,
} from "@/services/inventory.service";
import { generateVietQrUrl, generateOrderCode } from "@/lib/vietqr";
import { validateCoupon } from "@/services/coupon.service";
import {
  createPaymentIntentForOrder,
  QR_EXPIRY_MINUTES,
} from "@/services/payment-intent.service";
import type { Order, OrderItem, Product } from "@prisma/client";

export interface OrderItemInput {
  productId: string;
  quantity: number;
  targetLink?: string;
  customerNote?: string;
}

export interface CreateOrderInput {
  customerEmail?: string | null;
  items: OrderItemInput[];
  userId?: string;
  customerNote?: string;
  couponCode?: string;
  idempotencyKey?: string;
}

export interface OrderDetailsResponse {
  id: string;
  orderCode: string;
  accessToken?: string;
  customerEmail?: string | null;
  customerNote?: string | null;
  userId?: string | null;
  totalAmount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  couponId?: string | null;
  status: string;
  paymentMethod: string;
  upstreamStatus?: string;
  upstreamOrderId?: string | null;
  upstreamError?: string | null;
  refundInfo?: string | null;
  reconciliationStatus?: string | null;
  reconciliationNote?: string | null;
  activePaymentIntent?: any;
  expiresAt: Date;
  paidAt?: Date | null;
  expiresInSeconds?: number;
  vietQrUrl?: string;
  orderItems: Array<
    OrderItem & {
      product: Partial<Product>;
    }
  >;
  deliveredItems: Array<{
    id: string;
    productId: string;
    secretContent?: string;
    status: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Creates a new order with reserved inventory and VietQR checkout link.
 */
export async function createOrder(data: CreateOrderInput) {
  // Validate email if provided; allow omitted/null for guest checkout
  if (data.customerEmail !== undefined && data.customerEmail !== null) {
    if (!validateEmail(data.customerEmail)) {
      throw new Error("Invalid customer email address");
    }
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  for (const item of data.items) {
    if (
      !item.productId ||
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error(`Invalid item quantity for product ${item.productId}`);
    }
  }

  // Fetch products from DB to verify existence, active status, and calculate totalAmount
  const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (!product.isActive) {
      throw new Error(`Product is not active: ${product.title}`);
    }
    if (product.minQuantity && item.quantity < product.minQuantity) {
      throw new Error(`Số lượng đặt tối thiểu cho "${product.title}" là ${product.minQuantity}`);
    }
    if (product.maxQuantity && item.quantity > product.maxQuantity) {
      throw new Error(`Số lượng đặt tối đa cho "${product.title}" là ${product.maxQuantity}`);
    }
  }

  // Idempotency check: if an order with this idempotencyKey already exists, return it
  if (data.idempotencyKey && data.idempotencyKey.trim()) {
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: data.idempotencyKey.trim() },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (existingOrder) {
      const bankId = process.env.BANK_ID || "MB";
      const bankAccountNo = process.env.BANK_ACCOUNT_NO || "0987654321";
      const vietQrUrl = generateVietQrUrl(
        bankId,
        bankAccountNo,
        existingOrder.totalAmount,
        existingOrder.orderCode
      );
      return {
        ...existingOrder,
        vietQrUrl,
      };
    }
  }

  // Calculate gross subtotalAmount
  const subtotalAmount = data.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  // Validate and calculate coupon discount if provided
  let discountAmount = 0;
  let couponId: string | null = null;
  if (data.couponCode && data.couponCode.trim()) {
    const validation = await validateCoupon(data.couponCode, subtotalAmount);
    if (!validation.valid || !validation.coupon) {
      throw new Error(validation.message || "Mã giảm giá không hợp lệ");
    }
    discountAmount = validation.discountAmount;
    couponId = validation.coupon.id;
  }

  // Net total amount customer pays (with 1,000 VND minimum floor)
  const totalAmount = Math.max(1000, subtotalAmount - discountAmount);

  // Generate unique orderCode
  let orderCode = "";
  let isUnique = false;
  while (!isUnique) {
    orderCode = generateOrderCode();
    const existing = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);

  // Database transaction: create order, order items, and reserve stock
  const order = await prisma.$transaction(
    async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderCode,
          idempotencyKey: data.idempotencyKey?.trim() || null,
          customerEmail: data.customerEmail?.trim() || null,
          customerNote: data.customerNote ? data.customerNote.trim() : null,
          userId: data.userId || null,
          totalAmount,
          subtotalAmount,
          discountAmount,
          couponId,
          status: OrderStatus.PENDING,
          paymentMethod: "VIETQR",
          expiresAt,
          orderItems: {
            create: data.items.map((item) => ({
              productId: item.productId,
              price: productMap.get(item.productId)!.price,
              quantity: item.quantity,
              targetLink: item.targetLink ? item.targetLink.trim() : null,
              customerNote: item.customerNote ? item.customerNote.trim() : null,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      // Increment coupon usage count atomically if coupon applied
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Reserve stock only for LOCAL_STOCK items in the order
      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        if (product.fulfillmentType === FulfillmentType.LOCAL_STOCK) {
          await reserveItemsForOrder(
            item.productId,
            item.quantity,
            createdOrder.id,
            QR_EXPIRY_MINUTES,
            tx
          );
        }
      }

      // Create initial 10-minute PaymentIntent
      await createPaymentIntentForOrder(createdOrder.id, createdOrder.totalAmount, tx);

      return createdOrder;
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );

  const bankId = process.env.BANK_ID || "MB";
  const bankAccountNo = process.env.BANK_ACCOUNT_NO || "0987654321";
  const vietQrUrl = generateVietQrUrl(
    bankId,
    bankAccountNo,
    order.totalAmount,
    order.orderCode
  );

  return {
    ...order,
    vietQrUrl,
  };
}

/**
 * Checks if an order is expired and cleans up reservations if needed.
 */
export async function checkAndExpireOrder(orderCode: string) {
  const order = await prisma.order.findUnique({
    where: { orderCode },
  });

  if (!order) {
    return null;
  }

  if (order.status !== OrderStatus.PENDING) {
    return order;
  }

  const now = new Date();
  if (now <= order.expiresAt) {
    return order;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.EXPIRED },
    });

    await tx.paymentIntent.updateMany({
      where: { orderId: order.id, status: PaymentIntentStatus.ACTIVE },
      data: { status: PaymentIntentStatus.EXPIRED },
    });

    await tx.productItem.updateMany({
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
  });

  await releaseExpiredReservations();

  return await prisma.order.findUnique({
    where: { id: order.id },
  });
}

/**
 * Gets order details and securely filters sensitive content based on payment status.
 */
export async function getOrderDetails(
  orderCode: string
): Promise<OrderDetailsResponse | null> {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  let currentStatus = order.status;
  const now = new Date();

  // If pending and expired, trigger expiration update
  if (currentStatus === OrderStatus.PENDING && now > order.expiresAt) {
    await checkAndExpireOrder(orderCode);
    currentStatus = OrderStatus.EXPIRED;
    order.status = OrderStatus.EXPIRED;
  }

  const bankId = process.env.BANK_ID || "MB";
  const bankAccountNo = process.env.BANK_ACCOUNT_NO || "0987654321";
  const defaultQrUrl = generateVietQrUrl(
    bankId,
    bankAccountNo,
    order.totalAmount,
    order.orderCode
  );

  const activeIntent = await prisma.paymentIntent.findFirst({
    where: { orderId: order.id, status: PaymentIntentStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
  });

  const expiresInSeconds = Math.max(
    0,
    Math.floor((order.expiresAt.getTime() - Date.now()) / 1000)
  );

  let deliveredItems: Array<{
    id: string;
    productId: string;
    secretContent?: string;
    status: string;
  }> = [];

  // Expose secretContent ONLY when PAID
  if (currentStatus === OrderStatus.PAID) {
    const items = await prisma.productItem.findMany({
      where: { orderId: order.id },
      select: {
        id: true,
        productId: true,
        secretContent: true,
        status: true,
      },
    });
    deliveredItems = items;
  }

  return {
    id: order.id,
    orderCode: order.orderCode,
    accessToken: order.accessToken,
    customerEmail: order.customerEmail,
    customerNote: order.customerNote,
    userId: order.userId,
    totalAmount: order.totalAmount,
    subtotalAmount: order.subtotalAmount,
    discountAmount: order.discountAmount,
    couponId: order.couponId,
    status: currentStatus,
    paymentMethod: order.paymentMethod,
    upstreamStatus: order.upstreamStatus,
    upstreamOrderId: order.upstreamOrderId,
    upstreamError: order.upstreamError,
    refundInfo: order.refundInfo,
    reconciliationStatus: order.reconciliationStatus,
    reconciliationNote: order.reconciliationNote,
    activePaymentIntent: activeIntent,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
    expiresInSeconds: currentStatus === OrderStatus.PENDING ? expiresInSeconds : 0,
    vietQrUrl: activeIntent?.qrUrl || defaultQrUrl,
    orderItems: order.orderItems as any,
    deliveredItems,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export interface LookupOrderSummary {
  orderCode: string;
  customerEmail?: string | null;
  totalAmount: number;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  upstreamStatus?: string | null;
  items: Array<{
    productTitle: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Searches orders by orderCode or customerEmail.
 */
export async function lookupOrders(query: string): Promise<LookupOrderSummary[]> {
  const cleanQuery = query?.trim();
  if (!cleanQuery) return [];

  const isEmail = cleanQuery.includes("@");
  let orders;

  if (isEmail) {
    orders = await prisma.order.findMany({
      where: {
        customerEmail: {
          equals: cleanQuery.toLowerCase(),
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } else {
    // Lookup by orderCode (case-insensitive via uppercase)
    orders = await prisma.order.findMany({
      where: {
        orderCode: {
          equals: cleanQuery.toUpperCase(),
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { title: true },
            },
          },
        },
      },
      take: 5,
    });
  }

  return orders.map((order) => ({
    orderCode: order.orderCode,
    customerEmail: order.customerEmail,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    upstreamStatus: order.upstreamStatus,
    items: order.orderItems.map((item) => ({
      productTitle: item.product?.title || "Sản phẩm",
      quantity: item.quantity,
      price: item.price,
    })),
  }));
}

