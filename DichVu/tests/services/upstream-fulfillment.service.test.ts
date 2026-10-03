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
import { handleIncomingTransaction } from "@/services/payment.service";

describe("Automated Upstream Fulfillment Pipeline", () => {
  const TEST_SUPPLIER_CODE = "TEST_UPSTREAM_SUPP";
  const TEST_SUPPLIER_TYPE = "MOCK_UPSTREAM";
  const TEST_CATEGORY_SLUG = "test-upstream-cat";
  const TEST_DROPSHIP_SLUG = "test-dropship-prod-1";
  const TEST_LOCAL_SLUG = "test-local-prod-1";
  const TEST_UNMAPPED_SLUG = "test-unmapped-dropship-prod";
  const TEST_CUSTOMER_EMAIL = "buyer-upstream@example.com";

  let mockAdapter: MockSupplierAdapter;
  let testCategoryId: string;
  let testSupplierId: string;
  let testDropshipProductId: string;
  let testLocalProductId: string;
  let testUnmappedProductId: string;

  beforeAll(async () => {
    // Teardown any leftovers
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "TEST_UP" } },
    }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [TEST_DROPSHIP_SLUG, TEST_LOCAL_SLUG, TEST_UNMAPPED_SLUG],
          },
        },
      },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [TEST_DROPSHIP_SLUG, TEST_LOCAL_SLUG, TEST_UNMAPPED_SLUG],
          },
        },
      },
    }).catch(() => {});
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    }).catch(() => {});
    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    }).catch(() => {});
    await prisma.product.deleteMany({
      where: {
        slug: {
          in: [TEST_DROPSHIP_SLUG, TEST_LOCAL_SLUG, TEST_UNMAPPED_SLUG],
        },
      },
    }).catch(() => {});
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    }).catch(() => {});

    // Create Category
    const category = await prisma.category.create({
      data: {
        name: "Test Upstream Category",
        slug: TEST_CATEGORY_SLUG,
      },
    });
    testCategoryId = category.id;

    // Create Supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: "Mock Upstream Supplier",
        code: TEST_SUPPLIER_CODE,
        type: TEST_SUPPLIER_TYPE,
        baseUrl: "https://mock.supplier.com",
        apiKey: "mock-key",
        apiSecret: "mock-secret",
        currentBalance: 500000,
        isActive: true,
      },
    });
    testSupplierId = supplier.id;

    // Create Dropship Product with mapping
    const dropshipProduct = await prisma.product.create({
      data: {
        title: "Test Dropship Product",
        slug: TEST_DROPSHIP_SLUG,
        description: "Auto-fulfilled dropship product",
        price: 60000,
        categoryId: testCategoryId,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        isActive: true,
      },
    });
    testDropshipProductId = dropshipProduct.id;

    await prisma.supplierProductMapping.create({
      data: {
        productId: dropshipProduct.id,
        supplierId: testSupplierId,
        supplierProductCode: "MOCK_DS_SKU_1",
        supplierPrice: 40000,
        markupType: MarkupType.PERCENTAGE,
        markupValue: 50,
      },
    });

    // Create Local Stock Product
    const localProduct = await prisma.product.create({
      data: {
        title: "Test Local Product",
        slug: TEST_LOCAL_SLUG,
        description: "Local inventory product",
        price: 30000,
        categoryId: testCategoryId,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        isActive: true,
      },
    });
    testLocalProductId = localProduct.id;

    // Create Unmapped Dropship Product
    const unmappedProduct = await prisma.product.create({
      data: {
        title: "Test Unmapped Dropship Product",
        slug: TEST_UNMAPPED_SLUG,
        description: "Dropship product missing supplier mapping",
        price: 80000,
        categoryId: testCategoryId,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        isActive: true,
      },
    });
    testUnmappedProductId = unmappedProduct.id;
  });

  afterAll(async () => {
    resetAdapterRegistry();

    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "TEST_UP" } },
    }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [TEST_DROPSHIP_SLUG, TEST_LOCAL_SLUG, TEST_UNMAPPED_SLUG],
          },
        },
      },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [TEST_DROPSHIP_SLUG, TEST_LOCAL_SLUG, TEST_UNMAPPED_SLUG],
          },
        },
      },
    }).catch(() => {});
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    }).catch(() => {});
    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    }).catch(() => {});
    await prisma.product.deleteMany({
      where: {
        slug: {
          in: [TEST_DROPSHIP_SLUG, TEST_LOCAL_SLUG, TEST_UNMAPPED_SLUG],
        },
      },
    }).catch(() => {});
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    }).catch(() => {});

    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockAdapter = new MockSupplierAdapter();
    mockAdapter.setBalance(1000000);
    mockAdapter.setProduct("MOCK_DS_SKU_1", {
      name: "Mock Dropship Item",
      price: 40000,
      inStock: 50,
      keys: ["DS-KEY-AAA", "DS-KEY-BBB", "DS-KEY-CCC"],
    });

    registerSupplierAdapter(TEST_SUPPLIER_TYPE, mockAdapter);
  });

  describe("fulfillOrderViaUpstream", () => {
    it("fails when order is not in PAID status", async () => {
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 1 }],
      });

      const result = await fulfillOrderViaUpstream(order.id);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/paid/i);
    });

    it("marks upstreamStatus = NOT_APPLICABLE if order has only LOCAL_STOCK items", async () => {
      // Seed local stock first
      await prisma.productItem.create({
        data: {
          productId: testLocalProductId,
          secretContent: "LOCAL-SECRET-KEY",
          status: ItemStatus.AVAILABLE,
        },
      });

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testLocalProductId, quantity: 1 }],
      });

      // Mark order as PAID
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      const result = await fulfillOrderViaUpstream(order.id);
      expect(result.success).toBe(true);
      expect(result.status).toBe(UpstreamStatus.NOT_APPLICABLE);

      const dbOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(dbOrder?.upstreamStatus).toBe(UpstreamStatus.NOT_APPLICABLE);
    });

    it("successfully purchases product, creates ProductItem records with SOLD, and marks COMPLETED", async () => {
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 2 }],
      });

      // Mark order as PAID
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      const result = await fulfillOrderViaUpstream(order.id);
      expect(result.success).toBe(true);
      expect(result.status).toBe(UpstreamStatus.COMPLETED);
      expect(result.upstreamOrderId).toBeDefined();

      // Check DB order
      const dbOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(dbOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(dbOrder?.upstreamOrderId).toBe(result.upstreamOrderId);
      expect(dbOrder?.upstreamError).toBeNull();

      // Check created ProductItem records
      const deliveredItems = await prisma.productItem.findMany({
        where: { orderId: order.id },
      });
      expect(deliveredItems.length).toBe(2);
      expect(deliveredItems.map((i) => i.status)).toEqual([
        ItemStatus.SOLD,
        ItemStatus.SOLD,
      ]);
      expect(deliveredItems.map((i) => i.secretContent)).toEqual([
        "DS-KEY-AAA",
        "DS-KEY-BBB",
      ]);

      // Check getOrderDetails returns secretContent and upstreamStatus
      const details = await getOrderDetails(order.orderCode);
      expect(details?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(details?.deliveredItems.length).toBe(2);
      expect(details?.deliveredItems[0].secretContent).toBe("DS-KEY-AAA");
    });

    it("handles supplier purchase failure (e.g. INSUFFICIENT_BALANCE) by setting FAILED and upstreamError", async () => {
      mockAdapter.setBalance(10000); // Not enough for 40000

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 1 }],
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      const result = await fulfillOrderViaUpstream(order.id);
      expect(result.success).toBe(false);
      expect(result.status).toBe(UpstreamStatus.FAILED);
      expect(result.error).toContain("INSUFFICIENT_BALANCE");

      const dbOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(dbOrder?.upstreamStatus).toBe(UpstreamStatus.FAILED);
      expect(dbOrder?.upstreamError).toContain("INSUFFICIENT_BALANCE");

      // Verify no ProductItem was created
      const items = await prisma.productItem.findMany({
        where: { orderId: order.id },
      });
      expect(items.length).toBe(0);
    });

    it("handles missing supplier mapping by failing gracefully", async () => {
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testUnmappedProductId, quantity: 1 }],
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      const result = await fulfillOrderViaUpstream(order.id);
      expect(result.success).toBe(false);
      expect(result.status).toBe(UpstreamStatus.FAILED);
      expect(result.error).toMatch(/mapping missing/i);

      const dbOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(dbOrder?.upstreamStatus).toBe(UpstreamStatus.FAILED);
      expect(dbOrder?.upstreamError).toMatch(/mapping missing/i);
    });

    it("handles inactive supplier by failing gracefully", async () => {
      // Deactivate supplier temporarily
      await prisma.supplier.update({
        where: { id: testSupplierId },
        data: { isActive: false },
      });

      try {
        const order = await createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testDropshipProductId, quantity: 1 }],
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID, paidAt: new Date() },
        });

        const result = await fulfillOrderViaUpstream(order.id);
        expect(result.success).toBe(false);
        expect(result.status).toBe(UpstreamStatus.FAILED);
        expect(result.error).toMatch(/missing or inactive/i);
      } finally {
        await prisma.supplier.update({
          where: { id: testSupplierId },
          data: { isActive: true },
        });
      }
    });
  });

  describe("retryUpstreamFulfillment", () => {
    it("allows retrying a FAILED order and succeeds after fixing supplier balance", async () => {
      // Step 1: Cause initial failure
      mockAdapter.setBalance(0);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 1 }],
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      const firstAttempt = await fulfillOrderViaUpstream(order.id);
      expect(firstAttempt.success).toBe(false);
      expect(firstAttempt.status).toBe(UpstreamStatus.FAILED);

      // Step 2: Fix supplier balance
      mockAdapter.setBalance(200000);

      // Step 3: Call retryUpstreamFulfillment
      const retryResult = await retryUpstreamFulfillment(order.id);
      expect(retryResult.success).toBe(true);
      expect(retryResult.status).toBe(UpstreamStatus.COMPLETED);
      expect(retryResult.upstreamOrderId).toBeDefined();

      const dbOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(dbOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(dbOrder?.upstreamError).toBeNull();

      const items = await prisma.productItem.findMany({
        where: { orderId: order.id },
      });
      expect(items.length).toBe(1);
      expect(items[0].status).toBe(ItemStatus.SOLD);
    });

    it("rejects retry if order is already COMPLETED", async () => {
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 1 }],
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      const initial = await fulfillOrderViaUpstream(order.id);
      expect(initial.success).toBe(true);

      const retryResult = await retryUpstreamFulfillment(order.id);
      expect(retryResult.success).toBe(false);
      expect(retryResult.error).toMatch(/FAILED or PENDING_UPSTREAM/i);
    });
  });

  describe("End-to-End Payment Webhook Integration", () => {
    it("automatically triggers upstream fulfillment when webhook transitions dropship order to PAID", async () => {
      mockAdapter.setProduct("MOCK_DS_SKU_1", {
        price: 40000,
        inStock: 10,
        keys: ["WEBHOOK-KEY-12345"],
      });

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 1 }],
      });

      // Initially order is PENDING, not fulfilled yet
      expect(order.status).toBe(OrderStatus.PENDING);

      const txId = `TX_UP_${Date.now()}_AUTO`;
      const webhookPayload = {
        transactionId: txId,
        amount: 60000,
        content: `Thanh toan don hang ${order.orderCode} tai cua hang`,
        bankCode: "MB",
      };

      const webhookResult = await handleIncomingTransaction(webhookPayload);
      expect(webhookResult.success).toBe(true);
      expect(webhookResult.status).toBe(OrderStatus.PAID);

      // Verify Order upstreamStatus was automatically updated to COMPLETED
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder?.status).toBe(OrderStatus.PAID);
      expect(updatedOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(updatedOrder?.upstreamOrderId).toBeDefined();

      // Verify delivered item was generated and can be retrieved
      const details = await getOrderDetails(order.orderCode);
      expect(details?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(details?.deliveredItems.length).toBe(1);
      expect(details?.deliveredItems[0].secretContent).toBe("WEBHOOK-KEY-12345");
    });
  });
});
