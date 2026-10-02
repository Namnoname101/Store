import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ItemStatus, OrderStatus } from "@/lib/prisma";
import {
  getAdminOverviewStats,
  getAllProductsAdmin,
  getAllOrdersAdmin,
} from "@/services/admin.service";

describe("Admin Service", () => {
  const TEST_CAT_SLUG = "test-admin-category";
  const TEST_PROD_LOW_SLUG = "test-admin-prod-low";
  const TEST_PROD_HIGH_SLUG = "test-admin-prod-high";

  let categoryId: string;
  let prodLowId: string;
  let prodHighId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    // 1. Clean up residual test data
    await prisma.productItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_PROD_LOW_SLUG, TEST_PROD_HIGH_SLUG] } },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_PROD_LOW_SLUG, TEST_PROD_HIGH_SLUG] } },
      },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_PROD_LOW_SLUG, TEST_PROD_HIGH_SLUG] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { order: { customerEmail: { contains: "test-admin" } } },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: { contains: "test-admin" } },
    });

    // 2. Create category
    const cat = await prisma.category.create({
      data: {
        name: "Test Admin Category",
        slug: TEST_CAT_SLUG,
        description: "Admin test category",
      },
    });
    categoryId = cat.id;

    // 3. Create products: one with low stock (2 items), one with high stock (8 items)
    const prodLow = await prisma.product.create({
      data: {
        title: "Test Low Stock Product",
        slug: TEST_PROD_LOW_SLUG,
        description: "Product with 2 items",
        price: 50000,
        categoryId,
        type: "LICENSE_KEY",
      },
    });
    prodLowId = prodLow.id;

    const prodHigh = await prisma.product.create({
      data: {
        title: "Test High Stock Product",
        slug: TEST_PROD_HIGH_SLUG,
        description: "Product with 8 items",
        price: 100000,
        categoryId,
        type: "ACCOUNT",
      },
    });
    prodHighId = prodHigh.id;

    // Insert items for prodLow: 2 AVAILABLE, 1 SOLD
    await prisma.productItem.createMany({
      data: [
        { productId: prodLowId, secretContent: "LOW-1", status: ItemStatus.AVAILABLE },
        { productId: prodLowId, secretContent: "LOW-2", status: ItemStatus.AVAILABLE },
        { productId: prodLowId, secretContent: "LOW-3", status: ItemStatus.SOLD },
      ],
    });

    // Insert items for prodHigh: 8 AVAILABLE, 2 RESERVED, 3 SOLD
    await prisma.productItem.createMany({
      data: [
        ...Array.from({ length: 8 }).map((_, i) => ({
          productId: prodHighId,
          secretContent: `HIGH-AVAIL-${i + 1}`,
          status: ItemStatus.AVAILABLE,
        })),
        { productId: prodHighId, secretContent: "HIGH-RES-1", status: ItemStatus.RESERVED },
        { productId: prodHighId, secretContent: "HIGH-RES-2", status: ItemStatus.RESERVED },
        { productId: prodHighId, secretContent: "HIGH-SOLD-1", status: ItemStatus.SOLD },
      ],
    });

    // 4. Create orders for admin testing
    // Order 1: PAID, 200,000 VND
    const orderPaid1 = await prisma.order.create({
      data: {
        orderCode: "ORDTESTADM01",
        customerEmail: "test-admin-paid1@example.com",
        totalAmount: 200000,
        status: OrderStatus.PAID,
        paymentMethod: "VIETQR",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        paidAt: new Date(),
        orderItems: {
          create: [{ productId: prodLowId, price: 50000, quantity: 1 }],
        },
        transactions: {
          create: [{ transactionId: "ADM_TX_001", amount: 200000, bankCode: "MB" }],
        },
      },
    });
    createdOrderIds.push(orderPaid1.id);

    // Order 2: PAID, 150,000 VND
    const orderPaid2 = await prisma.order.create({
      data: {
        orderCode: "ORDTESTADM02",
        customerEmail: "test-admin-paid2@example.com",
        totalAmount: 150000,
        status: OrderStatus.PAID,
        paymentMethod: "VIETQR",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        paidAt: new Date(),
        orderItems: {
          create: [{ productId: prodHighId, price: 100000, quantity: 1 }],
        },
        transactions: {
          create: [{ transactionId: "ADM_TX_002", amount: 150000, bankCode: "VCB" }],
        },
      },
    });
    createdOrderIds.push(orderPaid2.id);

    // Order 3: PENDING, 300,000 VND
    const orderPending = await prisma.order.create({
      data: {
        orderCode: "ORDTESTADM03",
        customerEmail: "test-admin-pending@example.com",
        totalAmount: 300000,
        status: OrderStatus.PENDING,
        paymentMethod: "VIETQR",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        orderItems: {
          create: [{ productId: prodHighId, price: 100000, quantity: 2 }],
        },
      },
    });
    createdOrderIds.push(orderPending.id);

    // Order 4: EXPIRED, 100,000 VND
    const orderExpired = await prisma.order.create({
      data: {
        orderCode: "ORDTESTADM04",
        customerEmail: "test-admin-expired@example.com",
        totalAmount: 100000,
        status: OrderStatus.EXPIRED,
        paymentMethod: "VIETQR",
        expiresAt: new Date(Date.now() - 15 * 60 * 1000),
      },
    });
    createdOrderIds.push(orderExpired.id);
  });

  afterAll(async () => {
    await prisma.productItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_PROD_LOW_SLUG, TEST_PROD_HIGH_SLUG] } },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_PROD_LOW_SLUG, TEST_PROD_HIGH_SLUG] } },
      },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_PROD_LOW_SLUG, TEST_PROD_HIGH_SLUG] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
    await prisma.paymentTransaction.deleteMany({
      where: { orderId: { in: createdOrderIds } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: createdOrderIds } },
    });
  });

  describe("getAdminOverviewStats", () => {
    it("aggregates total revenue from PAID orders only and counts orders properly", async () => {
      const stats = await getAdminOverviewStats();

      // Total revenue must at least include our 2 test orders: 200,000 + 150,000 = 350,000
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(350000);
      expect(stats.paidOrders).toBeGreaterThanOrEqual(2);
      expect(stats.pendingOrders).toBeGreaterThanOrEqual(1);
      expect(stats.totalOrders).toBeGreaterThanOrEqual(4);
      expect(stats.lowStockProductsCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(stats.recentOrders)).toBe(true);
    });
  });

  describe("getAllProductsAdmin", () => {
    it("returns products with category information and accurate stock breakdown", async () => {
      const products = await getAllProductsAdmin();
      expect(Array.isArray(products)).toBe(true);

      const lowProd = products.find((p) => p.slug === TEST_PROD_LOW_SLUG);
      expect(lowProd).toBeDefined();
      expect(lowProd?.category?.slug).toBe(TEST_CAT_SLUG);
      expect(lowProd?.availableStock).toBe(2);
      expect(lowProd?.soldStock).toBe(1);
      expect(lowProd?.reservedStock).toBe(0);
      expect(lowProd?.totalStock).toBe(3);

      const highProd = products.find((p) => p.slug === TEST_PROD_HIGH_SLUG);
      expect(highProd).toBeDefined();
      expect(highProd?.availableStock).toBe(8);
      expect(highProd?.reservedStock).toBe(2);
      expect(highProd?.soldStock).toBe(1);
      expect(highProd?.totalStock).toBe(11);
    });
  });

  describe("getAllOrdersAdmin", () => {
    it("returns all orders when no status filter is provided", async () => {
      const orders = await getAllOrdersAdmin();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThanOrEqual(4);

      const testPaidOrder = orders.find((o) => o.orderCode === "ORDTESTADM01");
      expect(testPaidOrder).toBeDefined();
      expect(testPaidOrder?.orderItems.length).toBeGreaterThanOrEqual(1);
      expect(testPaidOrder?.transactions.length).toBeGreaterThanOrEqual(1);
    });

    it("filters orders by specific status correctly", async () => {
      const paidOrders = await getAllOrdersAdmin(OrderStatus.PAID);
      expect(paidOrders.every((o) => o.status === OrderStatus.PAID)).toBe(true);
      expect(paidOrders.some((o) => o.orderCode === "ORDTESTADM01")).toBe(true);
      expect(paidOrders.some((o) => o.orderCode === "ORDTESTADM03")).toBe(false);

      const pendingOrders = await getAllOrdersAdmin(OrderStatus.PENDING);
      expect(pendingOrders.every((o) => o.status === OrderStatus.PENDING)).toBe(true);
      expect(pendingOrders.some((o) => o.orderCode === "ORDTESTADM03")).toBe(true);
    });
  });
});
