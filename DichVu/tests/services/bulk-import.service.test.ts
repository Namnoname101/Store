import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ItemStatus } from "@/lib/prisma";
import {
  parseBulkKeys,
  importKeysForProduct,
} from "@/services/bulk-import.service";

describe("Bulk Import Service", () => {
  const TEST_CAT_SLUG = "test-bulk-import-category";
  const TEST_PROD_SLUG = "test-bulk-import-product";
  let testCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Clean up residual test data
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    // Create test category and product
    const category = await prisma.category.create({
      data: {
        name: "Test Bulk Category",
        slug: TEST_CAT_SLUG,
        description: "Category for bulk import tests",
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Test Bulk Product",
        slug: TEST_PROD_SLUG,
        description: "Product for bulk import tests",
        price: 100000,
        categoryId: testCategoryId,
        type: "LICENSE_KEY",
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  describe("parseBulkKeys", () => {
    it("splits standard newline separated keys and trims whitespace", () => {
      const input = "KEY-AAAA-1111\nKEY-BBBB-2222\nKEY-CCCC-3333";
      const result = parseBulkKeys(input);
      expect(result).toEqual([
        "KEY-AAAA-1111",
        "KEY-BBBB-2222",
        "KEY-CCCC-3333",
      ]);
    });

    it("handles CRLF (Windows) line breaks and dirty blank lines", () => {
      const input = "  KEY-ONE-1234   \r\n\r\n  \r\nKEY-TWO-5678\r\n\n\nKEY-THREE-9012  \r\n";
      const result = parseBulkKeys(input);
      expect(result).toEqual([
        "KEY-ONE-1234",
        "KEY-TWO-5678",
        "KEY-THREE-9012",
      ]);
    });

    it("returns empty array for empty or whitespace-only inputs", () => {
      expect(parseBulkKeys("")).toEqual([]);
      expect(parseBulkKeys("   \n   \r\n   ")).toEqual([]);
    });

    it("preserves formatted credentials like email|password and URL links", () => {
      const input = "netflix_user1@gmail.com|Password123!\r\nhttps://mega.nz/folder/abc#xyz123";
      const result = parseBulkKeys(input);
      expect(result).toEqual([
        "netflix_user1@gmail.com|Password123!",
        "https://mega.nz/folder/abc#xyz123",
      ]);
    });
  });

  describe("importKeysForProduct", () => {
    it("successfully creates ProductItem records with AVAILABLE status in batch", async () => {
      const rawText = `
        PROD-KEY-11111
        PROD-KEY-22222
        PROD-KEY-33333
      `;

      const response = await importKeysForProduct(testProductId, rawText);

      expect(response.count).toBe(3);
      expect(response.keys).toEqual([
        "PROD-KEY-11111",
        "PROD-KEY-22222",
        "PROD-KEY-33333",
      ]);

      // Verify in DB
      const itemsInDb = await prisma.productItem.findMany({
        where: {
          productId: testProductId,
          secretContent: {
            in: ["PROD-KEY-11111", "PROD-KEY-22222", "PROD-KEY-33333"],
          },
        },
      });

      expect(itemsInDb.length).toBe(3);
      itemsInDb.forEach((item) => {
        expect(item.status).toBe(ItemStatus.AVAILABLE);
        expect(item.orderId).toBeNull();
        expect(item.reservedUntil).toBeNull();
      });
    });

    it("throws an error when product does not exist", async () => {
      const nonExistentId = "non-existent-product-id-9999";
      await expect(
        importKeysForProduct(nonExistentId, "KEY-999-AAA")
      ).rejects.toThrow("Product not found");
    });

    it("throws an error when rawText contains no valid keys", async () => {
      await expect(
        importKeysForProduct(testProductId, "   \n\r\n   ")
      ).rejects.toThrow("No valid keys provided");
    });
  });
});
