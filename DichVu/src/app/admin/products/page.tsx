import { prisma } from "@/lib/prisma";
import { getAllProductsAdmin } from "@/services/admin.service";
import ProductManagerClient from "@/components/admin/ProductManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProductsAdmin(),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return <ProductManagerClient initialProducts={products} categories={categories} />;
}
