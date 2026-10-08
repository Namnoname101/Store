import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  ItemStatus,
  OrderStatus,
  FulfillmentType,
  PaymentIntentStatus,
  ReconciliationStatus,
} from "@/lib/prisma";
import { handleIncomingTransaction } from "@/services/payment.service";
import { createOrder } from "@/services/order.service";

describe("Bank Webhook & Multi-tier Payment Reconciliation Engine", () => {
  const TEST_CAT_SLUG = "recon-test-cat";
  const TEST_PROD_SLUG = "recon-test-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: {
        OR: [
          { content: { contains: "RECON" } },
          { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
        ],
      },
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

    const category = await prisma.category.create({
      data: { name: "Recon Test Cat", slug: TEST_CAT_SLUG },
    });
    catId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Recon Test Product",
        slug: TEST_PROD_SLUG,
        description: "Reconciliation Test product",
        price: 50000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    prodId = product.id;

    // Create 15 available keys
    for (let i = 1; i <= 15; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `KEY-RECON-${i}`,
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
      where: {
        OR: [
          { content: { contains: "RECON" } },
          { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
        ],
      },
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

  it("Scenario 1: Exact MATCHED payment -> marks order PAID, marks PaymentIntent PAID, commits stock", async () => {
    const order = await createOrder({
      customerEmail: "match@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const txId = `TX_MATCH_${Date.now()}`;
    const result = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Thanh toan don hang ${order.orderCode} RECON`,
      bankCode: "MB",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(OrderStatus.PAID);

    // Verify DB order state
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { paymentIntents: true },
    });
    expect(updatedOrder?.status).toBe(OrderStatus.PAID);
    expect(updatedOrder?.reconciliationStatus).toBe(ReconciliationStatus.MATCHED);

    // Active intent should be marked PAID
    const paidIntent = updatedOrder?.paymentIntents.find((pi) => pi.status === PaymentIntentStatus.PAID);
    expect(paidIntent).toBeDefined();

    // Verify reserved items committed to SOLD
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(1);
  });

  it("Scenario 2: UNDERPAID payment -> halts auto-delivery, flags UNDERPAID, does NOT sell stock", async () => {
    const order = await createOrder({
      customerEmail: "under@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const txId = `TX_UNDER_${Date.now()}`;
    const result = await handleIncomingTransaction({
      transactionId: txId,
      amount: 30000, // Short by 20,000 VND
      content: `CK ${order.orderCode} RECON`,
      bankCode: "MB",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/thiếu/i);

    // Verify DB order state: NOT marked PAID
    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(dbOrder?.status).toBe(OrderStatus.PENDING);
    expect(dbOrder?.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);
    expect(dbOrder?.reconciliationNote).toContain("20.000");

    // Stock must NOT be SOLD
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(0);

    // PaymentTransaction recorded with UNDERPAID
    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { transactionId: txId },
    });
    expect(txRecord).not.toBeNull();
    expect(txRecord?.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);
  });

  it("Scenario 3: OVERPAID payment -> does NOT fulfill order, keeps PENDING, flags OVERPAID for Owner review", async () => {
    const order = await createOrder({
      customerEmail: "over@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const txId = `TX_OVER_${Date.now()}`;
    const result = await handleIncomingTransaction({
      transactionId: txId,
      amount: 60000, // Over by 10,000 VND
      content: `Thanh toan thua ${order.orderCode} RECON`,
      bankCode: "MB",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(OrderStatus.PENDING);
    expect(result.reconciliationStatus).toBe(ReconciliationStatus.OVERPAID);

    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(dbOrder?.status).toBe(OrderStatus.PENDING);
    expect(dbOrder?.paidAt).toBeNull();
    expect(dbOrder?.reconciliationStatus).toBe(ReconciliationStatus.OVERPAID);
    expect(dbOrder?.reconciliationNote).toContain("10.000");

    // Stock must NOT be sold!
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(0);

    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { transactionId: txId },
    });
    expect(txRecord?.reconciliationStatus).toBe(ReconciliationStatus.OVERPAID);
  });

  it("Scenario 4: EXPIRED payment -> does NOT commit stock, flags EXPIRED_PAYMENT for Owner review", async () => {
    const order = await createOrder({
      customerEmail: "expired@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Backdate order to expired
    await prisma.order.update({
      where: { id: order.id },
      data: { expiresAt: new Date(Date.now() - 120000), status: OrderStatus.EXPIRED },
    });

    const txId = `TX_EXPIRED_${Date.now()}`;
    const result = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Tre han ${order.orderCode} RECON`,
      bankCode: "MB",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/expired|hết hạn/i);

    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(dbOrder?.status).toBe(OrderStatus.EXPIRED);
    expect(dbOrder?.reconciliationStatus).toBe(ReconciliationStatus.EXPIRED_PAYMENT);

    // Must NOT have committed items to SOLD
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(0);

    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { transactionId: txId },
    });
    expect(txRecord?.reconciliationStatus).toBe(ReconciliationStatus.EXPIRED_PAYMENT);
  });

  it("Scenario 5: UNMATCHED payment (no valid orderCode in memo) -> logs transaction for Owner review", async () => {
    const txId = `TX_UNMATCHED_${Date.now()}`;
    const result = await handleIncomingTransaction({
      transactionId: txId,
      amount: 100000,
      content: "Chuyen tien mua hang khong co ma don RECON",
      bankCode: "MB",
    });

    expect(result.success).toBe(false);

    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { transactionId: txId },
    });
    expect(txRecord).not.toBeNull();
    expect(txRecord?.orderId).toBeNull();
    expect(txRecord?.reconciliationStatus).toBe(ReconciliationStatus.UNMATCHED_ORDER);
  });

  it("Scenario 6: Webhook duplicate replay -> returns isDuplicate: true with zero mutations", async () => {
    const order = await createOrder({
      customerEmail: "replay@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const txId = `TX_REPLAY_${Date.now()}`;
    // 1st delivery
    const result1 = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Replay test ${order.orderCode} RECON`,
      bankCode: "MB",
    });
    expect(result1.success).toBe(true);

    // 2nd delivery (identical transactionId)
    const result2 = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: `Replay test ${order.orderCode} RECON`,
      bankCode: "MB",
    });
    expect(result2.success).toBe(true);
    expect(result2.isDuplicate).toBe(true);

    // Confirm only 1 transaction record exists
    const txCount = await prisma.paymentTransaction.count({
      where: { transactionId: txId },
    });
    expect(txCount).toBe(1);
  });
});
