import { prisma, OrderStatus, ItemStatus, FulfillmentType } from "@/lib/prisma";
import {
  reserveItemsForOrder,
  releaseExpiredReservations,
} from "@/services/inventory.service";
import { generateVietQrUrl, generateOrderCode } from "@/lib/vietqr";
import type { Order, OrderItem, Product } from "@prisma/client";

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerEmail: string;
  items: OrderItemInput[];
  userId?: string;
}

export interface OrderDetailsResponse {
  id: string;
  orderCode: string;
  customerEmail: string;
  userId?: string | null;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  upstreamStatus?: string;
  upstreamOrderId?: string | null;
  upstreamError?: string | null;
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
  if (!validateEmail(data.customerEmail)) {
    throw new Error("Invalid customer email address");
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
  }

  // Calculate real totalAmount
  const totalAmount = data.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

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

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Database transaction: create order, order items, and reserve stock
  const order = await prisma.$transaction(
    async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderCode,
          customerEmail: data.customerEmail.trim(),
          userId: data.userId || null,
          totalAmount,
          status: OrderStatus.PENDING,
          paymentMethod: "VIETQR",
          expiresAt,
          orderItems: {
            create: data.items.map((item) => ({
              productId: item.productId,
              price: productMap.get(item.productId)!.price,
              quantity: item.quantity,
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

      // Reserve stock only for LOCAL_STOCK items in the order
      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        if (product.fulfillmentType === FulfillmentType.LOCAL_STOCK) {
          await reserveItemsForOrder(
            item.productId,
            item.quantity,
            createdOrder.id,
            15,
            tx
          );
        }
      }

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
  const vietQrUrl = generateVietQrUrl(
    bankId,
    bankAccountNo,
    order.totalAmount,
    order.orderCode
  );

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
    customerEmail: order.customerEmail,
    userId: order.userId,
    totalAmount: order.totalAmount,
    status: currentStatus,
    paymentMethod: order.paymentMethod,
    upstreamStatus: order.upstreamStatus,
    upstreamOrderId: order.upstreamOrderId,
    upstreamError: order.upstreamError,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
    expiresInSeconds: currentStatus === OrderStatus.PENDING ? expiresInSeconds : 0,
    vietQrUrl,
    orderItems: order.orderItems as any,
    deliveredItems,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
