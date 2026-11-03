import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getProductCatalog,
  updateProductPrice,
  toggleProductActive,
  getRevenueReport,
  lookupOrder,
} from "@/services/telegram-assistant/assistant-actions";
import {
  notifyOrderPaid,
  notifyFulfillmentSuccess,
  notifyFulfillmentFailure,
} from "@/services/telegram-assistant/notification-dispatcher";

describe("Telegram Assistant Actions & Dispatcher", () => {
  const TEST_SLUG = "tele-assistant-test-prod";
  let testProductId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.product.deleteMany({
      where: { slug: TEST_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: "tele-test-cat" },
    });

    const category = await prisma.category.create({
      data: { name: "Tele Test Cat", slug: "tele-test-cat" },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Sản phẩm Test Assistant",
        slug: TEST_SLUG,
        description: "Test description",
        price: 50000,
        originalPrice: 70000,
        categoryId: testCategoryId,
        isActive: true,
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({
      where: { slug: TEST_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: "tele-test-cat" },
    });
  });

  it("should get product catalog matching query", async () => {
    const list = await getProductCatalog({ search: TEST_SLUG });
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].slug).toBe(TEST_SLUG);
    expect(list[0].price).toBe(50000);
  });

  it("should update product price and disable auto sync", async () => {
    const res = await updateProductPrice(TEST_SLUG, 65000, 45000);
    expect(res.success).toBe(true);
    expect(res.product.price).toBe(65000);

    const refreshed = await prisma.product.findUnique({
      where: { id: testProductId },
    });
    expect(refreshed?.price).toBe(65000);
  });

  it("should toggle product active status", async () => {
    const toggleOff = await toggleProductActive(TEST_SLUG, false);
    expect(toggleOff.success).toBe(true);
    expect(toggleOff.product.isActive).toBe(false);

    const toggleOn = await toggleProductActive(TEST_SLUG, true);
    expect(toggleOn.success).toBe(true);
    expect(toggleOn.product.isActive).toBe(true);
  });

  it("should get revenue report without error", async () => {
    const rep = await getRevenueReport("today");
    expect(rep).toBeDefined();
    expect(typeof rep.totalRevenue).toBe("number");
    expect(Array.isArray(rep.paidOrders)).toBe(true);
  });

  it("should safely format notifications even if fetch fails or network is offline", async () => {
    // Should not throw
    const paidResult = await notifyOrderPaid({
      orderCode: "ORDTEST123",
      totalAmount: 99000,
      customerEmail: "customer@example.com",
      items: [{ title: "Test Item", quantity: 1 }],
    });
    expect(typeof paidResult).toBe("boolean");

    const successResult = await notifyFulfillmentSuccess("ORDTEST123", "1 key delivered");
    expect(typeof successResult).toBe("boolean");

    const failResult = await notifyFulfillmentFailure("ORDTEST123", "Test Item", "Out of stock");
    expect(typeof failResult).toBe("boolean");
  });
});
