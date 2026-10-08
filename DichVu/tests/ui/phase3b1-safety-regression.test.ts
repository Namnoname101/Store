import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  ReconciliationStatus,
  RefundStatus,
} from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import { handleIncomingTransaction } from "@/services/payment.service";
import { resolveReconciliation } from "@/services/admin-reconciliation.service";
import { sweepExpiredPaymentIntents } from "@/services/payment-intent.service";
import { POST as paymentWebhookPost } from "@/app/api/webhooks/payment/route";
import { GET as getOrderStatus } from "@/app/api/orders/[orderCode]/status/route";

describe("Phase 3B.1 Safety Regression Suite (12 Scenarios)", () => {
  const TEST_CAT_SLUG = "regress-safety-cat";
  const TEST_PROD_SLUG = "regress-safety-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Clean up any lingering test artifacts
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "REGRESS_3B1" } },
    });
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "REGRESS_3B1" } },
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
      data: { name: "Safety Regression Category", slug: TEST_CAT_SLUG },
    });
    catId = cat.id;

    const prod = await prisma.product.create({
      data: {
        title: "Safety Regression Product",
        slug: TEST_PROD_SLUG,
        description: "Regression testing product",
        price: 50000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    prodId = prod.id;

    for (let i = 1; i <= 20; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `SECRET-REGRESS-3B1-KEY-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { details: { contains: "REGRESS_3B1" } },
    });
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "REGRESS_3B1" } },
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

  // Scenario 1: OVERPAID does not auto-fulfill
  it("Scenario 1: OVERPAID does not auto-complete to PAID or auto-fulfill; holds in PENDING for manual review", async () => {
    const order = await createOrder({
      customerEmail: "sc1-overpaid@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const res = await handleIncomingTransaction({
      transactionId: `REGRESS_3B1_TX_SC1_${Date.now()}`,
      amount: order.totalAmount + 20000, // OVERPAID by 20,000 VND
      content: `Thanh toan don ${order.orderCode} REGRESS_3B1`,
    });

    expect(res.success).toBe(false);
    expect(res.reconciliationStatus).toBe(ReconciliationStatus.OVERPAID);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updated?.status).toBe(OrderStatus.PENDING);
    expect(updated?.reconciliationStatus).toBe(ReconciliationStatus.OVERPAID);

    // Stock must remain RESERVED and NOT committed to SOLD
    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(0);
  });

  // Scenario 2: UNDERPAID does not auto-fulfill
  it("Scenario 2: UNDERPAID does not auto-fulfill; holds in PENDING with UNDERPAID status", async () => {
    const order = await createOrder({
      customerEmail: "sc2-underpaid@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const res = await handleIncomingTransaction({
      transactionId: `REGRESS_3B1_TX_SC2_${Date.now()}`,
      amount: order.totalAmount - 10000, // UNDERPAID by 10,000 VND
      content: `Thanh toan don ${order.orderCode} REGRESS_3B1`,
    });

    expect(res.success).toBe(false);
    expect(res.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updated?.status).toBe(OrderStatus.PENDING);
    expect(updated?.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);

    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(0);
  });

  // Scenario 3: MISMATCH_MEMO / UNMATCHED_ORDER does not auto-fulfill
  it("Scenario 3: Memo without order code records unmatched transaction without modifying any orders", async () => {
    const txId = `REGRESS_3B1_TX_SC3_${Date.now()}`;
    const res = await handleIncomingTransaction({
      transactionId: txId,
      amount: 50000,
      content: "Chuyen tien an trua khong co ma don hang REGRESS_3B1",
    });

    expect(res.success).toBe(false);
    expect(res.reconciliationStatus).toBe(ReconciliationStatus.UNMATCHED_ORDER);

    const tx = await prisma.paymentTransaction.findUnique({
      where: { transactionId: txId },
    });
    expect(tx?.orderId).toBeNull();
    expect(tx?.reconciliationStatus).toBe(ReconciliationStatus.UNMATCHED_ORDER);
  });

  // Scenario 4: EXPIRED_PAYMENT does not auto-fulfill
  it("Scenario 4: EXPIRED_PAYMENT does not auto-fulfill when payment arrives after order expiration", async () => {
    const order = await createOrder({
      customerEmail: "sc4-expired@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Artificially expire the order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.EXPIRED,
        expiresAt: new Date(Date.now() - 3600 * 1000),
      },
    });

    const res = await handleIncomingTransaction({
      transactionId: `REGRESS_3B1_TX_SC4_${Date.now()}`,
      amount: order.totalAmount,
      content: `Thanh toan ${order.orderCode} REGRESS_3B1`,
    });

    expect(res.success).toBe(false);
    expect(res.reconciliationStatus).toBe(ReconciliationStatus.EXPIRED_PAYMENT);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updated?.status).toBe(OrderStatus.EXPIRED);

    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(0);
  });

  // Scenario 5: Exact MATCHED fulfills only once
  it("Scenario 5: Exact MATCHED payment fulfills order and commits items exactly once", async () => {
    const order = await createOrder({
      customerEmail: "sc5-matched@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const res = await handleIncomingTransaction({
      transactionId: `REGRESS_3B1_TX_SC5_${Date.now()}`,
      amount: order.totalAmount,
      content: `Thanh toan ${order.orderCode} REGRESS_3B1`,
    });

    expect(res.success).toBe(true);
    expect(res.reconciliationStatus).toBe(ReconciliationStatus.MATCHED);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updated?.status).toBe(OrderStatus.PAID);
    expect(updated?.paidAt).not.toBeNull();

    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(1);
  });

  // Scenario 6: Fake / unauthorized webhook does not activate order
  it("Scenario 6: Fake / unauthorized webhook request is rejected with 401 Unauthorized", async () => {
    const originalEnv = process.env.PAYMENT_WEBHOOK_SECRET;
    try {
      process.env.PAYMENT_WEBHOOK_SECRET = "super_secure_production_webhook_secret_key";

      const order = await createOrder({
        customerEmail: "sc6-fake-wh@test.com",
        items: [{ productId: prodId, quantity: 1 }],
      });

      const fakeReq = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "wrong_attacker_secret",
        },
        body: JSON.stringify({
          gateway: "vietqr",
          transactionId: `REGRESS_3B1_TX_SC6_${Date.now()}`,
          amount: order.totalAmount,
          content: `Thanh toan ${order.orderCode} REGRESS_3B1`,
        }),
      });

      const response = await paymentWebhookPost(fakeReq);
      expect(response.status).toBe(401);

      const updated = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(updated?.status).toBe(OrderStatus.PENDING);
    } finally {
      process.env.PAYMENT_WEBHOOK_SECRET = originalEnv;
    }
  });

  // Scenario 7: Concurrent / duplicate webhooks do not double-fulfill
  it("Scenario 7: Duplicate webhook execution returns isDuplicate: true without duplicate key allocation", async () => {
    const order = await createOrder({
      customerEmail: "sc7-dup-wh@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const txId = `REGRESS_3B1_TX_SC7_${Date.now()}`;
    const payload = {
      transactionId: txId,
      amount: order.totalAmount,
      content: `Thanh toan ${order.orderCode} REGRESS_3B1`,
    };

    const firstRun = await handleIncomingTransaction(payload);
    expect(firstRun.success).toBe(true);

    const secondRun = await handleIncomingTransaction(payload);
    expect(secondRun.isDuplicate).toBe(true);

    const soldItems = await prisma.productItem.findMany({
      where: { orderId: order.id, status: ItemStatus.SOLD },
    });
    expect(soldItems.length).toBe(1);
  });

  // Scenario 8: Concurrent Admin resolutions do not double-fulfill
  it("Scenario 8: Concurrent Admin resolutions reject duplicate processing with conflict error", async () => {
    const order = await createOrder({
      customerEmail: "sc8-admin-race@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const underpaidTxId = `REGRESS_3B1_TX_SC8_${Date.now()}`;
    await handleIncomingTransaction({
      transactionId: underpaidTxId,
      amount: order.totalAmount - 5000,
      content: `Thanh toan ${order.orderCode} REGRESS_3B1`,
    });

    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { transactionId: underpaidTxId },
    });
    expect(txRecord).not.toBeNull();

    // Simulate two simultaneous Admin resolve calls
    const [res1, res2] = await Promise.allSettled([
      resolveReconciliation(txRecord!.id, "MATCH_AND_FULFILL", {
        note: "Manual match race 1 REGRESS_3B1",
      }),
      resolveReconciliation(txRecord!.id, "MATCH_AND_FULFILL", {
        note: "Manual match race 2 REGRESS_3B1",
      }),
    ]);

    const successes = [res1, res2].filter((r) => r.status === "fulfilled");
    const rejections = [res1, res2].filter((r) => r.status === "rejected");

    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(1);
    if (rejections[0].status === "rejected") {
      expect((rejections[0] as PromiseRejectedResult).reason.message).toMatch(
        /(Giao dịch này đã được đối soát|đã được thanh toán bởi một tiến trình khác)/
      );
    }
  });

  // Scenario 9: Refund without proof is rejected
  it("Scenario 9: MARK_REFUNDED without valid refund proof is strictly rejected", async () => {
    const refundTxId = `REGRESS_3B1_TX_SC9_${Date.now()}`;
    await handleIncomingTransaction({
      transactionId: refundTxId,
      amount: 25000,
      content: "Chuyen tien sai khong ma don REGRESS_3B1",
    });

    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { transactionId: refundTxId },
    });
    expect(txRecord).not.toBeNull();

    await expect(
      resolveReconciliation(txRecord!.id, "MARK_REFUNDED", {
        refundProof: "   ", // Blank / whitespace proof
        note: "Refund attempt without proof REGRESS_3B1",
      })
    ).rejects.toThrow(/cung cấp mã giao dịch ngân hàng/);

    // Now call with valid proof and verify success
    const validRefund = await resolveReconciliation(txRecord!.id, "MARK_REFUNDED", {
      refundProof: "FT26100899998888",
      note: "Valid refund with bank reference REGRESS_3B1",
    });
    expect(validRefund.success).toBe(true);
    expect(validRefund.refundStatus).toBe(RefundStatus.REFUNDED);
    expect(validRefund.refundProof).toBe("FT26100899998888");

    const updatedTx = await prisma.paymentTransaction.findUnique({
      where: { id: txRecord!.id },
    });
    expect(updatedTx?.refundStatus).toBe(RefundStatus.REFUNDED);
    expect(updatedTx?.refundProof).toBe("FT26100899998888");
  });

  // Scenario 10: Secrets masked without guest accessToken
  it("Scenario 10: Guest order secrets are masked when accessed without valid unexpired accessToken", async () => {
    const order = await createOrder({
      items: [{ productId: prodId, quantity: 1 }],
      // Guest order without email or userId
    });

    // Fulfill order
    await handleIncomingTransaction({
      transactionId: `REGRESS_3B1_TX_SC10_${Date.now()}`,
      amount: order.totalAmount,
      content: `Thanh toan ${order.orderCode} REGRESS_3B1`,
    });

    // Request WITHOUT token
    const reqWithoutToken = new Request(
      `http://localhost:3000/api/orders/${order.orderCode}/status`
    );
    const resWithout = await getOrderStatus(reqWithoutToken, {
      params: { orderCode: order.orderCode },
    });
    const dataWithout = await resWithout.json();
    expect(dataWithout.deliveredItems).toEqual([]);

    // Request WITH valid accessToken
    const reqWithToken = new Request(
      `http://localhost:3000/api/orders/${order.orderCode}/status?token=${order.accessToken}`
    );
    const resWith = await getOrderStatus(reqWithToken, {
      params: { orderCode: order.orderCode },
    });
    const dataWith = await resWith.json();
    expect(dataWith.deliveredItems.length).toBe(1);
    expect(dataWith.deliveredItems[0].secretContent).toContain("SECRET-REGRESS-3B1");
  });

  // Scenario 11: Expired QR intent payment does not activate a new QR intent
  it("Scenario 11: Background sweep expires stale intents without spawning new active intents", async () => {
    const order = await createOrder({
      customerEmail: "sc11-sweep@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Fast-forward intent and order past 600s
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 5000) },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { expiresAt: new Date(Date.now() - 5000) },
    });

    const count = await sweepExpiredPaymentIntents();
    expect(count).toBeGreaterThanOrEqual(1);

    const intents = await prisma.paymentIntent.findMany({
      where: { orderId: order.id },
    });
    expect(intents.length).toBe(1);
    expect(intents[0].status).toBe("EXPIRED");

    const orderUpdated = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(orderUpdated?.status).toBe(OrderStatus.EXPIRED);
  });

  // Scenario 12: Migration retains historical records
  it("Scenario 12: Database migration preserves historical order records with nullable refund fields", async () => {
    // Verify an order can have null refundStatus, refundProof, refundedAt
    const order = await createOrder({
      customerEmail: "sc12-legacy@test.com",
      items: [{ productId: prodId, quantity: 1 }],
    });

    const queried = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        orderCode: true,
        refundStatus: true,
        refundProof: true,
        refundedAt: true,
      },
    });

    expect(queried).not.toBeNull();
    expect(queried?.refundStatus).toBeNull();
    expect(queried?.refundProof).toBeNull();
    expect(queried?.refundedAt).toBeNull();

    // Verify existing fields are fully accessible
    expect(queried?.orderCode).toBe(order.orderCode);
  });
});
