import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
} from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import { GET as getOrderStatus } from "@/app/api/orders/[orderCode]/status/route";
import { POST as postRefundRequest } from "@/app/api/orders/[orderCode]/refund-request/route";

describe("Task 5: Guest Order AccessToken Security & 30-Day TTL Guard", () => {
  const TEST_CAT_SLUG = "guest-sec-cat";
  const TEST_PROD_SLUG = "guest-sec-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
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

    const cat = await prisma.category.create({
      data: { name: "Guest Sec Cat", slug: TEST_CAT_SLUG },
    });
    catId = cat.id;

    const prod = await prisma.product.create({
      data: {
        title: "Guest Sec Prod",
        slug: TEST_PROD_SLUG,
        description: "Test guest token security",
        price: 20000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    prodId = prod.id;

    for (let i = 1; i <= 3; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `SECRET-KEY-GUEST-SEC-${i}`,
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

  it("1. GET /api/orders/[orderCode]/status masks deliveredItems when token is missing or invalid", async () => {
    const order = await createOrder({
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Mark PAID and assign secret key
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });
    await prisma.productItem.updateMany({
      where: { orderId: order.id },
      data: { status: ItemStatus.SOLD },
    });

    // Request WITHOUT token
    const reqWithoutToken = new Request(`http://localhost:3000/api/orders/${order.orderCode}/status`);
    const res1 = await getOrderStatus(reqWithoutToken, {
      params: { orderCode: order.orderCode },
    });
    const data1 = await res1.json();

    expect(res1.status).toBe(200);
    // Must mask deliveredItems!
    expect(data1.deliveredItems).toEqual([]);

    // Request WITH invalid token
    const reqInvalidToken = new Request(
      `http://localhost:3000/api/orders/${order.orderCode}/status?token=wrong-token-123`
    );
    const res2 = await getOrderStatus(reqInvalidToken, {
      params: { orderCode: order.orderCode },
    });
    const data2 = await res2.json();
    expect(data2.deliveredItems).toEqual([]);

    // Request WITH valid token
    const reqValidToken = new Request(
      `http://localhost:3000/api/orders/${order.orderCode}/status?token=${order.accessToken}`
    );
    const res3 = await getOrderStatus(reqValidToken, {
      params: { orderCode: order.orderCode },
    });
    const data3 = await res3.json();
    expect(data3.deliveredItems.length).toBeGreaterThan(0);
    expect(data3.deliveredItems[0].secretContent).toContain("SECRET-KEY-GUEST-SEC");
  });

  it("2. GET /api/orders/[orderCode]/status rejects expired token (>30 days)", async () => {
    const order = await createOrder({
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Backdate order to 31 days ago
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: oldDate,
        createdAt: oldDate,
      },
    });

    const req = new Request(
      `http://localhost:3000/api/orders/${order.orderCode}/status?token=${order.accessToken}`
    );
    const res = await getOrderStatus(req, {
      params: { orderCode: order.orderCode },
    });
    const data = await res.json();

    // Expired token (>30 days) must mask delivered secrets!
    expect(data.deliveredItems).toEqual([]);
    expect(data.tokenExpired).toBe(true);
  });

  it("3. POST /api/orders/[orderCode]/refund-request rejects guest order without valid token", async () => {
    const order = await createOrder({
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Request refund WITHOUT token
    const reqNoToken = new Request(
      `http://localhost:3000/api/orders/${order.orderCode}/refund-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "MB",
          accountNumber: "0987654321",
          accountName: "NGUYEN VAN A",
        }),
      }
    );
    const res1 = await postRefundRequest(reqNoToken, {
      params: { orderCode: order.orderCode },
    });
    expect(res1.status).toBe(403);

    // Request refund WITH valid token
    const reqWithToken = new Request(
      `http://localhost:3000/api/orders/${order.orderCode}/refund-request?token=${order.accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "MB",
          accountNumber: "0987654321",
          accountName: "NGUYEN VAN A",
        }),
      }
    );
    const res2 = await postRefundRequest(reqWithToken, {
      params: { orderCode: order.orderCode },
    });
    expect(res2.status).toBe(200);
  });
});
