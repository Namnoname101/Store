import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  FulfillmentType,
  SupplierType,
  MarkupType,
  UpstreamStatus,
} from "../src/lib/prisma";

describe("Suppliers & Dropshipping Mappings Database Schema", () => {
  const TEST_SUPPLIER_CODE = "TEST_SUPPLIER_TAPHOA";
  const TEST_PRODUCT_SLUG = "test-dropship-netflix-premium";
  const TEST_CATEGORY_SLUG = "test-dropship-cat";
  const TEST_ORDER_CODE = "ORD_TEST_DS_001";

  beforeAll(async () => {
    // Cleanup prior test artifacts
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    }).catch(() => {});

    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    }).catch(() => {});

    await prisma.order.deleteMany({
      where: { orderCode: TEST_ORDER_CODE },
    }).catch(() => {});

    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    }).catch(() => {});

    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    }).catch(() => {});
  });

  afterAll(async () => {
    await prisma.supplierProductMapping.deleteMany({
      where: { supplier: { code: TEST_SUPPLIER_CODE } },
    }).catch(() => {});

    await prisma.supplier.deleteMany({
      where: { code: TEST_SUPPLIER_CODE },
    }).catch(() => {});

    await prisma.order.deleteMany({
      where: { orderCode: TEST_ORDER_CODE },
    }).catch(() => {});

    await prisma.product.deleteMany({
      where: { slug: TEST_PRODUCT_SLUG },
    }).catch(() => {});

    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    }).catch(() => {});

    await prisma.$disconnect();
  });

  it("should have valid enum constants in prisma.ts", () => {
    expect(FulfillmentType.LOCAL_STOCK).toBe("LOCAL_STOCK");
    expect(FulfillmentType.API_DROPSHIP).toBe("API_DROPSHIP");

    expect(SupplierType.TAPHOAMMO).toBe("TAPHOAMMO");
    expect(SupplierType.TRUMTHE).toBe("TRUMTHE");
    expect(SupplierType.CUSTOM_REST).toBe("CUSTOM_REST");

    expect(MarkupType.PERCENTAGE).toBe("PERCENTAGE");
    expect(MarkupType.FIXED_AMOUNT).toBe("FIXED_AMOUNT");

    expect(UpstreamStatus.NOT_APPLICABLE).toBe("NOT_APPLICABLE");
    expect(UpstreamStatus.PENDING_UPSTREAM).toBe("PENDING_UPSTREAM");
    expect(UpstreamStatus.COMPLETED).toBe("COMPLETED");
    expect(UpstreamStatus.FAILED).toBe("FAILED");
    expect(UpstreamStatus.REFUNDED).toBe("REFUNDED");
  });

  it("should create a Supplier record with defaults", async () => {
    const supplier = await prisma.supplier.create({
      data: {
        name: "Tạp Hóa MMO",
        code: TEST_SUPPLIER_CODE,
        type: SupplierType.TAPHOAMMO,
        baseUrl: "https://api.taphoammo.net",
        apiKey: "test_api_key_12345",
        apiSecret: "test_secret_67890",
        currentBalance: 500000,
      },
    });

    expect(supplier).toBeDefined();
    expect(supplier.id).toBeDefined();
    expect(supplier.code).toBe(TEST_SUPPLIER_CODE);
    expect(supplier.type).toBe("TAPHOAMMO");
    expect(supplier.isActive).toBe(true);
    expect(supplier.currentBalance).toBe(500000);
  });

  it("should verify default values for Supplier model", async () => {
    const defaultSupplierCode = "TEST_DEFAULT_SUPPLIER";
    const defaultSupplier = await prisma.supplier.create({
      data: {
        name: "Default Supplier",
        code: defaultSupplierCode,
        baseUrl: "https://supplier.example.com",
        apiKey: "key_xyz",
      },
    });

    expect(defaultSupplier.type).toBe("CUSTOM_REST");
    expect(defaultSupplier.currentBalance).toBe(0);
    expect(defaultSupplier.isActive).toBe(true);

    await prisma.supplier.delete({ where: { id: defaultSupplier.id } });
  });

  it("should create a Product with fulfillmentType and link SupplierProductMapping", async () => {
    const category = await prisma.category.create({
      data: {
        name: "Dropship Test Category",
        slug: TEST_CATEGORY_SLUG,
      },
    });

    const supplier = await prisma.supplier.findUnique({
      where: { code: TEST_SUPPLIER_CODE },
    });
    expect(supplier).not.toBeNull();

    // Create product with default LOCAL_STOCK
    const product = await prisma.product.create({
      data: {
        title: "Test Dropship Netflix Premium",
        slug: TEST_PRODUCT_SLUG,
        description: "Auto-fulfilled Netflix account",
        price: 65000,
        categoryId: category.id,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
      },
    });

    expect(product.fulfillmentType).toBe("API_DROPSHIP");

    // Create mapping
    const mapping = await prisma.supplierProductMapping.create({
      data: {
        productId: product.id,
        supplierId: supplier!.id,
        supplierProductCode: "NETFLIX_1M_4K",
        supplierPrice: 50000,
        markupType: MarkupType.PERCENTAGE,
        markupValue: 30, // 30%
      },
    });

    expect(mapping).toBeDefined();
    expect(mapping.supplierProductCode).toBe("NETFLIX_1M_4K");
    expect(mapping.supplierPrice).toBe(50000);
    expect(mapping.markupType).toBe("PERCENTAGE");
    expect(mapping.markupValue).toBe(30);
    expect(mapping.isAutoSync).toBe(true);

    // Verify relation navigation from product
    const productWithMapping = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        supplierMapping: {
          include: {
            supplier: true,
          },
        },
      },
    });

    expect(productWithMapping?.supplierMapping).toBeDefined();
    expect(productWithMapping?.supplierMapping?.supplier.code).toBe(TEST_SUPPLIER_CODE);
  });

  it("should verify default fulfillmentType on Product is LOCAL_STOCK", async () => {
    const category = await prisma.category.findUnique({
      where: { slug: TEST_CATEGORY_SLUG },
    });

    const localProduct = await prisma.product.create({
      data: {
        title: "Test Local Product",
        slug: "test-local-product-default",
        description: "Local stock product",
        price: 30000,
        categoryId: category!.id,
      },
    });

    expect(localProduct.fulfillmentType).toBe("LOCAL_STOCK");

    await prisma.product.delete({ where: { id: localProduct.id } });
  });

  it("should create an Order with upstream fields and check default upstreamStatus", async () => {
    const order = await prisma.order.create({
      data: {
        orderCode: TEST_ORDER_CODE,
        customerEmail: "customer@example.com",
        totalAmount: 65000,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        upstreamStatus: UpstreamStatus.PENDING_UPSTREAM,
        upstreamOrderId: "UPSTREAM-998811",
        upstreamError: null,
        refundInfo: "VCB 0123456789 - NGUYEN VAN A",
      },
    });

    expect(order).toBeDefined();
    expect(order.upstreamStatus).toBe("PENDING_UPSTREAM");
    expect(order.upstreamOrderId).toBe("UPSTREAM-998811");
    expect(order.refundInfo).toBe("VCB 0123456789 - NGUYEN VAN A");

    const defaultOrder = await prisma.order.create({
      data: {
        orderCode: "ORD_DEFAULT_STATUS",
        customerEmail: "default@example.com",
        totalAmount: 20000,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    expect(defaultOrder.upstreamStatus).toBe("NOT_APPLICABLE");
    expect(defaultOrder.upstreamOrderId).toBeNull();
    expect(defaultOrder.upstreamError).toBeNull();
    expect(defaultOrder.refundInfo).toBeNull();

    await prisma.order.delete({ where: { id: defaultOrder.id } });
  });
});
