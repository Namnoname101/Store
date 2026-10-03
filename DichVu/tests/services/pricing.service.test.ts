import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import {
  prisma,
  FulfillmentType,
  SupplierType,
  MarkupType,
} from "@/lib/prisma";
import {
  calculateRetailPrice,
  syncProductFromSupplier,
  syncAllActiveSuppliers,
  SyncProductResult,
  BulkSyncResult,
} from "@/services/pricing.service";
import { MockSupplierAdapter } from "@/services/suppliers/adapters/mock.adapter";
import {
  registerSupplierAdapter,
  resetAdapterRegistry,
} from "@/services/suppliers/adapter.registry";

describe("Dynamic Pricing & Auto Stock Sync Engine", () => {
  describe("calculateRetailPrice", () => {
    it("should calculate retail price with PERCENTAGE markup", () => {
      // 100,000 + 20% = 120,000
      const price1 = calculateRetailPrice(100000, MarkupType.PERCENTAGE, 20);
      expect(price1).toBe(120000);

      // 50,000 + 30% = 65,000
      const price2 = calculateRetailPrice(50000, MarkupType.PERCENTAGE, 30);
      expect(price2).toBe(65000);
    });

    it("should calculate retail price with FIXED_AMOUNT markup", () => {
      // 100,000 + 15,000 = 115,000
      const price1 = calculateRetailPrice(100000, MarkupType.FIXED_AMOUNT, 15000);
      expect(price1).toBe(115000);

      // 50,000 + 5,000 = 55,000
      const price2 = calculateRetailPrice(50000, MarkupType.FIXED_AMOUNT, 5000);
      expect(price2).toBe(55000);
    });

    it("should normalize and round retail price to the nearest 1,000 VND", () => {
      // 65,000 * 1.15 = 74,750 -> rounds to 75,000
      const price1 = calculateRetailPrice(65000, MarkupType.PERCENTAGE, 15);
      expect(price1).toBe(75000);

      // 65,000 * 1.12 = 72,800 -> rounds to 73,000
      const price2 = calculateRetailPrice(65000, MarkupType.PERCENTAGE, 12);
      expect(price2).toBe(73000);

      // 50,000 + 5,300 = 55,300 -> rounds to 55,000
      const price3 = calculateRetailPrice(50000, MarkupType.FIXED_AMOUNT, 5300);
      expect(price3).toBe(55000);

      // 50,000 + 5,800 = 55,800 -> rounds to 56,000
      const price4 = calculateRetailPrice(50000, MarkupType.FIXED_AMOUNT, 5800);
      expect(price4).toBe(56000);
    });

    it("should enforce Loss Prevention Guard: retail price must never be strictly less than supplierPrice", () => {
      // Negative percentage markup (-20%)
      const price1 = calculateRetailPrice(50000, MarkupType.PERCENTAGE, -20);
      expect(price1).toBeGreaterThanOrEqual(50000);
      expect(price1).toBe(50000);

      // Negative fixed markup (-10,000)
      const price2 = calculateRetailPrice(50000, MarkupType.FIXED_AMOUNT, -10000);
      expect(price2).toBeGreaterThanOrEqual(50000);
      expect(price2).toBe(50000);

      // Edge case: rounding down that would result in less than supplier price (50,400 with 0 markup rounds to 50,000)
      const price3 = calculateRetailPrice(50400, MarkupType.FIXED_AMOUNT, 0);
      expect(price3).toBeGreaterThanOrEqual(50400);
    });
  });

  describe("Product & Stock Synchronization", () => {
    let mockAdapter: MockSupplierAdapter;
    const TEST_SUPPLIER_CODE = "TEST_PRICING_SUPPLIER_01";
    const TEST_CATEGORY_SLUG = "test-pricing-category";
    const TEST_PRODUCT_SLUG_1 = "test-pricing-netflix";
    const TEST_PRODUCT_SLUG_2 = "test-pricing-spotify";
    const TEST_PRODUCT_SLUG_3 = "test-pricing-youtube";

    let supplierId: string;
    let categoryId: string;
    let productId1: string;
    let productId2: string;
    let productId3: string;
    let mappingId1: string;
    let mappingId2: string;
    let mappingId3: string;

    beforeAll(async () => {
      // Cleanup any residual data
      await prisma.supplierProductMapping.deleteMany({
        where: { supplier: { code: TEST_SUPPLIER_CODE } },
      }).catch(() => {});
      await prisma.supplier.deleteMany({
        where: { code: TEST_SUPPLIER_CODE },
      }).catch(() => {});
      await prisma.product.deleteMany({
        where: { slug: { in: [TEST_PRODUCT_SLUG_1, TEST_PRODUCT_SLUG_2, TEST_PRODUCT_SLUG_3] } },
      }).catch(() => {});
      await prisma.category.deleteMany({
        where: { slug: TEST_CATEGORY_SLUG },
      }).catch(() => {});

      // Setup Category
      const cat = await prisma.category.create({
        data: {
          name: "Test Pricing Category",
          slug: TEST_CATEGORY_SLUG,
        },
      });
      categoryId = cat.id;

      // Setup Supplier
      const sup = await prisma.supplier.create({
        data: {
          name: "Test Pricing Supplier",
          code: TEST_SUPPLIER_CODE,
          type: SupplierType.CUSTOM_REST,
          baseUrl: "https://mock.pricing.supplier.example",
          apiKey: "test-pricing-key",
          currentBalance: 500000,
          isActive: true,
        },
      });
      supplierId = sup.id;

      // Product 1: Normal active dropship product (Percentage markup)
      const prod1 = await prisma.product.create({
        data: {
          title: "Test Netflix Pricing",
          slug: TEST_PRODUCT_SLUG_1,
          description: "Test description",
          price: 60000,
          categoryId,
          fulfillmentType: FulfillmentType.API_DROPSHIP,
          isActive: true,
        },
      });
      productId1 = prod1.id;

      const map1 = await prisma.supplierProductMapping.create({
        data: {
          productId: prod1.id,
          supplierId,
          supplierProductCode: "NETFLIX_MOCK_01",
          supplierPrice: 50000,
          markupType: MarkupType.PERCENTAGE,
          markupValue: 20, // 20%
          isAutoSync: true,
        },
      });
      mappingId1 = map1.id;

      // Product 2: Fixed amount markup product
      const prod2 = await prisma.product.create({
        data: {
          title: "Test Spotify Pricing",
          slug: TEST_PRODUCT_SLUG_2,
          description: "Test description",
          price: 45000,
          categoryId,
          fulfillmentType: FulfillmentType.API_DROPSHIP,
          isActive: true,
        },
      });
      productId2 = prod2.id;

      const map2 = await prisma.supplierProductMapping.create({
        data: {
          productId: prod2.id,
          supplierId,
          supplierProductCode: "SPOTIFY_MOCK_02",
          supplierPrice: 30000,
          markupType: MarkupType.FIXED_AMOUNT,
          markupValue: 15000, // +15,000 VND
          isAutoSync: true,
        },
      });
      mappingId2 = map2.id;

      // Product 3: Auto-sync disabled product
      const prod3 = await prisma.product.create({
        data: {
          title: "Test YouTube Pricing (Manual)",
          slug: TEST_PRODUCT_SLUG_3,
          description: "Test description",
          price: 70000,
          categoryId,
          fulfillmentType: FulfillmentType.API_DROPSHIP,
          isActive: true,
        },
      });
      productId3 = prod3.id;

      const map3 = await prisma.supplierProductMapping.create({
        data: {
          productId: prod3.id,
          supplierId,
          supplierProductCode: "YOUTUBE_MOCK_03",
          supplierPrice: 50000,
          markupType: MarkupType.PERCENTAGE,
          markupValue: 25,
          isAutoSync: false, // Disabled
        },
      });
      mappingId3 = map3.id;
    });

    afterAll(async () => {
      await prisma.supplierProductMapping.deleteMany({
        where: { supplier: { code: TEST_SUPPLIER_CODE } },
      }).catch(() => {});
      await prisma.supplier.deleteMany({
        where: { code: TEST_SUPPLIER_CODE },
      }).catch(() => {});
      await prisma.product.deleteMany({
        where: { slug: { in: [TEST_PRODUCT_SLUG_1, TEST_PRODUCT_SLUG_2, TEST_PRODUCT_SLUG_3] } },
      }).catch(() => {});
      await prisma.category.deleteMany({
        where: { slug: TEST_CATEGORY_SLUG },
      }).catch(() => {});
      await prisma.$disconnect();
    });

    beforeEach(() => {
      mockAdapter = new MockSupplierAdapter();
      registerSupplierAdapter(SupplierType.CUSTOM_REST, mockAdapter);
    });

    afterEach(() => {
      resetAdapterRegistry();
    });

    it("should synchronize product from supplier and update mapping & product price", async () => {
      mockAdapter.setProduct("NETFLIX_MOCK_01", {
        name: "Netflix 1 Month Live",
        price: 55000, // Upstream supplier price increased from 50,000 to 55,000
        inStock: 25,
      });

      const result: SyncProductResult = await syncProductFromSupplier(mappingId1);

      expect(result.success).toBe(true);
      expect(result.mappingId).toBe(mappingId1);
      expect(result.productId).toBe(productId1);
      expect(result.newSupplierPrice).toBe(55000);
      // 55,000 + 20% = 66,000
      expect(result.newRetailPrice).toBe(66000);
      expect(result.inStock).toBe(25);
      expect(result.isActive).toBe(true);
      expect(result.isPaused).toBe(false);

      // Verify database state
      const dbMapping = await prisma.supplierProductMapping.findUnique({
        where: { id: mappingId1 },
      });
      expect(dbMapping?.supplierPrice).toBe(55000);
      expect(dbMapping?.lastSyncAt).toBeInstanceOf(Date);

      const dbProduct = await prisma.product.findUnique({
        where: { id: productId1 },
      });
      expect(dbProduct?.price).toBe(66000);
      expect(dbProduct?.isActive).toBe(true);
    });

    it("should handle price spike safety by updating retail price to avoid selling at a loss", async () => {
      // Huge price spike: supplier price shoots up to 120,000
      mockAdapter.setProduct("NETFLIX_MOCK_01", {
        name: "Netflix 1 Month Live Spiked",
        price: 120000,
        inStock: 10,
      });

      const result = await syncProductFromSupplier(mappingId1);

      // 120,000 + 20% = 144,000
      expect(result.newSupplierPrice).toBe(120000);
      expect(result.newRetailPrice).toBe(144000);
      expect(result.newRetailPrice).toBeGreaterThan(result.newSupplierPrice);

      const dbProduct = await prisma.product.findUnique({
        where: { id: productId1 },
      });
      expect(dbProduct?.price).toBe(144000);
    });

    it("should auto-pause product (isActive = false) when supplier stock is 0", async () => {
      mockAdapter.setProduct("SPOTIFY_MOCK_02", {
        name: "Spotify Premium",
        price: 32000,
        inStock: 0, // Out of stock
      });

      const result = await syncProductFromSupplier(mappingId2);

      expect(result.inStock).toBe(0);
      expect(result.isActive).toBe(false);
      expect(result.isPaused).toBe(true);

      const dbProduct = await prisma.product.findUnique({
        where: { id: productId2 },
      });
      expect(dbProduct?.isActive).toBe(false);
    });

    it("should re-activate product (isActive = true) when supplier stock replenishes", async () => {
      // Ensure product is currently inactive
      await prisma.product.update({
        where: { id: productId2 },
        data: { isActive: false },
      });

      // Supplier now has 15 items in stock
      mockAdapter.setProduct("SPOTIFY_MOCK_02", {
        name: "Spotify Premium",
        price: 30000,
        inStock: 15,
      });

      const result = await syncProductFromSupplier(mappingId2);

      expect(result.inStock).toBe(15);
      expect(result.isActive).toBe(true);
      expect(result.isPaused).toBe(false);

      const dbProduct = await prisma.product.findUnique({
        where: { id: productId2 },
      });
      expect(dbProduct?.isActive).toBe(true);
    });

    it("should throw error if mapping does not exist", async () => {
      await expect(
        syncProductFromSupplier("non-existent-mapping-id")
      ).rejects.toThrow(/mapping not found/i);
    });

    describe("syncAllActiveSuppliers", () => {
      it("should sync only active mappings from active suppliers and report bulk results", async () => {
        // Setup mock stock and prices
        mockAdapter.setProduct("NETFLIX_MOCK_01", {
          name: "Netflix Premium",
          price: 50000,
          inStock: 10,
        });
        mockAdapter.setProduct("SPOTIFY_MOCK_02", {
          name: "Spotify Premium",
          price: 35000,
          inStock: 0, // Should be paused
        });

        const bulkResult: BulkSyncResult = await syncAllActiveSuppliers();

        // Mapping 1 & Mapping 2 have isAutoSync: true, Mapping 3 has isAutoSync: false
        expect(bulkResult.totalMappings).toBeGreaterThanOrEqual(2);
        expect(bulkResult.syncedCount).toBeGreaterThanOrEqual(2);
        // Verify mapping 1 and mapping 2 specifically had no errors
        const relevantErrors = bulkResult.errors.filter(
          (e) => e.mappingId === mappingId1 || e.mappingId === mappingId2
        );
        expect(relevantErrors).toEqual([]);

        // Verify mapping 3 was untouched
        const untouchedMapping = await prisma.supplierProductMapping.findUnique({
          where: { id: mappingId3 },
        });
        expect(untouchedMapping?.supplierPrice).toBe(50000);
      });

      it("should gracefully handle and collect errors without stopping remaining syncs", async () => {
        // Configure mockAdapter to throw network error
        mockAdapter.simulateError("NETWORK_ERROR");

        const bulkResult = await syncAllActiveSuppliers();

        expect(bulkResult.totalMappings).toBeGreaterThanOrEqual(2);
        expect(bulkResult.errors.length).toBeGreaterThanOrEqual(1);
        expect(bulkResult.errors[0]).toHaveProperty("mappingId");
        expect(bulkResult.errors[0]).toHaveProperty("error");
      });
    });
  });
});
