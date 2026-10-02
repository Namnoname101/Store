import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ItemStatus } from "@/lib/prisma";
import {
  getCategoriesWithProducts,
  getProductBySlug,
} from "@/services/catalog.service";

describe("Catalog Service", () => {
  const TEST_CAT_SOFTWARE = "test-cat-software";
  const TEST_CAT_GAMES = "test-cat-games";
  const TEST_PROD_WIN = "test-win11-pro";
  const TEST_PROD_OFFICE = "test-office-365";
  const TEST_PROD_GAME = "test-steam-wallet";
  const TEST_PROD_INACTIVE = "test-inactive-soft";

  let catSoftwareId: string;
  let catGamesId: string;
  let prodWinId: string;
  let prodOfficeId: string;
  let prodGameId: string;
  let prodInactiveId: string;

  beforeAll(async () => {
    // 1. Clean up residual test data
    const slugs = [
      TEST_PROD_WIN,
      TEST_PROD_OFFICE,
      TEST_PROD_GAME,
      TEST_PROD_INACTIVE,
    ];
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: slugs } },
    });
    await prisma.category.deleteMany({
      where: { slug: { in: [TEST_CAT_SOFTWARE, TEST_CAT_GAMES] } },
    });

    // 2. Create test categories
    const catSoftware = await prisma.category.create({
      data: {
        name: "Test Software",
        slug: TEST_CAT_SOFTWARE,
        description: "Operating systems and productivity tools",
      },
    });
    catSoftwareId = catSoftware.id;

    const catGames = await prisma.category.create({
      data: {
        name: "Test Games",
        slug: TEST_CAT_GAMES,
        description: "Gaming codes and cards",
      },
    });
    catGamesId = catGames.id;

    // 3. Create test products
    const prodWin = await prisma.product.create({
      data: {
        title: "Windows 11 Professional License Key",
        slug: TEST_PROD_WIN,
        description: "Genuine OEM activation key for Windows 11 Pro",
        price: 180000,
        originalPrice: 250000,
        type: "LICENSE_KEY",
        categoryId: catSoftwareId,
        isActive: true,
      },
    });
    prodWinId = prodWin.id;

    const prodOffice = await prisma.product.create({
      data: {
        title: "Microsoft 365 Family Subscription",
        slug: TEST_PROD_OFFICE,
        description: "Office 365 cloud account 1 year",
        price: 320000,
        originalPrice: 450000,
        type: "ACCOUNT",
        categoryId: catSoftwareId,
        isActive: true,
      },
    });
    prodOfficeId = prodOffice.id;

    const prodGame = await prisma.product.create({
      data: {
        title: "Steam Wallet Card 200k",
        slug: TEST_PROD_GAME,
        description: "Redeem code for Steam Vietnam",
        price: 200000,
        type: "LICENSE_KEY",
        categoryId: catGamesId,
        isActive: true,
      },
    });
    prodGameId = prodGame.id;

    const prodInactive = await prisma.product.create({
      data: {
        title: "Discontinued Software Tool",
        slug: TEST_PROD_INACTIVE,
        description: "This item should not appear in catalog",
        price: 50000,
        type: "LICENSE_KEY",
        categoryId: catSoftwareId,
        isActive: false,
      },
    });
    prodInactiveId = prodInactive.id;

    // 4. Seed ProductItems for stock calculation
    // Windows: 2 AVAILABLE, 1 RESERVED, 1 SOLD -> stockCount should be 2
    await prisma.productItem.createMany({
      data: [
        { productId: prodWinId, secretContent: "WIN-KEY-1", status: ItemStatus.AVAILABLE },
        { productId: prodWinId, secretContent: "WIN-KEY-2", status: ItemStatus.AVAILABLE },
        { productId: prodWinId, secretContent: "WIN-KEY-3", status: ItemStatus.RESERVED },
        { productId: prodWinId, secretContent: "WIN-KEY-4", status: ItemStatus.SOLD },
      ],
    });

    // Office: 0 AVAILABLE (out of stock)
    await prisma.productItem.createMany({
      data: [
        { productId: prodOfficeId, secretContent: "OFFICE-ACC-1", status: ItemStatus.SOLD },
      ],
    });

    // Steam Wallet: 3 AVAILABLE -> stockCount should be 3
    await prisma.productItem.createMany({
      data: [
        { productId: prodGameId, secretContent: "STEAM-1", status: ItemStatus.AVAILABLE },
        { productId: prodGameId, secretContent: "STEAM-2", status: ItemStatus.AVAILABLE },
        { productId: prodGameId, secretContent: "STEAM-3", status: ItemStatus.AVAILABLE },
      ],
    });

    // Inactive product: 5 AVAILABLE but inactive
    await prisma.productItem.createMany({
      data: [
        { productId: prodInactiveId, secretContent: "INACTIVE-1", status: ItemStatus.AVAILABLE },
      ],
    });
  });

  afterAll(async () => {
    const slugs = [
      TEST_PROD_WIN,
      TEST_PROD_OFFICE,
      TEST_PROD_GAME,
      TEST_PROD_INACTIVE,
    ];
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: slugs } },
    });
    await prisma.category.deleteMany({
      where: { slug: { in: [TEST_CAT_SOFTWARE, TEST_CAT_GAMES] } },
    });
  });

  describe("getCategoriesWithProducts", () => {
    it("should return categories with active products and accurate available stock counts", async () => {
      const categories = await getCategoriesWithProducts();
      
      const softwareCategory = categories.find((c) => c.slug === TEST_CAT_SOFTWARE);
      expect(softwareCategory).toBeDefined();

      // Check products in softwareCategory
      const winProd = softwareCategory?.products.find((p) => p.slug === TEST_PROD_WIN);
      expect(winProd).toBeDefined();
      expect(winProd?.stockCount).toBe(2);

      const officeProd = softwareCategory?.products.find((p) => p.slug === TEST_PROD_OFFICE);
      expect(officeProd).toBeDefined();
      expect(officeProd?.stockCount).toBe(0);

      // Inactive product must NOT be returned
      const inactiveProd = softwareCategory?.products.find((p) => p.slug === TEST_PROD_INACTIVE);
      expect(inactiveProd).toBeUndefined();

      // Games category
      const gamesCategory = categories.find((c) => c.slug === TEST_CAT_GAMES);
      expect(gamesCategory).toBeDefined();
      const gameProd = gamesCategory?.products.find((p) => p.slug === TEST_PROD_GAME);
      expect(gameProd).toBeDefined();
      expect(gameProd?.stockCount).toBe(3);
    });

    it("should filter categories and products by categorySlug", async () => {
      const filtered = await getCategoriesWithProducts(TEST_CAT_GAMES);
      expect(filtered.length).toBe(1);
      expect(filtered[0].slug).toBe(TEST_CAT_GAMES);
      expect(filtered[0].products.some((p) => p.slug === TEST_PROD_GAME)).toBe(true);
      expect(filtered[0].products.some((p) => p.slug === TEST_PROD_WIN)).toBe(false);
    });

    it("should filter products by search term across title and description", async () => {
      const searchResults = await getCategoriesWithProducts(undefined, "Windows");
      const softwareCategory = searchResults.find((c) => c.slug === TEST_CAT_SOFTWARE);
      expect(softwareCategory).toBeDefined();

      const prodSlugs = softwareCategory?.products.map((p) => p.slug);
      expect(prodSlugs).toContain(TEST_PROD_WIN);
      expect(prodSlugs).not.toContain(TEST_PROD_OFFICE);
      expect(prodSlugs).not.toContain(TEST_PROD_GAME);
    });

    it("should filter products by both categorySlug and search term", async () => {
      const results = await getCategoriesWithProducts(TEST_CAT_GAMES, "Steam");
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe(TEST_CAT_GAMES);
      expect(results[0].products.length).toBe(1);
      expect(results[0].products[0].slug).toBe(TEST_PROD_GAME);

      // Search non-existent term in Games
      const noResults = await getCategoriesWithProducts(TEST_CAT_GAMES, "NonExistentKeyword");
      const totalProducts = noResults.reduce((acc, cat) => acc + cat.products.length, 0);
      expect(totalProducts).toBe(0);
    });
  });

  describe("getProductBySlug", () => {
    it("should retrieve product details by slug including category and live stockCount", async () => {
      const product = await getProductBySlug(TEST_PROD_WIN);
      expect(product).not.toBeNull();
      expect(product?.title).toBe("Windows 11 Professional License Key");
      expect(product?.category).toBeDefined();
      expect(product?.category.slug).toBe(TEST_CAT_SOFTWARE);
      expect(product?.stockCount).toBe(2);
      expect(product?.price).toBe(180000);
      expect(product?.originalPrice).toBe(250000);
    });

    it("should return correct stockCount of 0 when no available items exist", async () => {
      const product = await getProductBySlug(TEST_PROD_OFFICE);
      expect(product).not.toBeNull();
      expect(product?.stockCount).toBe(0);
    });

    it("should return null for non-existent product slug", async () => {
      const product = await getProductBySlug("non-existent-product-slug");
      expect(product).toBeNull();
    });

    it("should return null for inactive products", async () => {
      const product = await getProductBySlug(TEST_PROD_INACTIVE);
      expect(product).toBeNull();
    });
  });
});
