import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, OrderStatus, ItemStatus, UpstreamStatus } from "@/lib/prisma";
import { POST } from "@/app/api/admin/orders/[orderId]/manual-fulfill/route";
import { NextRequest } from "next/server";

describe("Admin Manual Order Fulfillment API", () => {
  const TEST_CAT_SLUG = "test-manual-fulfill-cat";
  const TEST_PROD_SLUG = "test-manual-fulfill-prod";

  let productId: string;
  let categoryId: string;
  let testOrderId: string;
  let testOrderCode: string;

  beforeAll(async () => {
    // 1. Cleanup
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

    // 2. Create Category and Product
    const cat = await prisma.category.create({
      data: {
        name: "Test Manual Fulfill Cat",
        slug: TEST_CAT_SLUG,
      },
    });
    categoryId = cat.id;

    const prod = await prisma.product.create({
      data: {
        title: "Test Manual Fulfill Product",
        slug: TEST_PROD_SLUG,
        description: "Test description",
        price: 99000,
        categoryId: cat.id,
        fulfillmentType: "API_DROPSHIP",
      },
    });
    productId = prod.id;

    // 3. Create Paid Order with UpstreamStatus FAILED
    testOrderCode = `ORD_MF_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderCode: testOrderCode,
        totalAmount: 99000,
        status: OrderStatus.PAID,
        upstreamStatus: UpstreamStatus.FAILED,
        upstreamError: "Cần Chủ sở hữu xử lý: Số dư không đủ",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        orderItems: {
          create: {
            productId: prod.id,
            quantity: 2,
            price: 99000,
          },
        },
      },
    });
    testOrderId = order.id;
  });

  afterAll(async () => {
    await prisma.productItem.deleteMany({
      where: { orderId: testOrderId },
    });
    await prisma.orderItem.deleteMany({
      where: { orderId: testOrderId },
    });
    await prisma.order.deleteMany({
      where: { id: testOrderId },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  it("should reject with 404 if order does not exist", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/orders/fake-id/manual-fulfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secrets: ["KEY_123"] }),
    });

    const res = await POST(req, { params: { orderId: "fake-id" } });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("should reject with 400 if no secrets are provided", async () => {
    const req = new NextRequest(`http://localhost:3000/api/admin/orders/${testOrderId}/manual-fulfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secrets: "" }),
    });

    const res = await POST(req, { params: { orderId: testOrderId } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("should successfully fulfill order manually with multiple keys and mark order COMPLETED", async () => {
    const req = new NextRequest(`http://localhost:3000/api/admin/orders/${testOrderId}/manual-fulfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secrets: "user1@example.com|pass123\nuser2@example.com|pass456",
        note: "Đã tạo tài khoản tay do nguồn hết tiền",
      }),
    });

    const res = await POST(req, { params: { orderId: testOrderId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.itemsDelivered).toBe(2);

    // Verify database state
    const orderInDb = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { deliveredItems: true },
    });

    expect(orderInDb?.status).toBe(OrderStatus.PAID);
    expect(orderInDb?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
    expect(orderInDb?.upstreamError).toBeNull();
    expect(orderInDb?.deliveredItems.length).toBe(2);
    expect(orderInDb?.deliveredItems[0].secretContent).toBe("user1@example.com|pass123");
    expect(orderInDb?.deliveredItems[0].status).toBe(ItemStatus.SOLD);
    expect(orderInDb?.deliveredItems[1].secretContent).toBe("user2@example.com|pass456");
  });
});
