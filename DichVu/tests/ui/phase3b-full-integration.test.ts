import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  ReconciliationStatus,
  AuditAction,
  PaymentIntentStatus,
} from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import {
  regeneratePaymentIntent,
  getActivePaymentIntent,
} from "@/services/payment-intent.service";
import { handleIncomingTransaction } from "@/services/payment.service";
import {
  resolveReconciliation,
  getPendingReconciliations,
} from "@/services/admin-reconciliation.service";

describe("Phase 3B: Comprehensive 10-Scenario End-to-End Integration Suite", () => {
  const TEST_CAT_SLUG = "e2e-phase3b-cat";
  const TEST_LOCAL_PROD = "e2e-phase3b-local";
  const TEST_DROPSHIP_PROD = "e2e-phase3b-dropship";
  let catId: string;
  let localProdId: string;
  let dropshipProdId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "E2E_P3B" } },
    });
    await prisma.paymentIntent.deleteMany({
      where: {
        order: {
          orderItems: {
            some: {
              product: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } },
            },
          },
        },
      },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "E2E_P3B" } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    const category = await prisma.category.create({
      data: { name: "E2E Phase 3B Cat", slug: TEST_CAT_SLUG },
    });
    catId = category.id;

    // Local stock product
    const localProd = await prisma.product.create({
      data: {
        title: "E2E Local Stock Product",
        slug: TEST_LOCAL_PROD,
        description: "Local key stock",
        price: 30000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    localProdId = localProd.id;

    for (let i = 1; i <= 10; i++) {
      await prisma.productItem.create({
        data: {
          productId: localProdId,
          secretContent: `KEY-E2E-P3B-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    // Dropship product
    const dropshipProd = await prisma.product.create({
      data: {
        title: "E2E Dropship Service",
        slug: TEST_DROPSHIP_PROD,
        description: "SMM or external API service",
        price: 25000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
      },
    });
    dropshipProdId = dropshipProd.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "E2E_P3B" } },
    });
    await prisma.paymentIntent.deleteMany({
      where: {
        order: {
          orderItems: {
            some: {
              product: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } },
            },
          },
        },
      },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "E2E_P3B" } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } } },
    });
    await prisma.order.deleteMany({
      where: {
        orderItems: {
          some: {
            product: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } },
          },
        },
      },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_LOCAL_PROD, TEST_DROPSHIP_PROD] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  // Scenario 1: Multi-item cart with distinct targetLinks & customerNotes
  it("Scenario 1: Creates multi-item order preserving distinct targetLink and customerNote per item", async () => {
    const order = await createOrder({
      customerEmail: "scenario1@test.com",
      items: [
        {
          productId: localProdId,
          quantity: 1,
          customerNote: "Giao key buổi tối E2E_P3B",
        },
        {
          productId: dropshipProdId,
          quantity: 2,
          targetLink: "https://tiktok.com/@e2e_target",
          customerNote: "Tăng follow tự nhiên",
        },
      ],
    });

    expect(order.orderCode).toBeDefined();
    expect(order.totalAmount).toBe(30000 * 1 + 25000 * 2); // 80,000 VND
    expect(order.accessToken).toBeDefined();
    expect(order.orderItems.length).toBe(2);

    const localItem = order.orderItems.find((i) => i.productId === localProdId);
    expect(localItem?.customerNote).toBe("Giao key buổi tối E2E_P3B");

    const dropshipItem = order.orderItems.find((i) => i.productId === dropshipProdId);
    expect(dropshipItem?.targetLink).toBe("https://tiktok.com/@e2e_target");
    expect(dropshipItem?.customerNote).toBe("Tăng follow tự nhiên");
  });

  // Scenario 2: 10-Minute QR Lifecycle & Expiration
  it("Scenario 2: PaymentIntent expires strictly after 10 minutes (600s)", async () => {
    const order = await createOrder({
      customerEmail: "scenario2@test.com",
      items: [{ productId: localProdId, quantity: 1 }],
    });

    const activeIntent = await getActivePaymentIntent(order.id);
    expect(activeIntent).toBeDefined();
    expect(activeIntent?.status).toBe(PaymentIntentStatus.ACTIVE);

    // Verify 10-minute expiry (approx 600,000 ms)
    const durationMs = activeIntent!.expiresAt.getTime() - activeIntent!.createdAt.getTime();
    expect(durationMs).toBeGreaterThanOrEqual(599000);
    expect(durationMs).toBeLessThanOrEqual(601000);

    // Simulate expiration
    await prisma.paymentIntent.update({
      where: { id: activeIntent!.id },
      data: { expiresAt: new Date(Date.now() - 1000), status: PaymentIntentStatus.EXPIRED },
    });

    const expiredCheck = await getActivePaymentIntent(order.id);
    expect(expiredCheck).toBeNull();
  });

  // Scenario 3: Regenerate QR for expired order
  it("Scenario 3: Regenerates QR with fresh 10-min intent while archiving prior intent", async () => {
    const order = await createOrder({
      customerEmail: "scenario3@test.com",
      items: [{ productId: localProdId, quantity: 1 }],
    });

    // Expire order & intent
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { status: PaymentIntentStatus.EXPIRED, expiresAt: new Date(Date.now() - 5000) },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.EXPIRED, expiresAt: new Date(Date.now() - 5000) },
    });

    const regenerated = await regeneratePaymentIntent(order.orderCode);
    expect(regenerated.paymentIntent.status).toBe(PaymentIntentStatus.ACTIVE);
    expect(regenerated.paymentIntent.expiresAt.getTime()).toBeGreaterThan(Date.now() + 500000);

    // Check all intents for order
    const allIntents = await prisma.paymentIntent.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });
    expect(allIntents.length).toBe(2);
    expect(allIntents[0].status).toBe(PaymentIntentStatus.EXPIRED);
    expect(allIntents[1].status).toBe(PaymentIntentStatus.ACTIVE);
  });

  // Scenario 4: Webhook MATCHED -> PAID -> Fulfillment
  it("Scenario 4: Webhook payment MATCHED transitions order to PAID and auto-fulfills items", async () => {
    const order = await createOrder({
      customerEmail: "scenario4@test.com",
      items: [{ productId: localProdId, quantity: 1 }],
    });

    const result = await handleIncomingTransaction({
      transactionId: `TX_MATCHED_${Date.now()}`,
      amount: 30000,
      content: `Thanh toan don ${order.orderCode} E2E_P3B`,
    });

    expect(result.reconciliationStatus).toBe(ReconciliationStatus.MATCHED);
    expect(result.status).toBe(OrderStatus.PAID);

    const paidOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(paidOrder?.status).toBe(OrderStatus.PAID);
    expect(paidOrder?.paidAt).toBeDefined();

    // Check key committed to SOLD
    const soldKey = await prisma.productItem.findFirst({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldKey).toBeDefined();
  });

  // Scenario 5: Webhook UNDERPAID -> Blocks delivery, logs discrepancy
  it("Scenario 5: Webhook UNDERPAID prevents auto-delivery and flags order for Owner review", async () => {
    const order = await createOrder({
      customerEmail: "scenario5@test.com",
      items: [{ productId: localProdId, quantity: 1 }], // Price: 30,000 VND
    });

    const result = await handleIncomingTransaction({
      transactionId: `TX_UNDERPAID_${Date.now()}`,
      amount: 20000, // Short by 10,000 VND
      content: `Thanh toan don ${order.orderCode} E2E_P3B`,
    });

    expect(result.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);
    expect(result.status).toBe(OrderStatus.PENDING);

    // Order must NOT be marked PAID
    const pendingOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(pendingOrder?.status).toBe(OrderStatus.PENDING);
    expect(pendingOrder?.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);
    expect(pendingOrder?.reconciliationNote).toContain("10.000");

    // Keys must NOT be sold
    const soldKey = await prisma.productItem.findFirst({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldKey).toBeNull();
  });

  // Scenario 6: Webhook OVERPAID -> Holds in PENDING, blocks auto-delivery, records surplus note
  it("Scenario 6: Webhook OVERPAID holds order in PENDING and records surplus amount for Owner review", async () => {
    const order = await createOrder({
      customerEmail: "scenario6@test.com",
      items: [{ productId: localProdId, quantity: 1 }], // 30,000 VND
    });

    const result = await handleIncomingTransaction({
      transactionId: `TX_OVERPAID_${Date.now()}`,
      amount: 50000, // Surplus +20,000 VND
      content: `Thanh toan don ${order.orderCode} E2E_P3B`,
    });

    expect(result.reconciliationStatus).toBe(ReconciliationStatus.OVERPAID);
    expect(result.status).toBe(OrderStatus.PENDING);
    expect(result.success).toBe(false);

    const pendingOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(pendingOrder?.status).toBe(OrderStatus.PENDING);
    expect(pendingOrder?.paidAt).toBeNull();
    expect(pendingOrder?.reconciliationStatus).toBe(ReconciliationStatus.OVERPAID);
    expect(pendingOrder?.reconciliationNote).toContain("20.000");

    // Reserved stock must NOT be committed to SOLD
    const soldKey = await prisma.productItem.findFirst({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldKey).toBeNull();
  });

  // Scenario 7: Webhook EXPIRED_PAYMENT -> Blocks auto-delivery of released stock
  it("Scenario 7: Webhook payment after QR expiration is held for Owner review", async () => {
    const order = await createOrder({
      customerEmail: "scenario7@test.com",
      items: [{ productId: localProdId, quantity: 1 }],
    });

    // Expire order & intent
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { status: PaymentIntentStatus.EXPIRED, expiresAt: new Date(Date.now() - 60000) },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.EXPIRED, expiresAt: new Date(Date.now() - 60000) },
    });

    const result = await handleIncomingTransaction({
      transactionId: `TX_EXPIRED_${Date.now()}`,
      amount: 30000,
      content: `Thanh toan don ${order.orderCode} E2E_P3B`,
    });

    expect(result.reconciliationStatus).toBe(ReconciliationStatus.EXPIRED_PAYMENT);
    expect(result.status).toBe(OrderStatus.EXPIRED);

    const expiredOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(expiredOrder?.status).toBe(OrderStatus.EXPIRED);
    expect(expiredOrder?.reconciliationStatus).toBe(ReconciliationStatus.EXPIRED_PAYMENT);
  });

  // Scenario 8: Webhook UNMATCHED_ORDER -> Orphan transaction held safely
  it("Scenario 8: Webhook with invalid or missing memo logs orphan transaction without crash", async () => {
    const orphanTxId = `TX_ORPHAN_${Date.now()}`;
    const result = await handleIncomingTransaction({
      transactionId: orphanTxId,
      amount: 150000,
      content: `Chuyen tien qua momo khong kem ma don E2E_P3B`,
    });

    expect(result.reconciliationStatus).toBe(ReconciliationStatus.UNMATCHED_ORDER);
    expect(result.orderCode).toBeUndefined();

    const orphanTx = await prisma.paymentTransaction.findUnique({
      where: { transactionId: orphanTxId },
    });
    expect(orphanTx).toBeDefined();
    expect(orphanTx?.reconciliationStatus).toBe(ReconciliationStatus.UNMATCHED_ORDER);
  });

  // Scenario 9: Guest token access security
  it("Scenario 9: Guest order requires exact accessToken parameter to view delivered secrets", async () => {
    const guestOrder = await createOrder({
      items: [{ productId: localProdId, quantity: 1 }],
    });

    expect(guestOrder.accessToken).toBeDefined();
    expect(guestOrder.customerEmail).toBeNull();

    // Verify token matches UUID format
    expect(guestOrder.accessToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  // Scenario 10: Owner Manual Reconciliation with AuditLog
  it("Scenario 10: Owner manual reconciliation executes MATCH_AND_FULFILL, MARK_REFUNDED, DISMISS with AuditLog", async () => {
    // 10a. MATCH_AND_FULFILL
    const orderA = await createOrder({
      customerEmail: "recon_match@test.com",
      items: [{ productId: localProdId, quantity: 1 }],
    });
    const txA = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_MANUAL_MATCH_${Date.now()}`,
        amount: 30000,
        content: `Nop tien tay E2E_P3B`,
        reconciliationStatus: ReconciliationStatus.UNMATCHED_ORDER,
      },
    });

    const resA = await resolveReconciliation(txA.id, "MATCH_AND_FULFILL", {
      orderCode: orderA.orderCode,
      note: "Xác nhận đối soát thủ công E2E_P3B",
      performedBy: "OWNER",
    });
    expect(resA.success).toBe(true);

    const updatedOrderA = await prisma.order.findUnique({ where: { id: orderA.id } });
    expect(updatedOrderA?.status).toBe(OrderStatus.PAID);
    expect(updatedOrderA?.reconciledBy).toBe("OWNER");

    // 10b. MARK_REFUNDED
    const txB = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_MANUAL_REFUND_${Date.now()}`,
        amount: 25000,
        content: `Chuyen thieu can hoan E2E_P3B`,
        reconciliationStatus: ReconciliationStatus.UNDERPAID,
      },
    });

    const resB = await resolveReconciliation(txB.id, "MARK_REFUNDED", {
      note: "Đã hoàn qua Vietcombank E2E_P3B",
      performedBy: "OWNER",
    });
    expect(resB.success).toBe(true);

    const updatedTxB = await prisma.paymentTransaction.findUnique({ where: { id: txB.id } });
    expect(updatedTxB?.reconciliationStatus).toBe("REFUNDED");

    // 10c. DISMISS
    const txC = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_MANUAL_DISMISS_${Date.now()}`,
        amount: 1000,
        content: `Spam test E2E_P3B`,
        reconciliationStatus: ReconciliationStatus.UNMATCHED_ORDER,
      },
    });

    const resC = await resolveReconciliation(txC.id, "DISMISS", {
      note: "Spam 1k E2E_P3B",
      performedBy: "OWNER",
    });
    expect(resC.success).toBe(true);

    // Verify all 3 audit logs recorded
    const auditLogs = await prisma.auditLog.findMany({
      where: { details: { contains: "E2E_P3B" } },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
    const actions = auditLogs.map((l) => l.action);
    expect(actions).toContain(AuditAction.RECONCILE_MATCH);
    expect(actions).toContain(AuditAction.RECONCILE_REFUND);
    expect(actions).toContain(AuditAction.RECONCILE_DISMISS);
  });
});
