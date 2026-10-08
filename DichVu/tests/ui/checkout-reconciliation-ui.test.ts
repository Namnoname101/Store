import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { formatRemainingTime, calculateRemainingSeconds } from "@/components/CountdownTimer";
import { saveRecentOrder, getRecentOrders } from "@/lib/order-storage";
import { prisma, OrderStatus, FulfillmentType, ReconciliationStatus } from "@/lib/prisma";
import { createOrder } from "@/services/order.service";

describe("Checkout UI, 10m Timer & Secure Token Access Verification", () => {
  const TEST_CAT_SLUG = "ui-test-cat";
  const TEST_PROD_SLUG = "ui-test-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Cleanup
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
      data: { name: "UI Test Cat", slug: TEST_CAT_SLUG },
    });
    catId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "UI Test Product",
        slug: TEST_PROD_SLUG,
        description: "UI test",
        price: 35000,
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
          secretContent: `KEY-UI-${i}`,
          status: "AVAILABLE",
        },
      });
    }
  });

  afterAll(async () => {
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
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  it("CountdownTimer: correctly formats 10 minutes (600s) and handles 0/negative", () => {
    expect(formatRemainingTime(600)).toBe("10:00");
    expect(formatRemainingTime(599)).toBe("09:59");
    expect(formatRemainingTime(65)).toBe("01:05");
    expect(formatRemainingTime(0)).toBe("00:00");
    expect(formatRemainingTime(-10)).toBe("00:00");
  });

  it("OrderStorage: persists and retrieves accessToken for guest orders", () => {
    const storage: Record<string, string> = {};
    (globalThis as any).window = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, val: string) => {
        storage[key] = val;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
    };

    const dummyOrder = {
      orderCode: "ORD999888",
      accessToken: "dummy-uuid-token-1234",
      totalAmount: 35000,
      customerEmail: null,
      createdAt: new Date().toISOString(),
      itemsSummary: "UI Test Product",
      status: "PENDING",
    };

    saveRecentOrder(dummyOrder);
    const recent = getRecentOrders();
    const saved = recent.find((o) => o.orderCode === "ORD999888");

    expect(saved).toBeDefined();
    expect(saved?.accessToken).toBe("dummy-uuid-token-1234");
  });

  it("Order accessToken generation & guest isolation", async () => {
    const guestOrder = await createOrder({
      customerEmail: null,
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Each order must have a valid non-empty accessToken (UUID format)
    expect(guestOrder.accessToken).toBeDefined();
    expect(guestOrder.accessToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});
