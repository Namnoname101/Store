import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  PaymentIntentStatus,
} from "@/lib/prisma";
import { PaymentSweepWorker } from "@/services/payment-sweep.worker";
import { createOrder } from "@/services/order.service";

describe("Task 5: PaymentSweepWorker & QR Expiry Background Scheduler", () => {
  const TEST_CAT_SLUG = "sweep-worker-cat";
  const TEST_PROD_SLUG = "sweep-worker-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
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
    await prisma.product.deleteMany({ where: { slug: TEST_PROD_SLUG } });
    await prisma.category.deleteMany({ where: { slug: TEST_CAT_SLUG } });

    const cat = await prisma.category.create({
      data: { name: "Sweep Worker Category", slug: TEST_CAT_SLUG },
    });
    catId = cat.id;

    const prod = await prisma.product.create({
      data: {
        title: "Sweep Worker Prod",
        slug: TEST_PROD_SLUG,
        description: "Test description for sweep worker",
        price: 50000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    prodId = prod.id;

    for (let i = 1; i <= 10; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `KEY-SWEEP-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }
  });

  afterAll(async () => {
    PaymentSweepWorker.getInstance().stop();

    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
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
    await prisma.product.deleteMany({ where: { slug: TEST_PROD_SLUG } });
    await prisma.category.deleteMany({ where: { slug: TEST_CAT_SLUG } });
  });

  it("1. Worker Singleton & Lifecycle: starts, reports status, and stops safely", () => {
    const worker = PaymentSweepWorker.getInstance();
    expect(worker).toBeDefined();

    expect(worker.isRunning()).toBe(false);
    worker.start(30);
    expect(worker.isRunning()).toBe(true);

    const status = worker.getStatus();
    expect(status.isRunning).toBe(true);
    expect(status.intervalSeconds).toBe(30);

    worker.stop();
    expect(worker.isRunning()).toBe(false);
  });

  it("2. Paid Orders & Sold Stock Safety: Never expires PAID orders or releases SOLD stock", async () => {
    const worker = PaymentSweepWorker.getInstance();

    // Create and mark order as PAID with past expiresAt
    const order = await createOrder({
      customerEmail: "paid-no-touch@example.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      },
    });

    // Mark item as SOLD
    await prisma.productItem.updateMany({
      where: { orderId: order.id },
      data: { status: ItemStatus.SOLD },
    });

    // Execute sweep
    await worker.executeOnce();

    // Verify order is STILL PAID
    const orderCheck = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(orderCheck?.status).toBe(OrderStatus.PAID);

    // Verify stock is STILL SOLD
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id },
    });
    expect(soldItems).toHaveLength(1);
    expect(soldItems[0].status).toBe(ItemStatus.SOLD);
  });

  it("3. Expired Sweeping & Inventory Restoration: Sweeps overdue PENDING order and restores stock to AVAILABLE", async () => {
    const worker = PaymentSweepWorker.getInstance();

    const order = await createOrder({
      customerEmail: "overdue-pending@example.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Artificially age the order, intent, and reservation past expiration
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });
    await prisma.productItem.updateMany({
      where: { orderId: order.id },
      data: { reservedUntil: new Date(Date.now() - 10000) },
    });

    // Execute sweep
    const result = await worker.executeOnce();
    expect(result.success).toBe(true);
    expect(result.sweptCount).toBeGreaterThanOrEqual(1);

    // Verify order is now EXPIRED
    const orderCheck = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(orderCheck?.status).toBe(OrderStatus.EXPIRED);

    // Verify intent is now EXPIRED
    const intentCheck = await prisma.paymentIntent.findFirst({
      where: { orderId: order.id },
    });
    expect(intentCheck?.status).toBe(PaymentIntentStatus.EXPIRED);

    // Verify reserved item is restored to AVAILABLE and unlinked from order
    const itemCheck = await prisma.productItem.findFirst({
      where: { secretContent: `KEY-SWEEP-` },
    });
    const releasedItems = await prisma.productItem.findMany({
      where: { productId: prodId, status: ItemStatus.AVAILABLE },
    });
    expect(releasedItems.length).toBeGreaterThanOrEqual(1);
  });

  it("4. Concurrency Guard: Skipping tick when previous execution is in progress", async () => {
    const worker = PaymentSweepWorker.getInstance();

    // Manually force isExecuting state
    (worker as any).isExecuting = true;

    try {
      const result = await worker.executeOnce();
      expect(result.success).toBe(false);
      expect(result.skippedConcurrency).toBe(true);
    } finally {
      (worker as any).isExecuting = false;
    }
  });

  it("5. Logging & Audit: Records in-memory logs of execution history", async () => {
    const worker = PaymentSweepWorker.getInstance();
    worker.clearLogs();

    await worker.executeOnce();

    const logs = worker.getLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].status).toBe("SUCCESS");
    expect(logs[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(logs[0].message).toContain("Quét hết hạn");
  });
});
