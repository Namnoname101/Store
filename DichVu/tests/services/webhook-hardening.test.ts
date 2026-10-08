import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  ReconciliationStatus,
  AuditAction,
} from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import { handleIncomingTransaction } from "@/services/payment.service";
import { resolveReconciliation } from "@/services/admin-reconciliation.service";

describe("Task 3: Webhook Authentication, Cross-Order Replay & Race Condition Hardening", () => {
  const TEST_CAT_SLUG = "webhook-harden-cat";
  const TEST_PROD_SLUG = "webhook-harden-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "WH_HARDEN" } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "WH_HARDEN" } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    const cat = await prisma.category.create({
      data: { name: "Webhook Harden Cat", slug: TEST_CAT_SLUG },
    });
    catId = cat.id;

    const prod = await prisma.product.create({
      data: {
        title: "Webhook Harden Prod",
        slug: TEST_PROD_SLUG,
        description: "Test hardening",
        price: 50000,
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
          secretContent: `KEY-WH-HARDEN-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "WH_HARDEN" } },
    });
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "WH_HARDEN" } },
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

  it("1. Replay Webhook: Duplicate incoming transaction returns isDuplicate: true without duplicate fulfillment", async () => {
    const order = await createOrder({
      customerEmail: "replay@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const txId = `TX_REPLAY_${Date.now()}`;
    // 1st request
    const firstResult = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Thanh toan don ${order.orderCode} WH_HARDEN`,
    });
    expect(firstResult.success).toBe(true);
    expect(firstResult.status).toBe(OrderStatus.PAID);
    expect(firstResult.isDuplicate).toBeFalsy();

    // 2nd request with exact same txId
    const secondResult = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Thanh toan don ${order.orderCode} WH_HARDEN`,
    });
    expect(secondResult.success).toBe(true);
    expect(secondResult.isDuplicate).toBe(true);

    // Verify stock is delivered exactly once (1 item sold, not 2)
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(1);
  });

  it("2. Single Bank Tx Cannot Pay Multiple Orders: Bank transaction cannot be reassigned to another order", async () => {
    const order1 = await createOrder({
      customerEmail: "cross1@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });
    const order2 = await createOrder({
      customerEmail: "cross2@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const txId = `TX_CROSS_${Date.now()}`;
    // Settled for order1
    await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Thanh toan don ${order1.orderCode} WH_HARDEN`,
    });

    // Try to replay same bank txId for order2
    const secondResult = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Thanh toan don ${order2.orderCode} WH_HARDEN`,
    });

    // Must be flagged duplicate and NOT pay order2
    expect(secondResult.isDuplicate).toBe(true);

    const checkOrder2 = await prisma.order.findUnique({
      where: { id: order2.id },
    });
    expect(checkOrder2?.status).toBe(OrderStatus.PENDING);
  });

  it("3. Concurrent Admin Reconciliations: Second click is rejected if order is already PAID", async () => {
    const order = await createOrder({
      customerEmail: "concurr_admin@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const tx = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_CONCURR_ADMIN_${Date.now()}`,
        amount: 50000,
        content: `Khop tay concurr WH_HARDEN`,
        orderId: order.id,
        reconciliationStatus: ReconciliationStatus.EXPIRED_PAYMENT,
      },
    });

    // First resolve succeeds
    const res1 = await resolveReconciliation(tx.id, "MATCH_AND_FULFILL", {
      orderCode: order.orderCode,
      note: "Admin resolve 1 WH_HARDEN",
      performedBy: "OWNER",
    });
    expect(res1.success).toBe(true);

    // Second concurrent resolve must be rejected
    await expect(
      resolveReconciliation(tx.id, "MATCH_AND_FULFILL", {
        orderCode: order.orderCode,
        note: "Admin resolve 2 WH_HARDEN",
        performedBy: "OWNER",
      })
    ).rejects.toThrow(/đã ở trạng thái PAID|đã được xử lý/i);

    // Stock must be delivered once
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(1);
  });
});
