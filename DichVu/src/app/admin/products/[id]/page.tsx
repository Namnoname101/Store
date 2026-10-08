import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminProductEditor from "@/components/admin/AdminProductEditor";

export const dynamic = "force-dynamic";

export default async function AdminProductEditorPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <AdminProductEditor
      initialProduct={{
        id: product.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        thumbnailUrl: product.thumbnailUrl,
        type: product.type,
        categoryId: product.categoryId,
        isActive: product.isActive,
        fulfillmentType: product.fulfillmentType,
      }}
      categories={categories.map((category) => ({ id: category.id, name: category.name }))}
    />
  );
}
