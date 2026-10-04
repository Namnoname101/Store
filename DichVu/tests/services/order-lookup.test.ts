import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, OrderStatus } from "@/lib/prisma";
import { lookupOrders } from "@/services/order.service";
import { GET as lookupOrdersRoute } from "@/app/api/orders/lookup/route";
import { NextRequest } from "next/server";

describe("Order Lookup Service & API Route", () => {
  const TEST_EMAIL = "lookup-customer@example.com";
  const TEST_PRODUCT_SLUG = "lookup-test-product";
  let testProductId: string;
  let testCategoryId: string;
  let orderCode1: string;
  let orderCode2: string;

  beforeAll(async () => {
    // Clean up
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_EMAIL },
    });
    await prisma.category.deleteMany({
      where: { slug: "lookup-test-cat" },
    });

    const category = await prisma.category.create({
      data: { name: "Lookup Cat", slug: "lookup-test-cat" },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Sản Phẩm Tra Cứu Test",
        slug: TEST_PRODUCT_SLUG,
        description: "Test description",
        price: 50000,
        categoryId: testCategoryId,
      },
    });
    testProductId = product.id;

    // Create 2 orders for this customer
    const order1 = await prisma.order.create({
      data: {
        orderCode: "ORD998811",
        customerEmail: TEST_EMAIL,
        totalAmount: 50000,
        status: OrderStatus.PAID,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        orderItems: {
          create: [{ productId: testProductId, price: 50000, quantity: 1 }],
        },
      },
    });
    orderCode1 = order1.orderCode;

    const order2 = await prisma.order.create({
      data: {
        orderCode: "ORD998822",
        customerEmail: TEST_EMAIL,
        totalAmount: 100000,
        status: OrderStatus.PENDING,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        orderItems: {
          create: [{ productId: testProductId, price: 50000, quantity: 2 }],
        },
      },
    });
    orderCode2 = order2.orderCode;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PRODUCT_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_EMAIL },
    });
    await prisma.category.deleteMany({
      where: { slug: "lookup-test-cat" },
    });
  });

  it("should lookup orders by exact orderCode (case-insensitive)", async () => {
    const results = await lookupOrders("ord998811");
    expect(results.length).toBe(1);
    expect(results[0].orderCode).toBe("ORD998811");
    expect(results[0].status).toBe(OrderStatus.PAID);
    expect(results[0].totalAmount).toBe(50000);
    expect(results[0].items.length).toBe(1);
    expect(results[0].items[0].productTitle).toBe("Sản Phẩm Tra Cứu Test");
  });

  it("should lookup all orders by customer email", async () => {
    const results = await lookupOrders(TEST_EMAIL.toUpperCase());
    expect(results.length).toBe(2);
    const codes = results.map((o) => o.orderCode);
    expect(codes).toContain(orderCode1);
    expect(codes).toContain(orderCode2);
  });

  it("should return empty array for non-existent orderCode or email", async () => {
    const results = await lookupOrders("ORD000000");
    expect(results).toEqual([]);
  });

  it("should handle lookup via GET /api/orders/lookup?q=...", async () => {
    const req = new NextRequest(`http://localhost:3000/api/orders/lookup?q=${encodeURIComponent(orderCode1)}`);
    const res = await lookupOrdersRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.orders.length).toBe(1);
    expect(data.orders[0].orderCode).toBe(orderCode1);
  });
});
