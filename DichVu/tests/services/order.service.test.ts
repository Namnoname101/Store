import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma, ItemStatus, OrderStatus } from "@/lib/prisma";
import {
  createOrder,
  getOrderDetails,
  checkAndExpireOrder,
} from "@/services/order.service";
import { POST as createOrderRoute } from "@/app/api/orders/route";
import { GET as getOrderStatusRoute } from "@/app/api/orders/[orderCode]/status/route";

describe("Order Creation & Checkout Service", () => {
  const TEST_CATEGORY_SLUG = "test-order-cat";
  const TEST_PRODUCT_1_SLUG = "test-order-prod-1";
  const TEST_PRODUCT_2_SLUG = "test-order-prod-2";
  const TEST_INACTIVE_SLUG = "test-order-inactive-prod";
  const TEST_CUSTOMER_EMAIL = "customer@example.com";

  let testCategoryId: string;
  let testProduct1Id: string;
  let testProduct2Id: string;
  let testInactiveProductId: string;

  beforeAll(async () => {
    // Clean up residual data
    await prisma.productItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_1_SLUG,
              TEST_PRODUCT_2_SLUG,
              TEST_INACTIVE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_1_SLUG,
              TEST_PRODUCT_2_SLUG,
              TEST_INACTIVE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: { contains: "order-test" } },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: {
        slug: {
          in: [
            TEST_PRODUCT_1_SLUG,
            TEST_PRODUCT_2_SLUG,
            TEST_INACTIVE_SLUG,
          ],
        },
      },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: "Test Order Category",
        slug: TEST_CATEGORY_SLUG,
        description: "Category for order tests",
      },
    });
    testCategoryId = category.id;

    // Create active product 1 (Price: 100,000 VND)
    const p1 = await prisma.product.create({
      data: {
        title: "Test Key 1",
        slug: TEST_PRODUCT_1_SLUG,
        description: "License Key 1",
        price: 100000,
        categoryId: testCategoryId,
        type: "LICENSE_KEY",
        isActive: true,
      },
    });
    testProduct1Id = p1.id;

    // Create active product 2 (Price: 250,000 VND)
    const p2 = await prisma.product.create({
      data: {
        title: "Test Account 2",
        slug: TEST_PRODUCT_2_SLUG,
        description: "Account 2",
        price: 250000,
        categoryId: testCategoryId,
        type: "ACCOUNT",
        isActive: true,
      },
    });
    testProduct2Id = p2.id;

    // Create inactive product
    const inactiveProd = await prisma.product.create({
      data: {
        title: "Inactive Product",
        slug: TEST_INACTIVE_SLUG,
        description: "Inactive product for testing",
        price: 50000,
        categoryId: testCategoryId,
        type: "COURSE_LINK",
        isActive: false,
      },
    });
    testInactiveProductId = inactiveProd.id;
  });

  afterAll(async () => {
    await prisma.productItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_1_SLUG,
              TEST_PRODUCT_2_SLUG,
              TEST_INACTIVE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_1_SLUG,
              TEST_PRODUCT_2_SLUG,
              TEST_INACTIVE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: { contains: "order-test" } },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: {
        slug: {
          in: [
            TEST_PRODUCT_1_SLUG,
            TEST_PRODUCT_2_SLUG,
            TEST_INACTIVE_SLUG,
          ],
        },
      },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset product items and orders
    await prisma.productItem.deleteMany({
      where: {
        productId: {
          in: [testProduct1Id, testProduct2Id, testInactiveProductId],
        },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        productId: {
          in: [testProduct1Id, testProduct2Id, testInactiveProductId],
        },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: { contains: "order-test" } },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
  });

  async function seedStock(productId: string, secrets: string[]) {
    return prisma.productItem.createMany({
      data: secrets.map((secret) => ({
        productId,
        secretContent: secret,
        status: ItemStatus.AVAILABLE,
      })),
    });
  }

  describe("createOrder", () => {
    it("rejects invalid email formats", async () => {
      await expect(
        createOrder({
          customerEmail: "",
          items: [{ productId: testProduct1Id, quantity: 1 }],
        })
      ).rejects.toThrow(/email/i);

      await expect(
        createOrder({
          customerEmail: "invalid-email-string",
          items: [{ productId: testProduct1Id, quantity: 1 }],
        })
      ).rejects.toThrow(/email/i);
    });

    it("allows guest checkout when customerEmail is omitted", async () => {
      await seedStock(testProduct1Id, ["WIN-GUEST-001"]);
      const order = await createOrder({
        items: [{ productId: testProduct1Id, quantity: 1 }],
      });
      expect(order).toBeDefined();
      expect(order.customerEmail).toBeNull();
      expect(order.totalAmount).toBe(100000);
      expect(order.status).toBe("PENDING");
    });

    it("rejects empty or invalid items list", async () => {
      await expect(
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [],
        })
      ).rejects.toThrow(/item/i);

      await expect(
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testProduct1Id, quantity: 0 }],
        })
      ).rejects.toThrow(/quantity/i);

      await expect(
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testProduct1Id, quantity: -2 }],
        })
      ).rejects.toThrow(/quantity/i);
    });

    it("rejects non-existent product or inactive product", async () => {
      await expect(
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: "non-existent-uuid", quantity: 1 }],
        })
      ).rejects.toThrow(/not found/i);

      await seedStock(testInactiveProductId, ["SECRET-INACTIVE"]);
      await expect(
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testInactiveProductId, quantity: 1 }],
        })
      ).rejects.toThrow(/inactive|not available/i);
    });

    it("calculates real totalAmount using DB prices and creates order with VietQR", async () => {
      await seedStock(testProduct1Id, ["KEY-1", "KEY-2"]);
      await seedStock(testProduct2Id, ["ACC-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [
          { productId: testProduct1Id, quantity: 2 },
          { productId: testProduct2Id, quantity: 1 },
        ],
      });

      // Price calculation: 2 * 100,000 + 1 * 250,000 = 450,000
      expect(order.totalAmount).toBe(450000);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.orderCode).toMatch(/^ORD\d{6}$/);
      expect(order.vietQrUrl).toContain("https://img.vietqr.io/image/");
      expect(order.vietQrUrl).toContain("450000");
      expect(order.vietQrUrl).toContain(order.orderCode);

      // Verify expiration is roughly 10 minutes in the future (Phase 3B)
      const diffMs = order.expiresAt.getTime() - Date.now();
      expect(diffMs).toBeGreaterThan(9 * 60 * 1000);
      expect(diffMs).toBeLessThanOrEqual(10 * 60 * 1000 + 5000);

      // Verify items are reserved in DB
      const reservedItems = await prisma.productItem.findMany({
        where: { orderId: order.id },
      });
      expect(reservedItems.length).toBe(3);
      expect(reservedItems.every((item) => item.status === ItemStatus.RESERVED)).toBe(true);
    });

    it("rolls back cleanly when stock is insufficient", async () => {
      // Only 1 item in stock
      await seedStock(testProduct1Id, ["KEY-ONLY-ONE"]);

      // Request 2 items
      await expect(
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testProduct1Id, quantity: 2 }],
        })
      ).rejects.toThrow(/stock/i);

      // Verify NO order created
      const orders = await prisma.order.findMany({
        where: { customerEmail: TEST_CUSTOMER_EMAIL },
      });
      expect(orders.length).toBe(0);

      // Verify stock remained available and not reserved
      const stock = await prisma.productItem.findMany({
        where: { productId: testProduct1Id },
      });
      expect(stock.length).toBe(1);
      expect(stock[0].status).toBe(ItemStatus.AVAILABLE);
      expect(stock[0].orderId).toBeNull();
    });
  });

  describe("checkAndExpireOrder", () => {
    it("expires pending orders that passed expiration time and releases reserved items", async () => {
      await seedStock(testProduct1Id, ["EXP-KEY-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProduct1Id, quantity: 1 }],
      });

      // Manually set expiration to past
      await prisma.order.update({
        where: { id: order.id },
        data: { expiresAt: new Date(Date.now() - 10000) },
      });
      await prisma.productItem.updateMany({
        where: { orderId: order.id },
        data: { reservedUntil: new Date(Date.now() - 10000) },
      });

      const updated = await checkAndExpireOrder(order.orderCode);
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe(OrderStatus.EXPIRED);

      // Verify item returned to AVAILABLE
      const item = await prisma.productItem.findFirst({
        where: { secretContent: "EXP-KEY-1" },
      });
      expect(item?.status).toBe(ItemStatus.AVAILABLE);
      expect(item?.orderId).toBeNull();
    });

    it("does not expire pending orders still within expiration window", async () => {
      await seedStock(testProduct1Id, ["VALID-KEY-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProduct1Id, quantity: 1 }],
      });

      const res = await checkAndExpireOrder(order.orderCode);
      expect(res?.status).toBe(OrderStatus.PENDING);

      const item = await prisma.productItem.findFirst({
        where: { orderId: order.id },
      });
      expect(item?.status).toBe(ItemStatus.RESERVED);
    });

    it("does not expire already PAID orders", async () => {
      await seedStock(testProduct1Id, ["PAID-KEY-1"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProduct1Id, quantity: 1 }],
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          expiresAt: new Date(Date.now() - 60000),
        },
      });

      const res = await checkAndExpireOrder(order.orderCode);
      expect(res?.status).toBe(OrderStatus.PAID);
    });
  });

  describe("getOrderDetails", () => {
    it("returns null for non-existent order code", async () => {
      const details = await getOrderDetails("ORD999999");
      expect(details).toBeNull();
    });

    it("does not expose secretContent for PENDING orders", async () => {
      await seedStock(testProduct1Id, ["TOP-SECRET-KEY"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProduct1Id, quantity: 1 }],
      });

      const details = await getOrderDetails(order.orderCode);
      expect(details).not.toBeNull();
      expect(details?.status).toBe(OrderStatus.PENDING);
      expect(details?.vietQrUrl).toBeDefined();
      expect(details?.expiresInSeconds).toBeGreaterThan(0);
      expect(details?.deliveredItems).toEqual([]);

      // Strict check: secretContent must not appear in any serialized JSON
      const json = JSON.stringify(details);
      expect(json).not.toContain("TOP-SECRET-KEY");
    });

    it("automatically expires order and returns EXPIRED if queried after expiresAt", async () => {
      await seedStock(testProduct1Id, ["AUTO-EXP-KEY"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProduct1Id, quantity: 1 }],
      });

      // Backdate expiration
      await prisma.order.update({
        where: { id: order.id },
        data: { expiresAt: new Date(Date.now() - 5000) },
      });
      await prisma.productItem.updateMany({
        where: { orderId: order.id },
        data: { reservedUntil: new Date(Date.now() - 5000) },
      });

      const details = await getOrderDetails(order.orderCode);
      expect(details?.status).toBe(OrderStatus.EXPIRED);

      // Verify stock was released
      const item = await prisma.productItem.findFirst({
        where: { secretContent: "AUTO-EXP-KEY" },
      });
      expect(item?.status).toBe(ItemStatus.AVAILABLE);
      expect(item?.orderId).toBeNull();
    });

    it("returns deliveredItems with secretContent for PAID orders", async () => {
      await seedStock(testProduct1Id, ["SUPER-PAID-KEY-123"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testProduct1Id, quantity: 1 }],
      });

      await prisma.productItem.updateMany({
        where: { orderId: order.id },
        data: { status: ItemStatus.SOLD },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      const details = await getOrderDetails(order.orderCode);
      expect(details?.status).toBe(OrderStatus.PAID);
      expect(details?.paidAt).toBeDefined();
      expect(details?.deliveredItems?.length).toBe(1);
      expect(details?.deliveredItems?.[0].secretContent).toBe("SUPER-PAID-KEY-123");
    });
  });

  describe("API Routes", () => {
    describe("POST /api/orders", () => {
      it("returns 400 for invalid payload", async () => {
        const req = new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: "bad-email",
            items: [],
          }),
        });

        const res = await createOrderRoute(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeDefined();
      });

      it("returns 400 when stock is insufficient", async () => {
        const req = new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: TEST_CUSTOMER_EMAIL,
            items: [{ productId: testProduct1Id, quantity: 10 }],
          }),
        });

        const res = await createOrderRoute(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toMatch(/insufficient|stock/i);
      });

      it("returns 201 with order details and vietQrUrl on successful creation", async () => {
        await seedStock(testProduct1Id, ["API-KEY-1"]);

        const req = new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: TEST_CUSTOMER_EMAIL,
            items: [{ productId: testProduct1Id, quantity: 1 }],
          }),
        });

        const res = await createOrderRoute(req);
        expect(res.status).toBe(201);
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.order).toBeDefined();
        expect(data.order.orderCode).toMatch(/^ORD\d{6}$/);
        expect(data.order.totalAmount).toBe(100000);
        expect(data.order.vietQrUrl).toContain("https://img.vietqr.io/image/");
        expect(data.order.expiresAt).toBeDefined();
      });
    });

    describe("GET /api/orders/[orderCode]/status", () => {
      it("returns 404 for unknown order code", async () => {
        const req = new Request("http://localhost:3000/api/orders/ORD999999/status");
        const res = await getOrderStatusRoute(req, {
          params: { orderCode: "ORD999999" },
        });

        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toBeDefined();
      });

      it("returns status, vietQrUrl, and empty deliveredItems for PENDING order", async () => {
        await seedStock(testProduct1Id, ["API-PENDING-KEY"]);

        const order = await createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testProduct1Id, quantity: 1 }],
        });

        const req = new Request(
          `http://localhost:3000/api/orders/${order.orderCode}/status`
        );
        const res = await getOrderStatusRoute(req, {
          params: { orderCode: order.orderCode },
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe(OrderStatus.PENDING);
        expect(data.paidAt).toBeNull();
        expect(data.deliveredItems).toEqual([]);
        expect(data.vietQrUrl).toBeDefined();
        expect(data.expiresAt).toBeDefined();

        // Ensure no secret content leaked
        expect(JSON.stringify(data)).not.toContain("API-PENDING-KEY");
      });

      it("returns deliveredItems with secretContent when order is PAID", async () => {
        await seedStock(testProduct1Id, ["API-DELIVERED-KEY-XYZ"]);

        const order = await createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testProduct1Id, quantity: 1 }],
        });

        await prisma.productItem.updateMany({
          where: { orderId: order.id },
          data: { status: ItemStatus.SOLD },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: new Date(),
          },
        });

        const req = new Request(
          `http://localhost:3000/api/orders/${order.orderCode}/status?token=${order.accessToken}`
        );
        const res = await getOrderStatusRoute(req, {
          params: { orderCode: order.orderCode },
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe(OrderStatus.PAID);
        expect(data.paidAt).toBeDefined();
        expect(data.deliveredItems.length).toBe(1);
        expect(data.deliveredItems[0].secretContent).toBe("API-DELIVERED-KEY-XYZ");
      });
    });
  });
});
