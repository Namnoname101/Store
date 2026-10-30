import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma, ItemStatus, OrderStatus, UpstreamStatus, FulfillmentType } from "@/lib/prisma";
import { createOrder, getOrderDetails } from "@/services/order.service";
import { handleIncomingTransaction } from "@/services/payment.service";
import { POST as manualFulfillRoute } from "@/app/api/admin/orders/[orderId]/manual-fulfill/route";
import { NextRequest } from "next/server";

describe("Claude API Option 1 - Warehouse Stock & Out-of-Stock Fallback", () => {
  const TEST_CAT_SLUG = "test-claude-cat";
  const TEST_CLAUDE_SLUG = "test-cla-0036-api-claude-10-max";
  let testCategoryId: string;
  let testClaudeProductId: string;

  beforeAll(async () => {
    // Cleanup residual test records
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_CLAUDE_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_CLAUDE_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_CLAUDE_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    // Create Category & Claude Product
    const category = await prisma.category.create({
      data: {
        name: "Test Claude Category",
        slug: TEST_CAT_SLUG,
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Test API Claude 10$ Max",
        slug: TEST_CLAUDE_SLUG,
        description: "Test Claude 10$ License Key",
        price: 18000,
        categoryId: testCategoryId,
        type: "LICENSE_KEY",
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        isActive: true,
      },
    });
    testClaudeProductId = product.id;
  });

  afterAll(async () => {
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_CLAUDE_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_CLAUDE_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_CLAUDE_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  it("Case A: When warehouse has stock, keys are delivered immediately upon payment", async () => {
    // 1. Seed 1 available key in warehouse
    const testSecret = "sk-ant-test-key-in-stock-12345";
    await prisma.productItem.create({
      data: {
        productId: testClaudeProductId,
        secretContent: testSecret,
        status: ItemStatus.AVAILABLE,
      },
    });

    // 2. Customer creates order
    const order = await createOrder({
      customerEmail: "claude-instock@example.com",
      items: [{ productId: testClaudeProductId, quantity: 1 }],
    });

    expect(order).toBeDefined();
    expect(order.status).toBe(OrderStatus.PENDING);

    // Verify item was reserved
    const reserved = await prisma.productItem.findFirst({
      where: { orderId: order.id, status: ItemStatus.RESERVED },
    });
    expect(reserved).toBeDefined();
    expect(reserved?.secretContent).toBe(testSecret);

    // 3. Customer pays via VietQR
    const payResult = await handleIncomingTransaction({
      transactionId: `TX_CLAUDE_${Date.now()}`,
      amount: order.totalAmount,
      content: order.orderCode,
      bankCode: "MB",
    });

    expect(payResult.success).toBe(true);

    // 4. Verify order has delivered items
    const details = await getOrderDetails(order.orderCode);
    expect(details?.status).toBe(OrderStatus.PAID);
    expect(details?.deliveredItems.length).toBe(1);
    expect(details?.deliveredItems[0].secretContent).toBe(testSecret);
  });

  it("Case B: When warehouse is out of stock (stock = 0), order creates as PENDING_MANUAL, pays, and allows manual fulfillment", async () => {
    // Verify warehouse has 0 available keys
    const availableCount = await prisma.productItem.count({
      where: { productId: testClaudeProductId, status: ItemStatus.AVAILABLE },
    });
    expect(availableCount).toBe(0);

    // 1. Customer buys despite stock = 0
    const order = await createOrder({
      customerEmail: "claude-outofstock@example.com",
      items: [{ productId: testClaudeProductId, quantity: 1 }],
    });

    expect(order).toBeDefined();
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.upstreamStatus).toBe(UpstreamStatus.PENDING_MANUAL);

    // 2. Customer pays
    const payResult = await handleIncomingTransaction({
      transactionId: `TX_CLAUDE_OOS_${Date.now()}`,
      amount: order.totalAmount,
      content: order.orderCode,
      bankCode: "MB",
    });

    expect(payResult.success).toBe(true);

    // Verify order is paid but waiting for key (0 delivered items)
    const paidDetails = await getOrderDetails(order.orderCode);
    expect(paidDetails?.status).toBe(OrderStatus.PAID);
    expect(paidDetails?.upstreamStatus).toBe(UpstreamStatus.PENDING_MANUAL);
    expect(paidDetails?.deliveredItems.length).toBe(0);

    // 3. Admin manually fulfills the order via /api/admin/orders/[orderId]/manual-fulfill
    const manualSecret = "sk-ant-admin-manual-added-key-67890";
    const req = new NextRequest(`http://localhost:3000/api/admin/orders/${order.id}/manual-fulfill`, {
      method: "POST",
      body: JSON.stringify({
        secrets: manualSecret,
        note: "Cấp key thủ công cho khách",
      }),
    });

    const res = await manualFulfillRoute(req, { params: { orderId: order.id } });
    const resData = await res.json();
    expect(res.status).toBe(200);
    expect(resData.success).toBe(true);

    // 4. Verify key is delivered and status is COMPLETED
    const finalDetails = await getOrderDetails(order.orderCode);
    expect(finalDetails?.status).toBe(OrderStatus.PAID);
    expect(finalDetails?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
    expect(finalDetails?.deliveredItems.length).toBe(1);
    expect(finalDetails?.deliveredItems[0].secretContent).toBe(manualSecret);
  });
});
