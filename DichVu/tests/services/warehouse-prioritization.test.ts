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
} from "@/services/upstream-fulfillment.service";
import { getAvailableStockCount } from "@/services/inventory.service";
import { MockSupplierAdapter } from "@/services/suppliers/adapters/mock.adapter";
import {
  registerSupplierAdapter,
  resetAdapterRegistry,
} from "@/services/suppliers/adapter.registry";
import { createOrder, getOrderDetails } from "@/services/order.service";
import { handleIncomingTransaction } from "@/services/payment.service";
import { payOrderWithWallet } from "@/services/wallet.service";

describe("Warehouse Inventory Prioritization (R3)", () => {
  const TEST_SUPPLIER_CODE = "TEST_WH_PRIORITY_SUPP";
  const TEST_SUPPLIER_TYPE = "MOCK_WH_PRIORITY";
  const TEST_CATEGORY_SLUG = "test-wh-priority-cat";
  const TEST_DROPSHIP_SLUG = "test-wh-priority-dropship";
  const TEST_CUSTOMER_EMAIL = "buyer-priority@example.com";
  const TEST_USER_EMAIL = "user-priority-wallet@example.com";

  let mockAdapter: MockSupplierAdapter;
  let testCategoryId: string;
  let testSupplierId: string;
  let testDropshipProductId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Teardown leftovers
    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "WH_TEST" } },
    }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: {
        product: { slug: TEST_DROPSHIP_SLUG },
      },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: {
        product: { slug: TEST_DROPSHIP_SLUG },
      },
    }).catch(() => {});
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    }).catch(() => {});
    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: {
        OR: [
          { customerEmail: TEST_CUSTOMER_EMAIL },
          { customerEmail: TEST_USER_EMAIL },
        ],
      },
    }).catch(() => {});
    await prisma.product.deleteMany({
      where: { slug: TEST_DROPSHIP_SLUG },
    }).catch(() => {});
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    }).catch(() => {});
    await prisma.walletTransaction.deleteMany({
      where: { user: { email: TEST_USER_EMAIL } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { email: TEST_USER_EMAIL },
    }).catch(() => {});

    // Create Category
    const category = await prisma.category.create({
      data: {
        name: "Test Warehouse Priority Category",
        slug: TEST_CATEGORY_SLUG,
      },
    });
    testCategoryId = category.id;

    // Create Supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: "Mock Priority Supplier",
        code: TEST_SUPPLIER_CODE,
        type: TEST_SUPPLIER_TYPE,
        baseUrl: "https://mock.priority-supplier.com",
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
        title: "Priority Dropship Product",
        slug: TEST_DROPSHIP_SLUG,
        description: "Dropship product that can also be stocked in warehouse",
        price: 50000,
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
        supplierProductCode: "MOCK_PRIORITY_SKU",
        supplierPrice: 30000,
        markupType: MarkupType.FIXED_AMOUNT,
        markupValue: 20000,
        supplierStock: 100,
        isAutoSync: false,
      },
    });

    // Create User with balance for wallet tests
    const user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: "Priority Wallet User",
        balance: 200000,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    resetAdapterRegistry();

    await prisma.paymentTransaction.deleteMany({
      where: { content: { contains: "WH_TEST" } },
    }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: {
        product: { slug: TEST_DROPSHIP_SLUG },
      },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: {
        product: { slug: TEST_DROPSHIP_SLUG },
      },
    }).catch(() => {});
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    }).catch(() => {});
    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: {
        OR: [
          { customerEmail: TEST_CUSTOMER_EMAIL },
          { customerEmail: TEST_USER_EMAIL },
        ],
      },
    }).catch(() => {});
    await prisma.product.deleteMany({
      where: { slug: TEST_DROPSHIP_SLUG },
    }).catch(() => {});
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    }).catch(() => {});
    await prisma.walletTransaction.deleteMany({
      where: { user: { email: TEST_USER_EMAIL } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { email: TEST_USER_EMAIL },
    }).catch(() => {});

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    mockAdapter = new MockSupplierAdapter();
    mockAdapter.setBalance(1000000);
    mockAdapter.setProduct("MOCK_PRIORITY_SKU", {
      name: "Mock Priority SKU",
      price: 30000,
      inStock: 100,
      keys: ["EXT-KEY-101", "EXT-KEY-102", "EXT-KEY-103", "EXT-KEY-104", "EXT-KEY-105"],
    });

    registerSupplierAdapter(TEST_SUPPLIER_TYPE, mockAdapter);

    // Reset mapping supplierStock
    await prisma.supplierProductMapping.updateMany({
      where: { productId: testDropshipProductId },
      data: { supplierStock: 100 },
    });

    // Clean any items for testDropshipProductId
    await prisma.productItem.deleteMany({
      where: { productId: testDropshipProductId },
    });
  });

  describe("Inventory Stock Counting (inventory.service.ts)", () => {
    it("combines warehouse stock and supplier stock for API_DROPSHIP products", async () => {
      // Seed 5 available warehouse keys
      await prisma.productItem.createMany({
        data: [
          { productId: testDropshipProductId, secretContent: "WH-KEY-1", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-KEY-2", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-KEY-3", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-KEY-4", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-KEY-5", status: ItemStatus.AVAILABLE },
        ],
      });

      const totalStock = await getAvailableStockCount(testDropshipProductId);
      // 5 from warehouse + 100 from supplier = 105
      expect(totalStock).toBe(105);
    });

    it("returns available warehouse stock even if external supplier is inactive", async () => {
      // Temporarily deactivate supplier
      await prisma.supplier.update({
        where: { id: testSupplierId },
        data: { isActive: false },
      });

      await prisma.productItem.createMany({
        data: [
          { productId: testDropshipProductId, secretContent: "WH-KEY-A", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-KEY-B", status: ItemStatus.AVAILABLE },
        ],
      });

      const totalStock = await getAvailableStockCount(testDropshipProductId);
      expect(totalStock).toBe(2);

      // Restore supplier
      await prisma.supplier.update({
        where: { id: testSupplierId },
        data: { isActive: true },
      });
    });
  });

  describe("Order Stock Reservation (order.service.ts)", () => {
    it("reserves available warehouse keys during createOrder for API_DROPSHIP items", async () => {
      // Seed 2 available warehouse keys
      await prisma.productItem.createMany({
        data: [
          { productId: testDropshipProductId, secretContent: "WH-RES-1", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-RES-2", status: ItemStatus.AVAILABLE },
        ],
      });

      // Customer orders quantity 1
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 1 }],
      });

      // Verify that 1 item was reserved in ProductItem
      const reservedItems = await prisma.productItem.findMany({
        where: {
          orderId: order.id,
          status: ItemStatus.RESERVED,
        },
      });
      expect(reservedItems).toHaveLength(1);
      expect(reservedItems[0].secretContent).toBe("WH-RES-1");

      // Remaining AVAILABLE in warehouse should be 1
      const availCount = await prisma.productItem.count({
        where: {
          productId: testDropshipProductId,
          status: ItemStatus.AVAILABLE,
        },
      });
      expect(availCount).toBe(1);
    });
  });

  describe("Scenario A: Complete Warehouse Prioritization (Warehouse has sufficient stock)", () => {
    it("delivers 100% from warehouse and NEVER calls external supplier", async () => {
      // Seed 2 available keys in warehouse
      await prisma.productItem.createMany({
        data: [
          { productId: testDropshipProductId, secretContent: "WH-PRIO-A1", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-PRIO-A2", status: ItemStatus.AVAILABLE },
        ],
      });

      // Customer buys 2 keys
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 2 }],
      });

      expect(order.status).toBe(OrderStatus.PENDING);

      // Verify both items are reserved in ProductItem
      const reservedCount = await prisma.productItem.count({
        where: { orderId: order.id, status: ItemStatus.RESERVED },
      });
      expect(reservedCount).toBe(2);

      // Customer pays full amount via VietQR webhook
      const payResult = await handleIncomingTransaction({
        transactionId: `WH_TEST_TX_${Date.now()}_A`,
        amount: order.totalAmount,
        content: `WH_TEST ${order.orderCode}`,
        bankCode: "MB",
      });

      expect(payResult.success).toBe(true);

      // Verify order is PAID
      const updatedOrder = await getOrderDetails(order.orderCode);
      expect(updatedOrder?.status).toBe(OrderStatus.PAID);
      expect(updatedOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);

      // Verify delivered keys are the warehouse keys
      const deliveredKeys = updatedOrder?.deliveredItems.map((i) => i.secretContent).sort();
      expect(deliveredKeys).toEqual(["WH-PRIO-A1", "WH-PRIO-A2"]);

      // CRITICAL ASSERTION: MockSupplierAdapter.buyProduct was NOT called
      expect(mockAdapter.getPurchaseLog()).toHaveLength(0);

      // Supplier stock remains untouched at 100
      const mapping = await prisma.supplierProductMapping.findUnique({
        where: { productId: testDropshipProductId },
      });
      expect(mapping?.supplierStock).toBe(100);
    });
  });

  describe("Scenario B: Partial Warehouse Stock + Upstream Fallback", () => {
    it("delivers available keys from warehouse first, and orders remainder from supplier", async () => {
      // Seed only 1 key in warehouse
      await prisma.productItem.create({
        data: {
          productId: testDropshipProductId,
          secretContent: "WH-PARTIAL-ONLY1",
          status: ItemStatus.AVAILABLE,
        },
      });

      // Customer buys 3 keys (1 should come from warehouse, 2 from external supplier)
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 3 }],
      });

      // 1 item was reserved
      const reservedCount = await prisma.productItem.count({
        where: { orderId: order.id, status: ItemStatus.RESERVED },
      });
      expect(reservedCount).toBe(1);

      // Customer pays
      const payResult = await handleIncomingTransaction({
        transactionId: `WH_TEST_TX_${Date.now()}_B`,
        amount: order.totalAmount,
        content: `WH_TEST ${order.orderCode}`,
        bankCode: "MB",
      });

      expect(payResult.success).toBe(true);

      // Verify order is PAID and COMPLETED
      const updatedOrder = await getOrderDetails(order.orderCode);
      expect(updatedOrder?.status).toBe(OrderStatus.PAID);
      expect(updatedOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);

      // Total delivered keys should be 3: 1 from warehouse + 2 from supplier
      expect(updatedOrder?.deliveredItems).toHaveLength(3);
      const deliveredContents = updatedOrder?.deliveredItems.map((i) => i.secretContent);
      expect(deliveredContents).toContain("WH-PARTIAL-ONLY1");
      expect(deliveredContents).toContain("EXT-KEY-101");
      expect(deliveredContents).toContain("EXT-KEY-102");

      // CRITICAL ASSERTION: MockSupplierAdapter.buyProduct was called EXACTLY ONCE for quantity = 2
      expect(mockAdapter.getPurchaseLog()).toHaveLength(1);
      expect(mockAdapter.getPurchaseLog()[0].quantity).toBe(2);

      // Supplier stock decremented by 2 (100 - 2 = 98), not 3
      const mapping = await prisma.supplierProductMapping.findUnique({
        where: { productId: testDropshipProductId },
      });
      expect(mapping?.supplierStock).toBe(98);
    });
  });

  describe("Scenario B2: Empty Warehouse Stock (100% Upstream Fallback)", () => {
    it("calls supplier for full quantity when warehouse has 0 keys", async () => {
      // Warehouse is empty (0 keys in ProductItem)
      const count = await prisma.productItem.count({
        where: { productId: testDropshipProductId },
      });
      expect(count).toBe(0);

      // Customer buys 2 keys
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 2 }],
      });

      // Customer pays
      const payResult = await handleIncomingTransaction({
        transactionId: `WH_TEST_TX_${Date.now()}_B2`,
        amount: order.totalAmount,
        content: `WH_TEST ${order.orderCode}`,
        bankCode: "MB",
      });

      expect(payResult.success).toBe(true);

      const updatedOrder = await getOrderDetails(order.orderCode);
      expect(updatedOrder?.status).toBe(OrderStatus.PAID);
      expect(updatedOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);

      // 2 keys delivered from supplier
      expect(updatedOrder?.deliveredItems).toHaveLength(2);
      expect(mockAdapter.getPurchaseLog()).toHaveLength(1);
      expect(mockAdapter.getPurchaseLog()[0].quantity).toBe(2);

      // Supplier stock decremented by 2 (100 - 2 = 98)
      const mapping = await prisma.supplierProductMapping.findUnique({
        where: { productId: testDropshipProductId },
      });
      expect(mapping?.supplierStock).toBe(98);
    });
  });

  describe("Scenario C: Late Warehouse Stock Inflow Before Upstream Fulfillment", () => {
    it("consumes unreserved available warehouse keys in fulfillOrderViaUpstream before calling supplier", async () => {
      // Create order with 0 warehouse stock
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 2 }],
      });

      // Before fulfillment runs, admin imports 2 keys into warehouse
      await prisma.productItem.createMany({
        data: [
          { productId: testDropshipProductId, secretContent: "WH-LATE-ARRIVAL-1", status: ItemStatus.AVAILABLE },
          { productId: testDropshipProductId, secretContent: "WH-LATE-ARRIVAL-2", status: ItemStatus.AVAILABLE },
        ],
      });

      // Mark order PAID directly to simulate external payment
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      // Call fulfillOrderViaUpstream directly
      const result = await fulfillOrderViaUpstream(order.id);
      expect(result.success).toBe(true);
      expect(result.status).toBe(UpstreamStatus.COMPLETED);

      // External supplier was NOT called because late-arriving warehouse stock fulfilled it!
      expect(mockAdapter.getPurchaseLog()).toHaveLength(0);

      // Check delivered items
      const updatedOrder = await getOrderDetails(order.orderCode);
      const deliveredContents = updatedOrder?.deliveredItems.map((i) => i.secretContent).sort();
      expect(deliveredContents).toEqual(["WH-LATE-ARRIVAL-1", "WH-LATE-ARRIVAL-2"]);
    });
  });

  describe("Scenario D: 1-Click Wallet Checkout with Warehouse Stock Prioritization", () => {
    it("fulfills from warehouse on wallet payment and marks upstream COMPLETED without calling supplier", async () => {
      // Seed 1 available key in warehouse
      await prisma.productItem.create({
        data: {
          productId: testDropshipProductId,
          secretContent: "WH-WALLET-KEY-1",
          status: ItemStatus.AVAILABLE,
        },
      });

      // User creates order for 1 key
      const order = await createOrder({
        userId: testUserId,
        customerEmail: TEST_USER_EMAIL,
        items: [{ productId: testDropshipProductId, quantity: 1 }],
      });

      // User pays via wallet balance
      const walletResult = await payOrderWithWallet(order.orderCode, testUserId);
      expect(walletResult.success).toBe(true);
      expect(walletResult.status).toBe(OrderStatus.PAID);

      const updatedOrder = await getOrderDetails(order.orderCode);
      expect(updatedOrder?.status).toBe(OrderStatus.PAID);
      expect(updatedOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);

      // Delivered item is the warehouse key
      expect(updatedOrder?.deliveredItems).toHaveLength(1);
      expect(updatedOrder?.deliveredItems[0].secretContent).toBe("WH-WALLET-KEY-1");

      // External supplier was NOT called
      expect(mockAdapter.getPurchaseLog()).toHaveLength(0);
    });
  });

  describe("Scenario E: Concurrency Race Guard for Dropship Product", () => {
    it("handles concurrent reservation race gracefully by falling back to upstream dropship when warehouse keys are claimed", async () => {
      // Seed 1 available key in warehouse
      await prisma.productItem.create({
        data: {
          productId: testDropshipProductId,
          secretContent: "WH-RACE-KEY-1",
          status: ItemStatus.AVAILABLE,
        },
      });

      // Simulate 2 concurrent order creations for 1 key each
      const [order1, order2] = await Promise.all([
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testDropshipProductId, quantity: 1 }],
        }),
        createOrder({
          customerEmail: TEST_CUSTOMER_EMAIL,
          items: [{ productId: testDropshipProductId, quantity: 1 }],
        }),
      ]);

      expect(order1).toBeDefined();
      expect(order2).toBeDefined();
      expect(order1.id).not.toBe(order2.id);

      // Verify that exactly 1 item was reserved in warehouse between the two orders
      const reservedCount = await prisma.productItem.count({
        where: {
          productId: testDropshipProductId,
          status: ItemStatus.RESERVED,
        },
      });
      expect(reservedCount).toBe(1);

      // Verify that one order holds the reservation and the other has 0 reserved items
      const order1Reserved = await prisma.productItem.count({
        where: { orderId: order1.id, status: ItemStatus.RESERVED },
      });
      const order2Reserved = await prisma.productItem.count({
        where: { orderId: order2.id, status: ItemStatus.RESERVED },
      });
      expect(order1Reserved + order2Reserved).toBe(1);

      // Both orders can be paid and fulfilled cleanly:
      const pay1 = await handleIncomingTransaction({
        transactionId: `WH_TEST_TX_${Date.now()}_E1`,
        amount: order1.totalAmount,
        content: `WH_TEST ${order1.orderCode}`,
        bankCode: "MB",
      });
      const pay2 = await handleIncomingTransaction({
        transactionId: `WH_TEST_TX_${Date.now()}_E2`,
        amount: order2.totalAmount,
        content: `WH_TEST ${order2.orderCode}`,
        bankCode: "MB",
      });

      expect(pay1.success).toBe(true);
      expect(pay2.success).toBe(true);

      const updated1 = await getOrderDetails(order1.orderCode);
      const updated2 = await getOrderDetails(order2.orderCode);
      expect(updated1?.status).toBe(OrderStatus.PAID);
      expect(updated2?.status).toBe(OrderStatus.PAID);
      expect(updated1?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(updated2?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);

      // Mock supplier adapter was called exactly once for the order that didn't get the warehouse key
      expect(mockAdapter.getPurchaseLog()).toHaveLength(1);
      expect(mockAdapter.getPurchaseLog()[0].quantity).toBe(1);
    });
  });
});
