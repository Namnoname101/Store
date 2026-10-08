import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  ReconciliationStatus,
  PaymentIntentStatus,
} from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import {
  getActivePaymentIntent,
  regeneratePaymentIntent,
  sweepExpiredPaymentIntents,
} from "@/services/payment-intent.service";
import { handleIncomingTransaction } from "@/services/payment.service";

describe("Task 4: QR Intent Lifecycle, Background Sweep & Immutable History", () => {
  const TEST_CAT_SLUG = "qr-safety-cat";
  const TEST_PROD_SLUG = "qr-safety-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "QR_SAFETY" } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    const cat = await prisma.category.create({
      data: { name: "QR Safety Cat", slug: TEST_CAT_SLUG },
    });
    catId = cat.id;

    const prod = await prisma.product.create({
      data: {
        title: "QR Safety Prod",
        slug: TEST_PROD_SLUG,
        description: "Test QR safety",
        price: 35000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    prodId = prod.id;

    for (let i = 1; i <= 5; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `KEY-QR-SAFETY-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "QR_SAFETY" } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  it("1. Background Sweep: sweepExpiredPaymentIntents marks expired intents and releases reserved stock", async () => {
    const order = await createOrder({
      customerEmail: "sweep@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Backdate intent & order to past
    const pastDate = new Date(Date.now() - 650000); // 10m+ in past
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: pastDate },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { expiresAt: pastDate },
    });
    await prisma.productItem.updateMany({
      where: { orderId: order.id },
      data: { reservedUntil: pastDate },
    });

    // Run sweep
    const sweptCount = await sweepExpiredPaymentIntents();
    expect(sweptCount).toBeGreaterThanOrEqual(1);

    // Verify intent is EXPIRED
    const intent = await prisma.paymentIntent.findFirst({
      where: { orderId: order.id },
    });
    expect(intent?.status).toBe(PaymentIntentStatus.EXPIRED);

    // Verify order is EXPIRED
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updatedOrder?.status).toBe(OrderStatus.EXPIRED);

    // Verify reserved item is released back to AVAILABLE
    const releasedItems = await prisma.productItem.findMany({
      where: { productId: prodId, status: ItemStatus.AVAILABLE },
    });
    expect(releasedItems.length).toBe(5); // All 5 available again
  });

  it("2. Late Webhook Payment: Webhook received for expired intent is routed to EXPIRED_PAYMENT without fulfillment", async () => {
    const order = await createOrder({
      customerEmail: "late@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Backdate intent to expired
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { status: PaymentIntentStatus.EXPIRED, expiresAt: new Date(Date.now() - 10000) },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.EXPIRED, expiresAt: new Date(Date.now() - 10000) },
    });

    const result = await handleIncomingTransaction({
      transactionId: `TX_LATE_${Date.now()}`,
      amount: 35000,
      content: `Thanh toan tre ${order.orderCode} QR_SAFETY`,
    });

    expect(result.status).toBe(OrderStatus.EXPIRED);
    expect(result.reconciliationStatus).toBe(ReconciliationStatus.EXPIRED_PAYMENT);

    // Stock must NOT be sold
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(0);
  });

  it("3. Immutability of Completed Orders: Subsequent webhook payment does not overwrite paidAt or order status", async () => {
    const order = await createOrder({
      customerEmail: "immutable@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Pay legitimately first
    const tx1 = `TX_IMMUTABLE_1_${Date.now()}`;
    await handleIncomingTransaction({
      transactionId: tx1,
      amount: 35000,
      content: `Thanh toan dung ${order.orderCode} QR_SAFETY`,
    });

    const initialPaidOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(initialPaidOrder?.status).toBe(OrderStatus.PAID);
    const initialPaidAt = initialPaidOrder!.paidAt!.getTime();

    // Customer makes another transfer 5 minutes later
    const tx2 = `TX_IMMUTABLE_2_${Date.now()}`;
    const result2 = await handleIncomingTransaction({
      transactionId: tx2,
      amount: 35000,
      content: `Thanh toan duplicate chuyen thua ${order.orderCode} QR_SAFETY`,
    });

    expect(result2.status).toBe(OrderStatus.PAID);

    // Check order paidAt remains identical
    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(finalOrder?.paidAt?.getTime()).toBe(initialPaidAt);

    // Transaction 2 is preserved for Owner manual audit
    const tx2Record = await prisma.paymentTransaction.findUnique({
      where: { transactionId: tx2 },
    });
    expect(tx2Record).not.toBeNull();
  });
});
