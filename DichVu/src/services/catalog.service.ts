import { prisma } from "@/lib/prisma";
import { getAvailableStockCount } from "@/services/inventory.service";
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
  }

  const categories = await prisma.category.findMany({
    where: categoryWhere,
    include: {
      products: {
        where: productWhere,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result: CategoryWithProducts[] = await Promise.all(
    categories.map(async (category) => {
      const productsWithStock = await Promise.all(
        category.products.map(async (product) => {
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
 * Returns null if product is not found or inactive.
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  if (!slug) return null;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  if (!product || !product.isActive) {
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
