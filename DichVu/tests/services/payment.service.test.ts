import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma, ItemStatus, OrderStatus } from "@/lib/prisma";
import {
  handleIncomingTransaction,
  BankTransactionPayload,
} from "@/services/payment.service";
import { POST as paymentWebhookRoute } from "@/app/api/webhooks/payment/route";
import { createOrder } from "@/services/order.service";

describe("Payment Service & Webhook Handler", () => {
  const TEST_CATEGORY_SLUG = "test-pay-cat";
  const TEST_PRODUCT_SLUG = "test-pay-prod";
  const TEST_CUSTOMER_EMAIL = "buyer-pay@example.com";

  let testCategoryId: string;
  let testProductId: string;

  async function seedStock(productId: string, keys: string[]) {
    return await prisma.productItem.createMany({
      data: keys.map((key) => ({
        productId,
        secretContent: key,
        status: ItemStatus.AVAILABLE,
      })),
    });
  }

  beforeAll(async () => {
    // Teardown any leftovers
    await prisma.paymentTransaction.deleteMany({
      where: {
        OR: [
          { transactionId: { startsWith: "TX_" } },
          { transactionId: { startsWith: "SEPAY_" } },
          { transactionId: { startsWith: "PAYOS_" } },
        ],
      },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });

    // Create Category & Product
    const category = await prisma.category.create({
      data: {
        name: "Test Payment Category",
        slug: TEST_CATEGORY_SLUG,
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Test Payment Product",
        slug: TEST_PRODUCT_SLUG,
        description: "Test payment product description",
        price: 50000,
        categoryId: testCategoryId,
        isActive: true,
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.paymentTransaction.deleteMany({
      where: {
        OR: [
          { transactionId: { startsWith: "TX_" } },
          { transactionId: { startsWith: "SEPAY_" } },
          { transactionId: { startsWith: "PAYOS_" } },
        ],
      },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });
  });

  describe("handleIncomingTransaction", () => {
    it("matches order, marks Order as PAID, and commits reserved items to SOLD", async () => {
      await seedStock(testProductId, ["PAY-KEY-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      const txId = `TX_${Date.now()}_1`;
      const payload: BankTransactionPayload = {
        transactionId: txId,
        amount: 50000,
        content: `Chuyen tien don hang ${order.orderCode} tai shop`,
        bankCode: "MB",
      };

      const result = await handleIncomingTransaction(payload);

      expect(result.success).toBe(true);
      expect(result.orderCode).toBe(order.orderCode);
      expect(result.status).toBe(OrderStatus.PAID);

      // Verify Order is updated in DB
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder?.status).toBe(OrderStatus.PAID);
      expect(updatedOrder?.paidAt).toBeInstanceOf(Date);

      // Verify reserved items committed to SOLD
      const items = await prisma.productItem.findMany({
        where: { orderId: order.id },
      });
      expect(items.length).toBe(1);
      expect(items[0].status).toBe(ItemStatus.SOLD);
      expect(items[0].reservedUntil).toBeNull();

      // Verify PaymentTransaction created
      const paymentTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId: txId },
      });
      expect(paymentTx).not.toBeNull();
      expect(paymentTx?.orderId).toBe(order.id);
      expect(paymentTx?.amount).toBe(50000);
      expect(paymentTx?.bankCode).toBe("MB");
    });

    it("is idempotent and ignores duplicate transaction IDs", async () => {
      await seedStock(testProductId, ["PAY-KEY-2"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      const txId = `TX_${Date.now()}_2`;
      const payload: BankTransactionPayload = {
        transactionId: txId,
        amount: 50000,
        content: `Thanh toan ${order.orderCode}`,
        bankCode: "VCB",
      };

      // First run
      const firstResult = await handleIncomingTransaction(payload);
      expect(firstResult.success).toBe(true);
      expect(firstResult.isDuplicate).toBeFalsy();

      // Duplicate run
      const duplicateResult = await handleIncomingTransaction(payload);
      expect(duplicateResult.success).toBe(true);
      expect(duplicateResult.isDuplicate).toBe(true);
      expect(duplicateResult.message).toContain("already processed");

      // Verify only ONE transaction record exists
      const count = await prisma.paymentTransaction.count({
        where: { transactionId: txId },
      });
      expect(count).toBe(1);
    });

    it("flags underpaid orders, does NOT mark PAID, and leaves items reserved", async () => {
      await seedStock(testProductId, ["PAY-KEY-3"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      const txId = `TX_${Date.now()}_3`;
      const payload: BankTransactionPayload = {
        transactionId: txId,
        amount: 25000, // Less than 50000
        content: `Chuyen khoan thieu ${order.orderCode}`,
        bankCode: "ACB",
      };

      const result = await handleIncomingTransaction(payload);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/underpaid/i);
      expect(result.orderCode).toBe(order.orderCode);

      // Verify Order remains PENDING
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderInDb?.status).toBe(OrderStatus.PENDING);
      expect(orderInDb?.paidAt).toBeNull();

      // Verify items remain RESERVED (not SOLD)
      const items = await prisma.productItem.findMany({
        where: { orderId: order.id },
      });
      expect(items.length).toBe(1);
      expect(items[0].status).toBe(ItemStatus.RESERVED);

      // Verify transaction is logged with orderId for review
      const paymentTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId: txId },
      });
      expect(paymentTx).not.toBeNull();
      expect(paymentTx?.orderId).toBe(order.id);
      expect(paymentTx?.amount).toBe(25000);
    });

    it("logs transaction without order when order code is missing or invalid in memo", async () => {
      const txId = `TX_${Date.now()}_4`;
      const payload: BankTransactionPayload = {
        transactionId: txId,
        amount: 50000,
        content: "Chuyen tien ca phe khong co ma don",
        bankCode: "MB",
      };

      const result = await handleIncomingTransaction(payload);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/order code not found/i);

      // Verify PaymentTransaction created with orderId = null
      const paymentTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId: txId },
      });
      expect(paymentTx).not.toBeNull();
      expect(paymentTx?.orderId).toBeNull();
      expect(paymentTx?.amount).toBe(50000);
    });

    it("logs transaction without order when order code does not exist in DB", async () => {
      const txId = `TX_${Date.now()}_5`;
      const payload: BankTransactionPayload = {
        transactionId: txId,
        amount: 50000,
        content: "ORD999999 tien nap",
        bankCode: "MB",
      };

      const result = await handleIncomingTransaction(payload);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found/i);

      const paymentTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId: txId },
      });
      expect(paymentTx).not.toBeNull();
      expect(paymentTx?.orderId).toBeNull();
    });

    it("records transaction and returns success when order is already PAID", async () => {
      await seedStock(testProductId, ["PAY-KEY-4"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      // Mark order as PAID first
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      const txId = `TX_${Date.now()}_6`;
      const payload: BankTransactionPayload = {
        transactionId: txId,
        amount: 50000,
        content: `Thanh toan lai ${order.orderCode}`,
        bankCode: "MB",
      };

      const result = await handleIncomingTransaction(payload);

      expect(result.success).toBe(true);
      expect(result.status).toBe(OrderStatus.PAID);

      const paymentTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId: txId },
      });
      expect(paymentTx).not.toBeNull();
      expect(paymentTx?.orderId).toBe(order.id);
    });

    it("logs transaction and flags manual review when order is EXPIRED", async () => {
      await seedStock(testProductId, ["PAY-KEY-5"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      // Mark order as EXPIRED
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.EXPIRED },
      });

      const txId = `TX_${Date.now()}_7`;
      const payload: BankTransactionPayload = {
        transactionId: txId,
        amount: 50000,
        content: `Thanh toan muon ${order.orderCode}`,
        bankCode: "MB",
      };

      const result = await handleIncomingTransaction(payload);

      expect(result.success).toBe(false);
      expect(result.status).toBe(OrderStatus.EXPIRED);
      expect(result.error).toMatch(/expired|manual review/i);

      // Verify transaction is logged
      const paymentTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId: txId },
      });
      expect(paymentTx).not.toBeNull();
      expect(paymentTx?.orderId).toBe(order.id);
    });
  });

  describe("API Route: POST /api/webhooks/payment", () => {
    it("returns 200 on successful payment processing", async () => {
      await seedStock(testProductId, ["PAY-KEY-ROUTE-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      const txId = `TX_${Date.now()}_ROUTE_1`;
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: txId,
          amount: 50000,
          content: `Pay for ${order.orderCode}`,
          bankCode: "MB",
        }),
      });

      const res = await paymentWebhookRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.orderCode).toBe(order.orderCode);
      expect(data.status).toBe(OrderStatus.PAID);
    });

    it("returns 200 on duplicate transaction replay (idempotent)", async () => {
      await seedStock(testProductId, ["PAY-KEY-ROUTE-2"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      const txId = `TX_${Date.now()}_ROUTE_2`;
      const body = JSON.stringify({
        transactionId: txId,
        amount: 50000,
        content: `Pay for ${order.orderCode}`,
        bankCode: "MB",
      });

      // First call
      const req1 = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const res1 = await paymentWebhookRoute(req1);
      expect(res1.status).toBe(200);

      // Replay call
      const req2 = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const res2 = await paymentWebhookRoute(req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.success).toBe(true);
      expect(data2.isDuplicate).toBe(true);
    });

    it("returns 400 for malformed payload (missing transactionId or amount)", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "No transaction ID or amount",
        }),
      });

      const res = await paymentWebhookRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("returns 400 for invalid JSON body", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json{{",
      });

      const res = await paymentWebhookRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("handles SePay webhook payload format", async () => {
      await seedStock(testProductId, ["PAY-KEY-SEPAY-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      const sepayId = `SEPAY_${Date.now()}`;
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sepayId,
          gateway: "MBBank",
          transferAmount: 50000,
          content: `SEPAY CHUYEN KHOAN ${order.orderCode}`,
          transferType: "in",
        }),
      });

      const res = await paymentWebhookRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.orderCode).toBe(order.orderCode);
    });

    it("handles PayOS webhook payload format", async () => {
      await seedStock(testProductId, ["PAY-KEY-PAYOS-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProductId, quantity: 1 }],
      });

      const payosRef = `PAYOS_${Date.now()}`;
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "00",
          desc: "success",
          data: {
            orderCode: 123456,
            amount: 50000,
            description: `PAYOS TT ${order.orderCode}`,
            accountNumber: "0987654321",
            reference: payosRef,
            counterAccountBankId: "VCB",
          },
        }),
      });

      const res = await paymentWebhookRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.orderCode).toBe(order.orderCode);
    });

    it("enforces PAYMENT_WEBHOOK_SECRET authentication when configured", async () => {
      const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET;
      process.env.PAYMENT_WEBHOOK_SECRET = "super-secret-token";

      try {
        // Missing token -> 401
        const reqUnauthorized = new Request(
          "http://localhost:3000/api/webhooks/payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: `TX_${Date.now()}_UNAUTH`,
              amount: 50000,
              content: "test",
            }),
          }
        );
        const resUnauthorized = await paymentWebhookRoute(reqUnauthorized);
        expect(resUnauthorized.status).toBe(401);

        // Valid token in x-webhook-secret header -> passes auth
        const reqAuthorized = new Request(
          "http://localhost:3000/api/webhooks/payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-webhook-secret": "super-secret-token",
            },
            body: JSON.stringify({
              transactionId: `TX_${Date.now()}_AUTH`,
              amount: 50000,
              content: "test ORD888888",
            }),
          }
        );
        const resAuthorized = await paymentWebhookRoute(reqAuthorized);
        // Auth passed (even if order not found, status is 200 or 400, not 401)
        expect(resAuthorized.status).not.toBe(401);
      } finally {
        if (originalSecret !== undefined) {
          process.env.PAYMENT_WEBHOOK_SECRET = originalSecret;
        } else {
          delete process.env.PAYMENT_WEBHOOK_SECRET;
        }
      }
    });
  });
});
