import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  ReconciliationStatus,
  AuditAction,
} from "@/lib/prisma";
import {
  getPendingReconciliations,
  resolveReconciliation,
} from "@/services/admin-reconciliation.service";
import { createOrder } from "@/services/order.service";

describe("Admin Owner Manual Reconciliation & Audit Logging Service", () => {
  const TEST_CAT_SLUG = "admin-recon-cat";
  const TEST_PROD_SLUG = "admin-recon-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "ADMIN_RECON" } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "ADMIN_RECON" } },
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

    const category = await prisma.category.create({
      data: { name: "Admin Recon Cat", slug: TEST_CAT_SLUG },
    });
    catId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Admin Recon Product",
        slug: TEST_PROD_SLUG,
        description: "Admin recon test",
        price: 40000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    prodId = product.id;

    for (let i = 1; i <= 5; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `KEY-ADMIN-RECON-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "ADMIN_RECON" } },
    });
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "ADMIN_RECON" } },
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

  it("getPendingReconciliations: lists problematic transactions with summary counts", async () => {
    const tx = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_TEST_RECON_${Date.now()}`,
        amount: 25000,
        content: "Chuyen thieu ADMIN_RECON",
        reconciliationStatus: ReconciliationStatus.UNDERPAID,
        reconciliationNote: "Thiếu 15.000đ",
      },
    });

    const data = await getPendingReconciliations();
    expect(data.transactions).toBeDefined();
    expect(data.stats).toBeDefined();

    const found = data.transactions.find((t) => t.id === tx.id);
    expect(found).toBeDefined();
    expect(found?.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);
    expect(data.stats.underpaidCount).toBeGreaterThanOrEqual(1);
  });

  it("resolveReconciliation: MATCH_AND_FULFILL overrides order to PAID, commits keys and creates AuditLog", async () => {
    const order = await createOrder({
      customerEmail: "match_recon@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const tx = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_RESOLVE_${Date.now()}`,
        amount: 40000,
        content: `Khop tay ${order.orderCode} ADMIN_RECON`,
        orderId: order.id,
        reconciliationStatus: ReconciliationStatus.EXPIRED_PAYMENT,
      },
    });

    const result = await resolveReconciliation(tx.id, "MATCH_AND_FULFILL", {
      orderCode: order.orderCode,
      note: "Chủ sở hữu xác nhận hợp lệ ADMIN_RECON",
      performedBy: "OWNER",
    });

    expect(result.success).toBe(true);

    // Verify Order marked PAID & MANUAL_RESOLVED
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updatedOrder?.status).toBe(OrderStatus.PAID);
    expect(updatedOrder?.reconciliationStatus).toBe(ReconciliationStatus.MANUAL_RESOLVED);
    expect(updatedOrder?.reconciledBy).toBe("OWNER");

    // Verify Transaction updated
    const updatedTx = await prisma.paymentTransaction.findUnique({
      where: { id: tx.id },
    });
    expect(updatedTx?.reconciliationStatus).toBe(ReconciliationStatus.MANUAL_RESOLVED);
    expect(updatedTx?.resolvedBy).toBe("OWNER");

    // Verify keys committed
    const soldKeys = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldKeys.length).toBe(1);

    // Verify AuditLog written
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: order.id },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(auditLogs[0].action).toBe(AuditAction.RECONCILE_MATCH);
    expect(auditLogs[0].performedBy).toBe("OWNER");
  });

  it("resolveReconciliation: MARK_REFUNDED marks transaction refunded and logs AuditLog", async () => {
    const tx = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_REFUND_${Date.now()}`,
        amount: 50000,
        content: "Hoan tien ADMIN_RECON",
        reconciliationStatus: ReconciliationStatus.UNDERPAID,
      },
    });

    const result = await resolveReconciliation(tx.id, "MARK_REFUNDED", {
      note: "Đã chuyển hoàn 50.000đ qua Techcombank ADMIN_RECON",
      performedBy: "OWNER",
    });

    expect(result.success).toBe(true);

    const updatedTx = await prisma.paymentTransaction.findUnique({
      where: { id: tx.id },
    });
    expect(updatedTx?.reconciliationStatus).toBe("REFUNDED");
    expect(updatedTx?.resolvedBy).toBe("OWNER");

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: tx.id },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(auditLogs[0].action).toBe(AuditAction.RECONCILE_REFUND);
  });

  it("resolveReconciliation: DISMISS marks transaction dismissed and logs AuditLog", async () => {
    const tx = await prisma.paymentTransaction.create({
      data: {
        transactionId: `TX_DISMISS_${Date.now()}`,
        amount: 1000,
        content: "Spam test ADMIN_RECON",
        reconciliationStatus: ReconciliationStatus.UNMATCHED_ORDER,
      },
    });

    const result = await resolveReconciliation(tx.id, "DISMISS", {
      note: "Giao dịch rác 1.000đ ADMIN_RECON",
      performedBy: "OWNER",
    });

    expect(result.success).toBe(true);

    const updatedTx = await prisma.paymentTransaction.findUnique({
      where: { id: tx.id },
    });
    expect(updatedTx?.reconciliationStatus).toBe("DISMISSED");

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: tx.id },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(auditLogs[0].action).toBe(AuditAction.RECONCILE_DISMISS);
  });
});
