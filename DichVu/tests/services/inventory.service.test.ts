import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma, ItemStatus } from "@/lib/prisma";
import {
  reserveItemsForOrder,
  releaseExpiredReservations,
  commitReservedItemsToSold,
  getAvailableStockCount,
} from "@/services/inventory.service";

describe("Inventory Service", () => {
  const TEST_CATEGORY_SLUG = "test-inv-category";
  const TEST_PRODUCT_SLUG = "test-inv-product";
  let testCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Clean up any residual test data
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: "test-inventory@example.com" },
    });

    // Create test category and product
    const category = await prisma.category.create({
      data: {
        name: "Test Inventory Category",
        slug: TEST_CATEGORY_SLUG,
        description: "Category for inventory testing",
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Test Windows 11 Pro Key",
        slug: TEST_PRODUCT_SLUG,
        description: "Windows 11 Pro test license key",
        price: 150000,
        categoryId: testCategoryId,
        type: "LICENSE_KEY",
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: "test-inventory@example.com" },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear items and test orders before each test
    await prisma.productItem.deleteMany({
      where: { productId: testProductId },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: "test-inventory@example.com" },
    });
  });

  async function createTestOrder(codeSuffix: string) {
    return prisma.order.create({
      data: {
        orderCode: `ORD_TEST_${Date.now()}_${codeSuffix}`,
        customerEmail: "test-inventory@example.com",
        totalAmount: 150000,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  }

  describe("getAvailableStockCount", () => {
    it("returns 0 when no items exist", async () => {
      const count = await getAvailableStockCount(testProductId);
      expect(count).toBe(0);
    });

    it("counts only AVAILABLE items, ignoring RESERVED and SOLD", async () => {
      const order = await createTestOrder("stock_count");

      await prisma.productItem.createMany({
        data: [
          { productId: testProductId, secretContent: "KEY_1", status: ItemStatus.AVAILABLE },
          { productId: testProductId, secretContent: "KEY_2", status: ItemStatus.AVAILABLE },
          {
            productId: testProductId,
            secretContent: "KEY_3",
            status: ItemStatus.RESERVED,
            orderId: order.id,
            reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
          },
          {
            productId: testProductId,
            secretContent: "KEY_4",
            status: ItemStatus.SOLD,
            orderId: order.id,
          },
        ],
      });

      const count = await getAvailableStockCount(testProductId);
      expect(count).toBe(2);
    });
  });

  describe("reserveItemsForOrder", () => {
    it("successfully reserves available items with orderId and expiration", async () => {
      const order = await createTestOrder("reserve_success");

      await prisma.productItem.createMany({
        data: [
          { productId: testProductId, secretContent: "KEY_A", status: ItemStatus.AVAILABLE },
          { productId: testProductId, secretContent: "KEY_B", status: ItemStatus.AVAILABLE },
          { productId: testProductId, secretContent: "KEY_C", status: ItemStatus.AVAILABLE },
        ],
      });

      const startTime = Date.now();
      const reserved = await reserveItemsForOrder(testProductId, 2, order.id, 15);

      expect(reserved).toHaveLength(2);
      for (const item of reserved) {
        expect(item.status).toBe(ItemStatus.RESERVED);
        expect(item.orderId).toBe(order.id);
        expect(item.reservedUntil).not.toBeNull();

        const reservedUntilTime = new Date(item.reservedUntil!).getTime();
        const expectedMin = startTime + 14 * 60 * 1000;
        const expectedMax = startTime + 16 * 60 * 1000;
        expect(reservedUntilTime).toBeGreaterThanOrEqual(expectedMin);
        expect(reservedUntilTime).toBeLessThanOrEqual(expectedMax);
      }

      // Remaining stock should now be 1
      const remainingStock = await getAvailableStockCount(testProductId);
      expect(remainingStock).toBe(1);
    });

    it("throws 'Insufficient stock available' error when requesting more than in stock", async () => {
      const order = await createTestOrder("reserve_fail");

      await prisma.productItem.create({
        data: {
          productId: testProductId,
          secretContent: "KEY_ONLY_ONE",
          status: ItemStatus.AVAILABLE,
        },
      });

      await expect(reserveItemsForOrder(testProductId, 2, order.id)).rejects.toThrow(
        "Insufficient stock available"
      );

      // Verify transaction atomicity: the single item should still be AVAILABLE
      const count = await getAvailableStockCount(testProductId);
      expect(count).toBe(1);
    });

    it("throws 'Insufficient stock available' when stock is 0", async () => {
      const order = await createTestOrder("reserve_empty");

      await expect(reserveItemsForOrder(testProductId, 1, order.id)).rejects.toThrow(
        "Insufficient stock available"
      );
    });
  });

  describe("releaseExpiredReservations", () => {
    it("releases expired reservations back to AVAILABLE status and clears orderId/reservedUntil", async () => {
      const order = await createTestOrder("expired_test");

      const expiredTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const activeTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future

      await prisma.productItem.createMany({
        data: [
          // Expired items
          {
            productId: testProductId,
            secretContent: "EXPIRED_KEY_1",
            status: ItemStatus.RESERVED,
            orderId: order.id,
            reservedUntil: expiredTime,
          },
          {
            productId: testProductId,
            secretContent: "EXPIRED_KEY_2",
            status: ItemStatus.RESERVED,
            orderId: order.id,
            reservedUntil: expiredTime,
          },
          // Active reservation (should NOT be released)
          {
            productId: testProductId,
            secretContent: "ACTIVE_KEY",
            status: ItemStatus.RESERVED,
            orderId: order.id,
            reservedUntil: activeTime,
          },
          // Sold item (should NOT be touched)
          {
            productId: testProductId,
            secretContent: "SOLD_KEY",
            status: ItemStatus.SOLD,
            orderId: order.id,
          },
        ],
      });

      const releasedCount = await releaseExpiredReservations();
      expect(releasedCount).toBe(2);

      // Verify expired items are now AVAILABLE with null orderId and reservedUntil
      const availableItems = await prisma.productItem.findMany({
        where: { productId: testProductId, status: ItemStatus.AVAILABLE },
      });
      expect(availableItems).toHaveLength(2);
      for (const item of availableItems) {
        expect(item.orderId).toBeNull();
        expect(item.reservedUntil).toBeNull();
      }

      // Verify active reservation remains RESERVED
      const activeItem = await prisma.productItem.findFirst({
        where: { secretContent: "ACTIVE_KEY" },
      });
      expect(activeItem?.status).toBe(ItemStatus.RESERVED);
      expect(activeItem?.orderId).toBe(order.id);

      // Verify sold item remains SOLD
      const soldItem = await prisma.productItem.findFirst({
        where: { secretContent: "SOLD_KEY" },
      });
      expect(soldItem?.status).toBe(ItemStatus.SOLD);
    });

    it("returns 0 if there are no expired reservations", async () => {
      const releasedCount = await releaseExpiredReservations();
      expect(releasedCount).toBe(0);
    });
  });

  describe("commitReservedItemsToSold", () => {
    it("commits reserved items for order to SOLD and clears reservedUntil", async () => {
      const order = await createTestOrder("commit_sold");

      await prisma.productItem.createMany({
        data: [
          {
            productId: testProductId,
            secretContent: "COMMIT_KEY_1",
            status: ItemStatus.RESERVED,
            orderId: order.id,
            reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
          },
          {
            productId: testProductId,
            secretContent: "COMMIT_KEY_2",
            status: ItemStatus.RESERVED,
            orderId: order.id,
            reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
          },
        ],
      });

      const committed = await commitReservedItemsToSold(order.id);
      expect(committed).toHaveLength(2);

      for (const item of committed) {
        expect(item.status).toBe(ItemStatus.SOLD);
        expect(item.orderId).toBe(order.id);
        expect(item.reservedUntil).toBeNull();
      }

      // Check in database
      const itemsInDb = await prisma.productItem.findMany({
        where: { orderId: order.id },
      });
      expect(itemsInDb).toHaveLength(2);
      expect(itemsInDb.every((i) => i.status === ItemStatus.SOLD)).toBe(true);
    });

    it("returns empty array if order has no reserved items", async () => {
      const result = await commitReservedItemsToSold("non-existent-order-id");
      expect(result).toEqual([]);
    });
  });

  describe("Concurrency & Race Conditions", () => {
    it("ensures only 1 order succeeds when 2 concurrent requests compete for 1 stock item", async () => {
      const order1 = await createTestOrder("concurrent_1");
      const order2 = await createTestOrder("concurrent_2");

      // Exactly 1 item available
      await prisma.productItem.create({
        data: {
          productId: testProductId,
          secretContent: "RARE_KEY",
          status: ItemStatus.AVAILABLE,
        },
      });

      // Attempt to reserve concurrently
      const results = await Promise.allSettled([
        reserveItemsForOrder(testProductId, 1, order1.id),
        reserveItemsForOrder(testProductId, 1, order2.id),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejectedResult = rejected[0] as PromiseRejectedResult;
      expect(rejectedResult.reason.message).toContain("Insufficient stock available");

      // Verify that available stock is now 0
      const availableStock = await getAvailableStockCount(testProductId);
      expect(availableStock).toBe(0);
    });

    it("ensures exactly 2 succeed and 1 fails when 3 requests compete for 2 items", async () => {
      const order1 = await createTestOrder("race_3_1");
      const order2 = await createTestOrder("race_3_2");
      const order3 = await createTestOrder("race_3_3");

      await prisma.productItem.createMany({
        data: [
          { productId: testProductId, secretContent: "STOCK_1", status: ItemStatus.AVAILABLE },
          { productId: testProductId, secretContent: "STOCK_2", status: ItemStatus.AVAILABLE },
        ],
      });

      const results = await Promise.allSettled([
        reserveItemsForOrder(testProductId, 1, order1.id),
        reserveItemsForOrder(testProductId, 1, order2.id),
        reserveItemsForOrder(testProductId, 1, order3.id),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(2);
      expect(rejected).toHaveLength(1);

      const availableStock = await getAvailableStockCount(testProductId);
      expect(availableStock).toBe(0);
    });
  });
});
