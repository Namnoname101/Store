import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, FulfillmentType, OrderStatus } from "@/lib/prisma";
import { createOrder } from "@/services/order.service";

describe("SMM Custom Quantity & Min/Max Validation", () => {
  const TEST_CAT_SLUG = "test-smm-custom-cat";
  const TEST_PROD_SLUG = "test-smm-tiktok-likes";
  let testCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Clean up
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
      data: {
        name: "Test SMM Cat",
        slug: TEST_CAT_SLUG,
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Tăng Like TikTok Test",
        slug: TEST_PROD_SLUG,
        description: "Test description",
        price: 25, // 25 VND per like
        categoryId: testCategoryId,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        minQuantity: 50,
        maxQuantity: 15000,
        isActive: true,
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  it("should calculate correct totalAmount when ordering arbitrary quantity", async () => {
    const order = await createOrder({
      customerEmail: "smmtest@example.com",
      customerNote: "https://tiktok.com/@myuser/video/123",
      items: [
        {
          productId: testProductId,
          quantity: 250, // 250 * 25 = 6250
        },
      ],
    });

    expect(order.totalAmount).toBe(6250);
    expect(order.customerNote).toBe("https://tiktok.com/@myuser/video/123");
    expect(order.orderItems[0].quantity).toBe(250);
    expect(order.orderItems[0].price).toBe(25);
  });

  it("should reject order if quantity is less than minQuantity", async () => {
    await expect(
      createOrder({
        customerEmail: "smmtest@example.com",
        customerNote: "https://tiktok.com/@myuser/video/123",
        items: [
          {
            productId: testProductId,
            quantity: 20, // Less than minQuantity: 50
          },
        ],
      })
    ).rejects.toThrow(/tối thiểu/i);
  });

  it("should reject order if quantity exceeds maxQuantity", async () => {
    await expect(
      createOrder({
        customerEmail: "smmtest@example.com",
        customerNote: "https://tiktok.com/@myuser/video/123",
        items: [
          {
            productId: testProductId,
            quantity: 20000, // Greater than maxQuantity: 15000
          },
        ],
      })
    ).rejects.toThrow(/tối đa/i);
  });

  it("should fulfill order with custom quantity via upstream adapter", async () => {
    const { fulfillOrderViaUpstream } = await import("@/services/upstream-fulfillment.service");
    const { registerSupplierAdapter } = await import("@/services/suppliers/adapter.registry");
    const { MockSupplierAdapter } = await import("@/services/suppliers/adapters/mock.adapter");
    const mockAdapter = new MockSupplierAdapter();
    mockAdapter.setProduct("MOCK_SMM_1", {
      name: "Mock SMM Product",
      price: 15,
      inStock: 999999,
      keys: [],
    });
    registerSupplierAdapter("MOCK", mockAdapter);

    // Setup mock supplier for test product
    await prisma.supplierProductMapping.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.supplier.deleteMany({
      where: { code: "MOCK_SMM" },
    });

    const supplier = await prisma.supplier.create({
      data: {
        name: "Test SMM Supplier",
        code: "MOCK_SMM",
        type: "MOCK",
        baseUrl: "https://mock.example.com",
        apiKey: "test-key",
        isActive: true,
      },
    });

    await prisma.supplierProductMapping.create({
      data: {
        productId: testProductId,
        supplierId: supplier.id,
        supplierProductCode: "MOCK_SMM_1",
        supplierPrice: 15,
        supplierStock: 999999,
        markupType: "FIXED_AMOUNT",
        markupValue: 10,
      },
    });

    const order = await createOrder({
      customerEmail: "smmtest2@example.com",
      customerNote: "https://tiktok.com/@myuser/video/456",
      items: [
        {
          productId: testProductId,
          quantity: 350,
        },
      ],
    });

    // Mark order as PAID to simulate payment webhook
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });

    const result = await fulfillOrderViaUpstream(order.id);
    expect(result.success).toBe(true);

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updatedOrder?.upstreamStatus).toBe("COMPLETED");

    // Clean up mock supplier
    await prisma.supplierProductMapping.deleteMany({
      where: { supplierId: supplier.id },
    });
    await prisma.supplier.delete({
      where: { id: supplier.id },
    });
  });
});
