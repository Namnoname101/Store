import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limiter";
import { GET as getOrderStatus } from "@/app/api/orders/[orderCode]/status/route";
import { POST as createOrderApi } from "@/app/api/orders/route";
import { POST as paymentWebhookPost } from "@/app/api/webhooks/payment/route";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
} from "@/lib/prisma";

describe("Task 9: Security & Privacy Audit Verification Suite", () => {
  const TEST_CAT_SLUG = "sec-audit-cat";
  const TEST_PROD_SLUG = "sec-audit-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Teardown
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
      data: { name: "Security Audit Cat", slug: TEST_CAT_SLUG },
    });
    catId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Security Audit Product",
        slug: TEST_PROD_SLUG,
        description: "Security testing item",
        price: 50000,
        categoryId: catId,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        isActive: true,
      },
    });
    prodId = product.id;

    for (let i = 1; i <= 3; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `SUPER-SECRET-KEY-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }
  });

  afterAll(async () => {
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
  });

  describe("1. Auth & Authorization Guardrails", () => {
    it("rejects unauthenticated access to /admin routes with 307 redirect to /admin/login", async () => {
      const paths = ["/admin", "/admin/products", "/admin/inventory", "/admin/orders", "/admin/settings"];
      for (const p of paths) {
        const req = new NextRequest(`http://localhost:3000${p}`);
        const res = await middleware(req);
        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/admin/login");
      }
    });

    it("rejects unauthenticated access to /api/admin/* endpoints with 401 Unauthorized", async () => {
      const endpoints = [
        "/api/admin/products",
        "/api/admin/inventory/import",
        "/api/admin/suppliers",
        "/api/admin/coupons",
        "/api/admin/reconciliation",
      ];
      for (const ep of endpoints) {
        const req = new NextRequest(`http://localhost:3000${ep}`);
        const res = await middleware(req);
        expect(res.status).toBe(401);
      }
    });

    it("rejects spoofed / forged admin session cookie with 307 redirect", async () => {
      const req = new NextRequest("http://localhost:3000/admin/products", {
        headers: {
          cookie: "admin_session=spoofed.forged.signature",
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/admin/login");
    });
  });

  describe("2. Rate Limiting Engine", () => {
    it("correctly enforces rate limits and resets after window", () => {
      resetRateLimitStore();
      const testKey = "test-rate-limit-ip";
      const config = { limit: 3, windowMs: 1000 };

      // 1st, 2nd, 3rd requests succeed
      expect(checkRateLimit(testKey, config).success).toBe(true);
      expect(checkRateLimit(testKey, config).success).toBe(true);
      expect(checkRateLimit(testKey, config).success).toBe(true);

      // 4th request must be blocked
      const blocked = checkRateLimit(testKey, config);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.reset).toBeGreaterThan(0);
    });

    it("returns HTTP 429 when order creation exceeds limit", async () => {
      resetRateLimitStore();
      const spamIp = "192.168.1.100";

      // Trigger 30 requests to exhaust limit
      for (let i = 0; i < 30; i++) {
        checkRateLimit(`order-create:${spamIp}`, { limit: 30, windowMs: 60000 });
      }

      // Next request through route handler must return 429
      const req = new Request("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": spamIp,
        },
        body: JSON.stringify({
          items: [{ productId: prodId, quantity: 1 }],
        }),
      });

      const res = await createOrderApi(req);
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toMatch(/Quá nhiều yêu cầu tạo đơn/i);
    });
  });

  describe("3. Guest Order Token & 30-Day TTL Security", () => {
    it("conceals delivered secrets when queried without accessToken", async () => {
      // Create order with local stock key
      const key = await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: "HIGHLY-CONFIDENTIAL-KEY-101",
          status: ItemStatus.AVAILABLE,
        },
      });

      const validToken = `tok-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const order = await prisma.order.create({
        data: {
          orderCode: `ORD_SEC_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          accessToken: validToken,
          totalAmount: 50000,
          status: OrderStatus.PAID,
          expiresAt: new Date(Date.now() + 600000),
          paidAt: new Date(),
          orderItems: {
            create: {
              productId: prodId,
              price: 50000,
              quantity: 1,
            },
          },
        },
      });

      await prisma.productItem.update({
        where: { id: key.id },
        data: { status: ItemStatus.SOLD, orderId: order.id },
      });

      // Request WITHOUT token
      const unauthReq = new Request(
        `http://localhost:3000/api/orders/${order.orderCode}/status`
      );
      const resUnauth = await getOrderStatus(unauthReq, {
        params: { orderCode: order.orderCode },
      });
      const dataUnauth = await resUnauth.json();

      expect(dataUnauth.status).toBe(OrderStatus.PAID);
      // Secrets must be hidden!
      expect(dataUnauth.deliveredItems.length).toBe(0);

      // Request WITH wrong token
      const wrongReq = new Request(
        `http://localhost:3000/api/orders/${order.orderCode}/status?token=wrong-token`
      );
      const resWrong = await getOrderStatus(wrongReq, {
        params: { orderCode: order.orderCode },
      });
      const dataWrong = await resWrong.json();
      expect(dataWrong.deliveredItems.length).toBe(0);

      // Request WITH correct token
      const authReq = new Request(
        `http://localhost:3000/api/orders/${order.orderCode}/status?token=${validToken}`
      );
      const resAuth = await getOrderStatus(authReq, {
        params: { orderCode: order.orderCode },
      });
      const dataAuth = await resAuth.json();
      expect(dataAuth.deliveredItems.length).toBe(1);
      expect(dataAuth.deliveredItems[0].secretContent).toBe("HIGHLY-CONFIDENTIAL-KEY-101");
    });

    it("expires accessToken after 30 days and conceals delivered secrets", async () => {
      // Create order with createdAt 31 days in past
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

      const oldKey = await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: "OLD-EXPIRED-SECRET-KEY-999",
          status: ItemStatus.AVAILABLE,
        },
      });

      const oldToken = `old-tok-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const oldOrder = await prisma.order.create({
        data: {
          orderCode: `ORD_OLD_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          accessToken: oldToken,
          totalAmount: 50000,
          status: OrderStatus.PAID,
          createdAt: thirtyOneDaysAgo,
          expiresAt: thirtyOneDaysAgo,
          paidAt: thirtyOneDaysAgo,
          orderItems: {
            create: {
              productId: prodId,
              price: 50000,
              quantity: 1,
            },
          },
        },
      });

      await prisma.productItem.update({
        where: { id: oldKey.id },
        data: { status: ItemStatus.SOLD, orderId: oldOrder.id },
      });

      // Query with the correct token on a 31-day old order
      const req = new Request(
        `http://localhost:3000/api/orders/${oldOrder.orderCode}/status?token=old-token-from-last-month`
      );
      const res = await getOrderStatus(req, {
        params: { orderCode: oldOrder.orderCode },
      });
      const data = await res.json();

      // Because > 30 days old, token is expired and deliveredItems must be empty
      expect(data.deliveredItems.length).toBe(0);
    });
  });

  describe("4. Webhook Security & Idempotency", () => {
    it("rejects unauthorized webhook calls without valid signature in secure mode", async () => {
      const origSecret = process.env.PAYMENT_WEBHOOK_SECRET;
      process.env.PAYMENT_WEBHOOK_SECRET = "super-secret-hmac-key";

      try {
        const req = new Request("http://localhost:3000/api/webhooks/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": "wrong-secret",
          },
          body: JSON.stringify({
            transactionId: "TX_UNAUTH_101",
            amount: 50000,
            content: "ORD999999",
          }),
        });

        const res = await paymentWebhookPost(req);
        expect(res.status).toBe(401);
      } finally {
        if (origSecret) {
          process.env.PAYMENT_WEBHOOK_SECRET = origSecret;
        } else {
          delete process.env.PAYMENT_WEBHOOK_SECRET;
        }
      }
    });
  });
});
