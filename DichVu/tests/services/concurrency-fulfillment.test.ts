import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  prisma,
  OrderStatus,
  FulfillmentType,
  UpstreamStatus,
  SupplierType,
} from "@/lib/prisma";
import { fulfillOrderViaUpstream } from "@/services/upstream-fulfillment.service";
import { createOrder } from "@/services/order.service";
import * as adapterRegistry from "@/services/suppliers/adapter.registry";

describe("Concurrency-Safe Automated Fulfillment Engine", () => {
  const TEST_CAT_SLUG = "concur-test-cat";
  const TEST_PROD_1 = "concur-prod-1";
  const TEST_PROD_2 = "concur-prod-2";
  let catId: string;
  let prod1Id: string;
  let prod2Id: string;
  let supplierId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.supplierProductMapping.deleteMany({
      where: { product: { slug: { in: [TEST_PROD_1, TEST_PROD_2] } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: [TEST_PROD_1, TEST_PROD_2] } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_PROD_1, TEST_PROD_2] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
    await prisma.supplier.deleteMany({
      where: { name: "Mock Test Supplier" },
    });

    const category = await prisma.category.create({
      data: { name: "Concur Test Cat", slug: TEST_CAT_SLUG },
    });
    catId = category.id;

    const supplier = await prisma.supplier.create({
      data: {
        code: "MOCK_SUPPLIER",
        name: "Mock Test Supplier",
        type: "MOCK",
        baseUrl: "https://mock.test",
        apiKey: "test-key",
        isActive: true,
      },
    });
    supplierId = supplier.id;

    const p1 = await prisma.product.create({
      data: {
        title: "Concur Product 1",
        slug: TEST_PROD_1,
        description: "Test 1",
        price: 20000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
      },
    });
    prod1Id = p1.id;

    const p2 = await prisma.product.create({
      data: {
        title: "Concur Product 2",
        slug: TEST_PROD_2,
        description: "Test 2",
        price: 30000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
      },
    });
    prod2Id = p2.id;

    await prisma.supplierProductMapping.create({
      data: {
        productId: prod1Id,
        supplierId,
        supplierProductCode: "MOCK_CODE_1",
        supplierPrice: 15000,
        markupType: "PERCENT",
        markupValue: 20,
      },
    });

    await prisma.supplierProductMapping.create({
      data: {
        productId: prod2Id,
        supplierId,
        supplierProductCode: "MOCK_CODE_2",
        supplierPrice: 22000,
        markupType: "PERCENT",
        markupValue: 20,
      },
    });
  });

  afterAll(async () => {
    await prisma.supplierProductMapping.deleteMany({
      where: { product: { slug: { in: [TEST_PROD_1, TEST_PROD_2] } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: [TEST_PROD_1, TEST_PROD_2] } } },
    });
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: { in: [TEST_PROD_1, TEST_PROD_2] } } } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_PROD_1, TEST_PROD_2] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
    await prisma.supplier.deleteMany({
      where: { id: supplierId },
    });
  });

  it("should prevent duplicate fulfillment when called concurrently on the same order", async () => {
    const order = await createOrder({
      customerEmail: "concur@test.com",
      items: [{ productId: prod1Id, quantity: 1, targetLink: "https://tiktok.com/@test1" }],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    // Mock adapter with a slight delay
    let buyCallCount = 0;
    const mockAdapter = {
      type: SupplierType.MOCK,
      checkBalance: vi.fn(),
      getProductList: vi.fn(),
      buyProduct: vi.fn(async () => {
        buyCallCount++;
        await new Promise((res) => setTimeout(res, 50));
        return {
          success: true,
          upstreamOrderId: "ORD_CONCUR_123",
          deliveredKeys: ["KEY_MOCK_1"],
        };
      }),
      getOrderStatus: vi.fn(),
    };

    vi.spyOn(adapterRegistry, "getSupplierAdapter").mockReturnValue(mockAdapter as any);

    // Call fulfillOrderViaUpstream twice concurrently
    const [res1, res2] = await Promise.all([
      fulfillOrderViaUpstream(order.id),
      fulfillOrderViaUpstream(order.id),
    ]);

    // Only 1 execution should have called the supplier adapter
    expect(buyCallCount).toBe(1);

    // One of them is the primary success, other was blocked by lock or reports in progress/completed
    const anySuccess = res1.success || res2.success;
    expect(anySuccess).toBe(true);

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(finalOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);

    vi.restoreAllMocks();
  });

  it("should route distinct target links for each product in multi-item orders", async () => {
    const order = await createOrder({
      customerEmail: "multi@test.com",
      items: [
        { productId: prod1Id, quantity: 1, targetLink: "https://tiktok.com/@channel1" },
        { productId: prod2Id, quantity: 1, targetLink: "https://facebook.com/profile2" },
      ],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    const routedLinks: string[] = [];
    const mockAdapter = {
      type: SupplierType.MOCK,
      checkBalance: vi.fn(),
      getProductList: vi.fn(),
      buyProduct: vi.fn(async (_creds, _code, _qty, _memo, extra) => {
        if (extra?.link) routedLinks.push(extra.link);
        return {
          success: true,
          upstreamOrderId: "ORD_MULTI_456",
          deliveredKeys: ["KEY_MOCK_2"],
        };
      }),
      getOrderStatus: vi.fn(),
    };

    vi.spyOn(adapterRegistry, "getSupplierAdapter").mockReturnValue(mockAdapter as any);

    const result = await fulfillOrderViaUpstream(order.id);
    expect(result.success).toBe(true);

    expect(routedLinks).toContain("https://tiktok.com/@channel1");
    expect(routedLinks).toContain("https://facebook.com/profile2");

    vi.restoreAllMocks();
  });

  it("should escalate to Owner when supplier fails across bounded retries", async () => {
    const order = await createOrder({
      customerEmail: "fail@test.com",
      items: [{ productId: prod1Id, quantity: 1, targetLink: "https://tiktok.com/@fail" }],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    let attempts = 0;
    const mockAdapter = {
      type: SupplierType.MOCK,
      checkBalance: vi.fn(),
      getProductList: vi.fn(),
      buyProduct: vi.fn(async () => {
        attempts++;
        return {
          success: false,
          error: "Supplier API Outage 503",
        };
      }),
      getOrderStatus: vi.fn(),
    };

    vi.spyOn(adapterRegistry, "getSupplierAdapter").mockReturnValue(mockAdapter as any);

    const result = await fulfillOrderViaUpstream(order.id);
    expect(result.success).toBe(false);
    expect(attempts).toBe(3); // Attempted 3 times

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(finalOrder?.upstreamStatus).toBe(UpstreamStatus.FAILED);
    expect(finalOrder?.upstreamError).toContain("Cần Chủ sở hữu xử lý");

    vi.restoreAllMocks();
  });
});
