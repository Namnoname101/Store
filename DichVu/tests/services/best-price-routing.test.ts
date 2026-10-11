import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  OrderStatus,
  FulfillmentType,
  UpstreamStatus,
  MarkupType,
  ItemStatus,
} from "../../src/lib/prisma";
import { fulfillOrderViaUpstream } from "../../src/services/upstream-fulfillment.service";
import { MockSupplierAdapter } from "../../src/services/suppliers/adapters/mock.adapter";
import { registerSupplierAdapter, resetAdapterRegistry } from "../../src/services/suppliers/adapter.registry";

describe("Best-Price Supplier Routing Engine", () => {
  const SUPP_EXPENSIVE = "SUPP_EXPENSIVE";
  const SUPP_CHEAP = "SUPP_CHEAP";
  const PROD_SLUG = "test-best-price-product";

  let adapterExpensive: MockSupplierAdapter;
  let adapterCheap: MockSupplierAdapter;

  let expensiveSupplierId: string;
  let cheapSupplierId: string;
  let testProductId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Setup Mock Adapters
    adapterExpensive = new MockSupplierAdapter();
    adapterCheap = new MockSupplierAdapter();

    registerSupplierAdapter("MOCK_EXPENSIVE", adapterExpensive);
    registerSupplierAdapter("MOCK_CHEAP", adapterCheap);

    // Clean up
    await prisma.productItem.deleteMany({ where: { product: { slug: PROD_SLUG } } });
    await prisma.orderItem.deleteMany({ where: { product: { slug: PROD_SLUG } } });
    await prisma.supplierProductMapping.deleteMany({ where: { product: { slug: PROD_SLUG } } });
    await prisma.product.deleteMany({ where: { slug: PROD_SLUG } });
    await prisma.supplier.deleteMany({ where: { code: { in: [SUPP_EXPENSIVE, SUPP_CHEAP] } } });
    await prisma.category.deleteMany({ where: { slug: "cat-best-price" } });

    // 1. Create Category & Suppliers
    const cat = await prisma.category.create({
      data: { name: "Best Price Cat", slug: "cat-best-price" },
    });
    testCategoryId = cat.id;

    const suppExp = await prisma.supplier.create({
      data: {
        name: "Expensive Supplier",
        code: SUPP_EXPENSIVE,
        type: "MOCK_EXPENSIVE",
        baseUrl: "https://expensive.com",
        apiKey: "exp-key",
      },
    });
    expensiveSupplierId = suppExp.id;

    const suppCheap = await prisma.supplier.create({
      data: {
        name: "Cheap Supplier",
        code: SUPP_CHEAP,
        type: "MOCK_CHEAP",
        baseUrl: "https://cheap.com",
        apiKey: "cheap-key",
      },
    });
    cheapSupplierId = suppCheap.id;

    // 2. Create Product
    const prod = await prisma.product.create({
      data: {
        title: "Gemini Pro Shared",
        slug: PROD_SLUG,
        description: "Shared Gemini Pro account test",
        price: 25000,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        categoryId: testCategoryId,
      },
    });
    testProductId = prod.id;

    // 3. Create Primary Mapping pointing to Expensive Supplier (14.500đ)
    // with alternativeSuppliers pointing to Cheap Supplier (13.800đ)
    await prisma.supplierProductMapping.create({
      data: {
        productId: testProductId,
        supplierId: expensiveSupplierId,
        supplierProductCode: "EXP_PROD_1",
        supplierPrice: 14500,
        markupType: MarkupType.FIXED_AMOUNT,
        markupValue: 10000,
        customConfig: JSON.stringify({
          alternativeSuppliers: [
            {
              supplierCode: SUPP_CHEAP,
              supplierProductCode: "CHEAP_PROD_1",
              supplierPrice: 13800,
            },
          ],
        }),
      },
    });
  });

  afterAll(async () => {
    resetAdapterRegistry();
    await prisma.productItem.deleteMany({ where: { product: { slug: PROD_SLUG } } });
    await prisma.orderItem.deleteMany({ where: { product: { slug: PROD_SLUG } } });
    await prisma.supplierProductMapping.deleteMany({ where: { product: { slug: PROD_SLUG } } });
    await prisma.product.deleteMany({ where: { slug: PROD_SLUG } });
    await prisma.supplier.deleteMany({ where: { code: { in: [SUPP_EXPENSIVE, SUPP_CHEAP] } } });
    await prisma.category.deleteMany({ where: { slug: "cat-best-price" } });
  });

  it("should route purchase to cheaper supplier even if primary mapping is more expensive", async () => {
    // Configure stock & price on cheap supplier
    adapterCheap.setProduct("CHEAP_PROD_1", {
      name: "Gemini Cheap",
      price: 13800,
      inStock: 10,
      keys: ["https://claim-link.cheap.com/token-123"],
    });

    // Configure expensive supplier
    adapterExpensive.setProduct("EXP_PROD_1", {
      name: "Gemini Expensive",
      price: 14500,
      inStock: 10,
      keys: ["https://claim-link.expensive.com/token-999"],
    });

    // Create Order
    const order = await prisma.order.create({
      data: {
        orderCode: `BP_TEST_${Date.now()}`,
        status: OrderStatus.PAID,
        totalAmount: 25000,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        upstreamStatus: UpstreamStatus.NOT_APPLICABLE,
        orderItems: {
          create: [
            {
              productId: testProductId,
              quantity: 1,
              price: 25000,
            },
          ],
        },
      },
    });

    const res = await fulfillOrderViaUpstream(order.id);
    expect(res.success).toBe(true);
    expect(res.status).toBe(UpstreamStatus.COMPLETED);

    // Verify key was delivered from CHEAP supplier!
    const delivered = await prisma.productItem.findMany({ where: { orderId: order.id } });
    expect(delivered.length).toBe(1);
    expect(delivered[0].secretContent).toBe("https://claim-link.cheap.com/token-123");
  });

  it("should automatically fall back to expensive supplier if cheap supplier is out of stock", async () => {
    // Cheap supplier runs out of stock
    adapterCheap.setProduct("CHEAP_PROD_1", {
      name: "Gemini Cheap",
      price: 13800,
      inStock: 0,
      keys: [],
    });

    // Expensive supplier has stock
    adapterExpensive.setProduct("EXP_PROD_1", {
      name: "Gemini Expensive",
      price: 14500,
      inStock: 5,
      keys: ["https://claim-link.expensive.com/token-fallback-888"],
    });

    const order = await prisma.order.create({
      data: {
        orderCode: `BP_FALLBACK_${Date.now()}`,
        status: OrderStatus.PAID,
        totalAmount: 25000,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        upstreamStatus: UpstreamStatus.NOT_APPLICABLE,
        orderItems: {
          create: [
            {
              productId: testProductId,
              quantity: 1,
              price: 25000,
            },
          ],
        },
      },
    });

    const res = await fulfillOrderViaUpstream(order.id);
    expect(res.success).toBe(true);

    const delivered = await prisma.productItem.findMany({ where: { orderId: order.id } });
    expect(delivered.length).toBe(1);
    expect(delivered[0].secretContent).toBe("https://claim-link.expensive.com/token-fallback-888");
  });
});
