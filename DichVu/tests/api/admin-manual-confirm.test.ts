import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, OrderStatus, ItemStatus } from "@/lib/prisma";
import { POST } from "@/app/api/admin/orders/[orderId]/manual-confirm/route";
import { NextRequest } from "next/server";

describe("Admin Manual Order Confirmation API", () => {
  const TEST_CAT_SLUG = "test-manual-confirm-cat";
  const TEST_PROD_SLUG = "test-manual-confirm-prod";

  let productId: string;
  let categoryId: string;
  let pendingOrderId: string;
  let paidOrderId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    // 1. Cleanup old test data
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
        name: "Test Manual Confirm Category",
        slug: TEST_CAT_SLUG,
      },
    });
    categoryId = cat.id;

    const prod = await prisma.product.create({
      data: {
        title: "Test Manual Confirm Product",
        slug: TEST_PROD_SLUG,
        description: "Test description for product",
        price: 50000,
        categoryId: cat.id,
        fulfillmentType: "LOCAL_STOCK",
      },
    });
    productId = prod.id;

    // Add 2 inventory items
    await prisma.productItem.createMany({
      data: [
        { productId: prod.id, secretContent: "KEY_MANUAL_1", status: ItemStatus.AVAILABLE },
        { productId: prod.id, secretContent: "KEY_MANUAL_2", status: ItemStatus.AVAILABLE },
      ],
    });

    // 3. Create Pending Order
    const pOrder = await prisma.order.create({
      data: {
        orderCode: "ORDMANUALCONFIRM01",
        customerEmail: "test-manual-pending@example.com",
        totalAmount: 50000,
        status: OrderStatus.PENDING,
        paymentMethod: "VIETQR",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        orderItems: {
          create: [{ productId: prod.id, price: 50000, quantity: 1 }],
        },
      },
    });
    pendingOrderId = pOrder.id;
    createdOrderIds.push(pOrder.id);

    // 4. Create Already Paid Order
    const aOrder = await prisma.order.create({
      data: {
        orderCode: "ORDMANUALCONFIRM02",
        customerEmail: "test-manual-paid@example.com",
        totalAmount: 50000,
        status: OrderStatus.PAID,
        paidAt: new Date(),
        paymentMethod: "VIETQR",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        orderItems: {
          create: [{ productId: prod.id, price: 50000, quantity: 1 }],
        },
      },
    });
    paidOrderId = aOrder.id;
    createdOrderIds.push(aOrder.id);
  });

  afterAll(async () => {
    await prisma.paymentTransaction.deleteMany({
      where: { orderId: { in: createdOrderIds } },
    });
    await prisma.productItem.deleteMany({
      where: { productId },
    });
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: createdOrderIds } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: createdOrderIds } },
    });
    await prisma.product.deleteMany({
      where: { id: productId },
    });
    await prisma.category.deleteMany({
      where: { id: categoryId },
    });
    await prisma.auditLog.deleteMany({
      where: { entityId: { in: createdOrderIds } },
    });
  });

  it("returns 404 when orderId does not exist", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/orders/fake-id/manual-confirm", {
      method: "POST",
      body: JSON.stringify({ note: "Test note" }),
    });

    const res = await POST(req, { params: { orderId: "non-existent-order-id" } });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when order is already in PAID status", async () => {
    const req = new NextRequest(`http://localhost:3000/api/admin/orders/${paidOrderId}/manual-confirm`, {
      method: "POST",
      body: JSON.stringify({ note: "Already paid" }),
    });

    const res = await POST(req, { params: { orderId: paidOrderId } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("đã được xác nhận thanh toán");
  });

  it("successfully confirms a PENDING order, sets PAID, creates transaction and delivers key", async () => {
    const req = new NextRequest(`http://localhost:3000/api/admin/orders/${pendingOrderId}/manual-confirm`, {
      method: "POST",
      body: JSON.stringify({ note: "Xác nhận chuyển khoản Techcombank ngoài" }),
    });

    const res = await POST(req, { params: { orderId: pendingOrderId } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify order in database
    const updatedOrder = await prisma.order.findUnique({
      where: { id: pendingOrderId },
      include: {
        transactions: true,
        deliveredItems: true,
      },
    });

    expect(updatedOrder).toBeDefined();
    expect(updatedOrder?.status).toBe(OrderStatus.PAID);
    expect(updatedOrder?.paidAt).toBeDefined();
    expect(updatedOrder?.reconciliationStatus).toBe("MANUAL_RESOLVED");
    expect(updatedOrder?.reconciliationNote).toContain("Techcombank");

    // Verify transaction was created
    expect(updatedOrder?.transactions.length).toBeGreaterThan(0);
    expect(updatedOrder?.transactions[0].bankCode).toBe("MANUAL_CONFIRM");
    expect(updatedOrder?.transactions[0].amount).toBe(50000);

    // Verify key was committed to SOLD
    expect(updatedOrder?.deliveredItems.length).toBe(1);
    expect(updatedOrder?.deliveredItems[0].status).toBe(ItemStatus.SOLD);
  });
});
