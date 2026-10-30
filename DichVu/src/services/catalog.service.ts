import { prisma } from "@/lib/prisma";
import { getAvailableStockCount } from "@/services/inventory.service";
import { isDisallowedShortTermApiPackage } from "@/lib/catalog-grouping";
import type { Category, Product } from "@prisma/client";

export interface ProductWithStock extends Product {
  stockCount: number;
}

export interface CategoryWithProducts extends Category {
  products: ProductWithStock[];
}

export interface ProductDetail extends Product {
  category: Category;
  stockCount: number;
}

/**
 * Retrieves categories and their active products with live available stock counts.
 * Supports filtering by categorySlug and search text (title & description).
 */
export async function getCategoriesWithProducts(
  categorySlug?: string,
  search?: string
): Promise<CategoryWithProducts[]> {
  const productWhere: any = {
    isActive: true,
  };

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    productWhere.OR = [
      { title: { contains: trimmedSearch } },
      { description: { contains: trimmedSearch } },
    ];
  }

  const categoryWhere: any = {};
  if (categorySlug && categorySlug !== "all") {
    if (categorySlug === "ai-api" || categorySlug === "ai-api-keys") {
      categoryWhere.slug = { in: ["ai-api", "ai-api-keys"] };
    } else {
      categoryWhere.slug = categorySlug;
    }
  } else {
    categoryWhere.slug = { not: "codex-credit" };
  }

  const categories = await prisma.category.findMany({
    where: categoryWhere,
    include: {
      products: {
        where: productWhere,
        include: {
          supplierMapping: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result: CategoryWithProducts[] = await Promise.all(
    categories.map(async (category) => {
      const allowedCategoryProducts = category.products.filter(
        (p) =>
          !isDisallowedShortTermApiPackage(p) &&
          p.type !== "CODEX_CREDIT" &&
          category.slug !== "codex-credit"
      );
      const productsWithStock = await Promise.all(
        allowedCategoryProducts.map(async (product) => {
          const stockCount = await getAvailableStockCount(product.id);
          return {
            ...product,
            stockCount,
          };
        })
      );
      return {
        ...category,
        products: productsWithStock,
      };
    })
  );

  return result;
}

/**
 * Retrieves a single active product by slug, including category and live stock count.
 * Returns null if product is not found, inactive, or disallowed short-term package.
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  if (!slug) return null;

  let product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  // Fallback: If slug starts with supplier SKU prefix (e.g. cla-0036-api-claude...), resolve clean slug
  if (!product && /^cla-\d{4}-/i.test(slug)) {
    const cleanSlug = slug.replace(/^cla-\d{4}-/i, "");
    product = await prisma.product.findUnique({
      where: { slug: cleanSlug },
      include: {
        category: true,
      },
    });
  }

  if (
    !product ||
    !product.isActive ||
    isDisallowedShortTermApiPackage(product) ||
    product.type === "CODEX_CREDIT" ||
    product.category?.slug === "codex-credit"
  ) {
    return null;
  }

  const stockCount = await getAvailableStockCount(product.id);

  return {
    ...product,
    stockCount,
  };
}

/**
 * Retrieves all categories for navigation and filter tabs.
 */
export async function getAllCategories(): Promise<Category[]> {
  return await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });
}
