import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  prisma,
  SupplierType,
  MarkupType,
  UpstreamStatus,
  OrderStatus,
  FulfillmentType,
} from "@/lib/prisma";
import { MockSupplierAdapter } from "@/services/suppliers/adapters/mock.adapter";
import {
  registerSupplierAdapter,
  resetAdapterRegistry,
} from "@/services/suppliers/adapter.registry";
import {
  getAllOrdersAdmin,
  getAdminOrders,
} from "@/services/admin.service";

// Route handlers to test
import {
  GET as getSuppliers,
  POST as createSupplier,
} from "@/app/api/admin/suppliers/route";
import {
  GET as getSupplierById,
  PUT as updateSupplier,
  DELETE as deleteSupplier,
} from "@/app/api/admin/suppliers/[id]/route";
import { POST as checkBalance } from "@/app/api/admin/suppliers/[id]/balance/route";
import { POST as syncSuppliers } from "@/app/api/admin/suppliers/sync/route";
import { POST as retryOrderUpstream } from "@/app/api/admin/orders/[orderId]/retry-upstream/route";

describe("Admin Suppliers & Mapping Dashboard API Endpoints", () => {
  const TEST_SUPPLIER_CODE_1 = "TEST_ADMIN_SUP_01";
  const TEST_SUPPLIER_CODE_2 = "TEST_ADMIN_SUP_02";
  const TEST_CAT_SLUG = "test-admin-sup-cat";
  const TEST_PROD_SLUG = "test-admin-sup-prod";
  const TEST_ORDER_CODE = "TEST_ADMIN_ORD_RETRY_01";

  let mockAdapter: MockSupplierAdapter;
  let testCategoryId: string;
  let testProductId: string;
  let testSupplierId: string;
  let testMappingId: string;
  let testOrderId: string;

  beforeAll(async () => {
    // Clean up residual test data
    await prisma.supplierProductMapping.deleteMany({
      where: {
        OR: [
          { supplier: { code: { in: [TEST_SUPPLIER_CODE_1, TEST_SUPPLIER_CODE_2] } } },
          { product: { slug: TEST_PROD_SLUG } },
        ],
      },
    }).catch(() => {});

    await prisma.orderItem.deleteMany({
      where: { order: { orderCode: TEST_ORDER_CODE } },
    }).catch(() => {});

    await prisma.order.deleteMany({
      where: { orderCode: TEST_ORDER_CODE },
    }).catch(() => {});

    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    }).catch(() => {});

    await prisma.supplier.deleteMany({
      where: { code: { in: [TEST_SUPPLIER_CODE_1, TEST_SUPPLIER_CODE_2] } },
    }).catch(() => {});

    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    }).catch(() => {});

    // Create category and product
    const category = await prisma.category.create({
      data: {
        name: "Test Admin Sup Category",
        slug: TEST_CAT_SLUG,
        description: "Category for admin supplier tests",
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Test Dropship Product",
        slug: TEST_PROD_SLUG,
        description: "Test Product Description",
        price: 120000,
        type: "LICENSE_KEY",
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        categoryId: testCategoryId,
      },
    });
    testProductId = product.id;
  });

  beforeEach(() => {
    resetAdapterRegistry();
    mockAdapter = new MockSupplierAdapter();
    mockAdapter.setBalance(750000);
    mockAdapter.setProduct("NETFLIX_PREMIUM_1M", {
      price: 65000,
      inStock: 25,
      name: "Netflix Premium 1 Tháng",
    });
    registerSupplierAdapter(SupplierType.CUSTOM_REST, mockAdapter);
    registerSupplierAdapter(SupplierType.TAPHOAMMO, mockAdapter);
    registerSupplierAdapter(SupplierType.TRUMTHE, mockAdapter);
  });

  afterAll(async () => {
    resetAdapterRegistry();

    await prisma.supplierProductMapping.deleteMany({
      where: {
        OR: [
          { supplier: { code: { in: [TEST_SUPPLIER_CODE_1, TEST_SUPPLIER_CODE_2] } } },
          { product: { slug: TEST_PROD_SLUG } },
        ],
      },
    }).catch(() => {});

    await prisma.orderItem.deleteMany({
      where: { order: { orderCode: TEST_ORDER_CODE } },
    }).catch(() => {});

    await prisma.order.deleteMany({
      where: { orderCode: TEST_ORDER_CODE },
    }).catch(() => {});

    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    }).catch(() => {});

    await prisma.supplier.deleteMany({
      where: { code: { in: [TEST_SUPPLIER_CODE_1, TEST_SUPPLIER_CODE_2] } },
    }).catch(() => {});

    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    }).catch(() => {});

    await prisma.$disconnect();
  });

  describe("1. Suppliers CRUD API: /api/admin/suppliers and [id]", () => {
    it("POST /api/admin/suppliers: creates a new supplier with validation", async () => {
      // 1. Missing required field validation
      const badReq = new Request("http://localhost/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Incomplete Supplier" }),
      });
      const badRes = await createSupplier(badReq as any);
      expect(badRes.status).toBe(400);

      // 2. Successful creation
      const goodReq = new Request("http://localhost/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Taphoammo Supplier",
          code: TEST_SUPPLIER_CODE_1,
          type: SupplierType.TAPHOAMMO,
          baseUrl: "https://api.taphoammo.net",
          apiKey: "test_api_key_123",
          apiSecret: "test_secret_456",
          isActive: true,
        }),
      });
      const goodRes = await createSupplier(goodReq as any);
      expect(goodRes.status).toBe(201);
      const data = await goodRes.json();
      expect(data.success).toBe(true);
      expect(data.supplier).toBeDefined();
      expect(data.supplier.code).toBe(TEST_SUPPLIER_CODE_1);
      expect(data.supplier.name).toBe("Test Taphoammo Supplier");
      testSupplierId = data.supplier.id;
    });

    it("GET /api/admin/suppliers: returns all suppliers with mappings and products", async () => {
      // Create a mapping to verify relation inclusion
      const mapping = await prisma.supplierProductMapping.create({
        data: {
          productId: testProductId,
          supplierId: testSupplierId,
          supplierProductCode: "NETFLIX_PREMIUM_1M",
          supplierPrice: 65000,
          markupType: MarkupType.PERCENTAGE,
          markupValue: 25,
          isAutoSync: true,
        },
      });
      testMappingId = mapping.id;

      const req = new Request("http://localhost/api/admin/suppliers");
      const res = await getSuppliers(req as any);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.suppliers)).toBe(true);

      const found = data.suppliers.find((s: any) => s.id === testSupplierId);
      expect(found).toBeDefined();
      expect(found.mappings).toBeDefined();
      expect(found.mappings.length).toBeGreaterThanOrEqual(1);
      expect(found.mappings[0].product).toBeDefined();
      expect(found.mappings[0].product.id).toBe(testProductId);
    });

    it("GET /api/admin/suppliers/[id]: returns single supplier with details", async () => {
      const res = await getSupplierById(new Request(`http://localhost/api/admin/suppliers/${testSupplierId}`) as any, {
        params: { id: testSupplierId },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.supplier.id).toBe(testSupplierId);
      expect(data.supplier.mappings).toBeDefined();
    });

    it("PUT /api/admin/suppliers/[id]: updates supplier information or status", async () => {
      const updateReq = new Request(`http://localhost/api/admin/suppliers/${testSupplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Supplier Name",
          isActive: false,
        }),
      });
      const res = await updateSupplier(updateReq as any, {
        params: { id: testSupplierId },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.supplier.name).toBe("Updated Supplier Name");
      expect(data.supplier.isActive).toBe(false);

      // Re-enable for subsequent tests
      await prisma.supplier.update({
        where: { id: testSupplierId },
        data: { isActive: true },
      });
    });

    it("DELETE /api/admin/suppliers/[id]: deletes a supplier", async () => {
      // Create temporary supplier to delete
      const tempSupplier = await prisma.supplier.create({
        data: {
          name: "Temporary Supplier",
          code: TEST_SUPPLIER_CODE_2,
          type: SupplierType.CUSTOM_REST,
          baseUrl: "https://example.com/api",
          apiKey: "temp_key",
        },
      });

      const delReq = new Request(`http://localhost/api/admin/suppliers/${tempSupplier.id}`, {
        method: "DELETE",
      });
      const res = await deleteSupplier(delReq as any, {
        params: { id: tempSupplier.id },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const check = await prisma.supplier.findUnique({
        where: { id: tempSupplier.id },
      });
      expect(check).toBeNull();
    });
  });

  describe("2. Supplier Balance API: /api/admin/suppliers/[id]/balance", () => {
    it("POST /api/admin/suppliers/[id]/balance: checks balance via adapter and updates DB", async () => {
      mockAdapter.setBalance(985000);

      const req = new Request(`http://localhost/api/admin/suppliers/${testSupplierId}/balance`, {
        method: "POST",
      });
      const res = await checkBalance(req as any, {
        params: { id: testSupplierId },
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.balance).toBe(985000);

      // Verify DB update
      const supplierInDb = await prisma.supplier.findUnique({
        where: { id: testSupplierId },
      });
      expect(supplierInDb?.currentBalance).toBe(985000);
    });

    it("POST /api/admin/suppliers/[id]/balance: returns 404 for non-existent supplier", async () => {
      const req = new Request("http://localhost/api/admin/suppliers/non-existent-id/balance", {
        method: "POST",
      });
      const res = await checkBalance(req as any, {
        params: { id: "non-existent-id" },
      });
      expect(res.status).toBe(404);
    });
  });

  describe("3. Sync Suppliers API: /api/admin/suppliers/sync", () => {
    it("POST /api/admin/suppliers/sync with mappingId: syncs single product price and stock", async () => {
      mockAdapter.setProduct("NETFLIX_PREMIUM_1M", {
        price: 70000,
        inStock: 10,
      });

      const req = new Request("http://localhost/api/admin/suppliers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappingId: testMappingId }),
      });

      const res = await syncSuppliers(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.result.supplierPrice).toBe(70000);

      // Verify DB
      const updatedMapping = await prisma.supplierProductMapping.findUnique({
        where: { id: testMappingId },
      });
      expect(updatedMapping?.supplierPrice).toBe(70000);
    });

    it("POST /api/admin/suppliers/sync without body: triggers bulk sync for all active suppliers", async () => {
      const req = new Request("http://localhost/api/admin/suppliers/sync", {
        method: "POST",
      });

      const res = await syncSuppliers(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.result.syncedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. Order Retry Upstream API: /api/admin/orders/[orderId]/retry-upstream", () => {
    beforeAll(async () => {
      // Create a paid order in FAILED upstreamStatus
      const order = await prisma.order.create({
        data: {
          orderCode: TEST_ORDER_CODE,
          customerEmail: "retry-customer@example.com",
          totalAmount: 120000,
          status: OrderStatus.PAID,
          upstreamStatus: UpstreamStatus.FAILED,
          upstreamError: "Previous network timeout",
          refundInfo: JSON.stringify({
            bankName: "MBBank",
            accountNumber: "0987654321",
            accountName: "NGUYEN VAN RETRY",
            requestedAt: new Date().toISOString(),
          }),
          expiresAt: new Date(Date.now() + 3600000),
          paidAt: new Date(),
          orderItems: {
            create: {
              productId: testProductId,
              price: 120000,
              quantity: 1,
            },
          },
        },
      });
      testOrderId = order.id;
    });

    it("POST /api/admin/orders/[orderId]/retry-upstream: successfully retries fulfillment", async () => {
      mockAdapter.setProduct("NETFLIX_PREMIUM_1M", {
        price: 65000,
        inStock: 25,
        keys: ["KEY-RETRY-SUCCESS-12345"],
      });

      const req = new Request(`http://localhost/api/admin/orders/${testOrderId}/retry-upstream`, {
        method: "POST",
      });

      const res = await retryOrderUpstream(req as any, {
        params: { orderId: testOrderId },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe(UpstreamStatus.COMPLETED);
      expect(data.upstreamOrderId).toContain("TEST_ADMIN_ORD_RETRY_01");

      // Verify order updated in DB
      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrderId },
        include: { deliveredItems: true },
      });
      expect(updatedOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(updatedOrder?.upstreamOrderId).toContain("TEST_ADMIN_ORD_RETRY_01");
      expect(updatedOrder?.upstreamError).toBeNull();
      expect(updatedOrder?.deliveredItems.length).toBe(1);
    });

    it("POST /api/admin/orders/[orderId]/retry-upstream: returns 404 for non-existent order", async () => {
      const req = new Request("http://localhost/api/admin/orders/non-existent-order-id/retry-upstream", {
        method: "POST",
      });
      const res = await retryOrderUpstream(req as any, {
        params: { orderId: "non-existent-order-id" },
      });
      expect(res.status).toBe(404);
    });
  });

  describe("5. Admin Service: Order Details Query Integration", () => {
    it("getAllOrdersAdmin & getAdminOrders include upstreamStatus, upstreamOrderId, upstreamError, and refundInfo", async () => {
      const orders = await getAllOrdersAdmin();
      expect(Array.isArray(orders)).toBe(true);

      const targetOrder = orders.find((o) => o.id === testOrderId);
      expect(targetOrder).toBeDefined();
      expect(targetOrder?.upstreamStatus).toBe(UpstreamStatus.COMPLETED);
      expect(targetOrder?.upstreamOrderId).toContain("TEST_ADMIN_ORD_RETRY_01");
      expect(targetOrder?.upstreamError).toBeNull();
      expect(targetOrder?.refundInfo).toBeDefined();

      const aliasedOrders = await getAdminOrders();
      expect(Array.isArray(aliasedOrders)).toBe(true);
      expect(aliasedOrders.some((o) => o.id === testOrderId)).toBe(true);
    });
  });
});
