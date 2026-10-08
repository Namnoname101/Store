import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  prisma,
  ItemStatus,
  OrderStatus,
  FulfillmentType,
  UpstreamStatus,
  MarkupType,
} from "@/lib/prisma";
import {
  fulfillOrderViaUpstream,
  retryUpstreamFulfillment,
} from "@/services/upstream-fulfillment.service";
import { MockSupplierAdapter } from "@/services/suppliers/adapters/mock.adapter";
import {
  registerSupplierAdapter,
  resetAdapterRegistry,
} from "@/services/suppliers/adapter.registry";
import { createOrder, getOrderDetails } from "@/services/order.service";

describe("Task 7: Comprehensive Automated Fulfillment QA", () => {
  const TEST_SUPPLIER_CODE = "QA_MOCK_SUPP";
  const TEST_SUPPLIER_TYPE = "QA_MOCK";
  const TEST_CAT_SLUG = "qa-fulfill-cat";
  const TEST_LOCAL_PROD_SLUG = "qa-local-stock-prod";
  const TEST_SMM_PROD_SLUG = "qa-smm-dropship-prod";
  const TEST_CUSTOMER_EMAIL = "qa-fulfillment@daitruong.store";

  let mockAdapter: MockSupplierAdapter;
  let testCategoryId: string;
  let testSupplierId: string;
  let testLocalProdId: string;
  let testSmmProdId: string;

  beforeAll(async () => {
    // Teardown any leftovers
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD_SLUG, TEST_SMM_PROD_SLUG] } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD_SLUG, TEST_SMM_PROD_SLUG] } } },
    });
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    });
    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_LOCAL_PROD_SLUG, TEST_SMM_PROD_SLUG] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    // Create Category
    const category = await prisma.category.create({
      data: {
        name: "QA Fulfillment Category",
        slug: TEST_CAT_SLUG,
      },
    });
    testCategoryId = category.id;

    // Create Supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: "QA Mock Supplier",
        code: TEST_SUPPLIER_CODE,
        type: TEST_SUPPLIER_TYPE,
        baseUrl: "https://api.qa-mock.internal",
        apiKey: "qa-key-12345",
        currentBalance: 500000,
        isActive: true,
      },
    });
    testSupplierId = supplier.id;

    // Create Local Stock Product
    const localProd = await prisma.product.create({
      data: {
        title: "QA Local Key Product",
        slug: TEST_LOCAL_PROD_SLUG,
        description: "Local stock key testing",
        price: 25000,
        categoryId: testCategoryId,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        isActive: true,
      },
    });
    testLocalProdId = localProd.id;

    // Create Dropship SMM Product
    const smmProd = await prisma.product.create({
      data: {
        title: "QA TikTok Followers Dropship",
        slug: TEST_SMM_PROD_SLUG,
        description: "Dropship SMM testing with targetLink",
        price: 50000,
        categoryId: testCategoryId,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        isActive: true,
      },
    });
    testSmmProdId = smmProd.id;

    // Create Supplier Mapping for SMM
    await prisma.supplierProductMapping.create({
      data: {
        productId: smmProd.id,
        supplierId: supplier.id,
        supplierProductCode: "MOCK_SMM_TIKTOK_FOLLOW",
        supplierPrice: 35000,
        markupType: MarkupType.PERCENTAGE,
        markupValue: 40,
        supplierStock: 9999,
        isAutoSync: false,
      },
    });
  });

  afterAll(async () => {
    resetAdapterRegistry();
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD_SLUG, TEST_SMM_PROD_SLUG] } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: [TEST_LOCAL_PROD_SLUG, TEST_SMM_PROD_SLUG] } } },
    });
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    });
    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_LOCAL_PROD_SLUG, TEST_SMM_PROD_SLUG] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  beforeEach(() => {
    mockAdapter = new MockSupplierAdapter();
    mockAdapter.setBalance(500000);
    mockAdapter.setProduct("MOCK_SMM_TIKTOK_FOLLOW", {
      name: "Mock SMM TikTok Follow",
      price: 35000,
      inStock: 500,
      keys: ["ORDER-SMM-1001", "ORDER-SMM-1002"],
    });
    registerSupplierAdapter(TEST_SUPPLIER_TYPE, mockAdapter);
  });

  it("1. Local Stock: Rejects order creation when stock is insufficient", async () => {
    // Current stock is 0
    await expect(
      createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testLocalProdId, quantity: 1 }],
      })
    ).rejects.toThrow();
  });

  it("2. Local Stock: Reserves key on creation, delivers as SOLD on payment without double-selling", async () => {
    // Add 1 available key
    const seededKey = await prisma.productItem.create({
      data: {
        productId: testLocalProdId,
        secretContent: "QA-LOCAL-KEY-SECRET-999",
        status: ItemStatus.AVAILABLE,
      },
    });

    const order = await createOrder({
      customerEmail: TEST_CUSTOMER_EMAIL,
      items: [{ productId: testLocalProdId, quantity: 1 }],
    });

    // Key should now be RESERVED
    const reservedKey = await prisma.productItem.findUnique({
      where: { id: seededKey.id },
    });
    expect(reservedKey?.status).toBe(ItemStatus.RESERVED);
    expect(reservedKey?.orderId).toBe(order.id);

    // Another buyer tries to buy the same item -> must fail due to 0 available stock
    await expect(
      createOrder({
        customerEmail: "second-buyer@example.com",
        items: [{ productId: testLocalProdId, quantity: 1 }],
      })
    ).rejects.toThrow();

    // Transition order to PAID
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });
    await prisma.productItem.update({
      where: { id: seededKey.id },
      data: { status: ItemStatus.SOLD },
    });

    const details = await getOrderDetails(order.orderCode);
    expect(details?.deliveredItems.length).toBe(1);
    expect(details?.deliveredItems[0].secretContent).toBe("QA-LOCAL-KEY-SECRET-999");
  });

  it("3. Dropship SMM: Correctly passes individual targetLink and customerNote to upstream adapter", async () => {
    const customTargetLink = "https://www.tiktok.com/@daitruong_official_qa";
    const customItemNote = "Giao chậm trong 24h giúp em";

    const order = await createOrder({
      customerEmail: TEST_CUSTOMER_EMAIL,
      items: [
        {
          productId: testSmmProdId,
          quantity: 1,
          targetLink: customTargetLink,
          customerNote: customItemNote,
        },
      ],
    });

    // Verify orderItem in DB has targetLink and customerNote
    const dbOrderItem = await prisma.orderItem.findFirst({
      where: { orderId: order.id },
    });
    expect(dbOrderItem?.targetLink).toBe(customTargetLink);
    expect(dbOrderItem?.customerNote).toBe(customItemNote);

    // Mark PAID
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    const fulfillResult = await fulfillOrderViaUpstream(order.id);
    expect(fulfillResult.success).toBe(true);
    expect(fulfillResult.status).toBe(UpstreamStatus.COMPLETED);

    // Verify mockAdapter purchase log received the link and note
    const purchaseLog = mockAdapter.getPurchaseLog();
    const matchingLog = purchaseLog.find((p) => p.options?.link === customTargetLink);
    expect(matchingLog).toBeDefined();
    expect(matchingLog?.productCode).toBe("MOCK_SMM_TIKTOK_FOLLOW");
    expect(matchingLog?.quantity).toBe(1);
    expect(matchingLog?.options?.customerNote).toBe(customItemNote);

    // Verify delivered item has status SOLD
    const delivered = await prisma.productItem.findMany({
      where: { orderId: order.id },
    });
    expect(delivered.length).toBe(1);
    expect(delivered[0].status).toBe(ItemStatus.SOLD);
  });

  it("4. Concurrency Guard: Multi-worker execution ensures only one worker fulfills the order", async () => {
    const order = await createOrder({
      customerEmail: TEST_CUSTOMER_EMAIL,
      items: [{ productId: testSmmProdId, quantity: 1 }],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    // Simulate 3 concurrent worker invocations on the exact same order
    const [w1, w2, w3] = await Promise.all([
      fulfillOrderViaUpstream(order.id),
      fulfillOrderViaUpstream(order.id),
      fulfillOrderViaUpstream(order.id),
    ]);

    // Exactly one worker must have performed the fulfillment
    const successfulWorkers = [w1, w2, w3].filter((r) => r.success && r.itemsDelivered !== undefined);
    expect(successfulWorkers.length).toBe(1);

    // Verify delivered keys is exactly 1 (no double generation)
    const deliveredKeys = await prisma.productItem.findMany({
      where: { orderId: order.id },
    });
    expect(deliveredKeys.length).toBe(1);
  });

  it("5. Upstream Failure & Owner Retry: Sets FAILED, retains error detail, and succeeds on retry", async () => {
    // Set balance to 0 to trigger upstream failure
    mockAdapter.setBalance(0);

    const order = await createOrder({
      customerEmail: TEST_CUSTOMER_EMAIL,
      items: [{ productId: testSmmProdId, quantity: 1 }],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    const failedResult = await fulfillOrderViaUpstream(order.id);
    expect(failedResult.success).toBe(false);
    expect(failedResult.status).toBe(UpstreamStatus.FAILED);

    const dbOrderFailed = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(dbOrderFailed?.status).toBe(OrderStatus.PAID); // Order remains PAID
    expect(dbOrderFailed?.upstreamStatus).toBe(UpstreamStatus.FAILED);
    expect(dbOrderFailed?.upstreamError).toContain("INSUFFICIENT_BALANCE");

    // Deposit funds and retry
    mockAdapter.setBalance(1000000);
    const retryResult = await retryUpstreamFulfillment(order.id);
    expect(retryResult.success).toBe(true);
    expect(retryResult.status).toBe(UpstreamStatus.COMPLETED);

    const dbOrderFixed = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(dbOrderFixed?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
    expect(dbOrderFixed?.upstreamError).toBeNull();
  });
});
