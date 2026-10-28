import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminProductEditor from "@/components/admin/AdminProductEditor";

export const dynamic = "force-dynamic";

export default async function AdminProductEditorPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplierMapping: {
          include: {
            supplier: true,
          },
        },
      },
    }),
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
        supplierMapping: product.supplierMapping
          ? {
              id: product.supplierMapping.id,
              supplierName: product.supplierMapping.supplier.name,
              supplierProductCode: product.supplierMapping.supplierProductCode,
              supplierPrice: product.supplierMapping.supplierPrice,
              markupType: product.supplierMapping.markupType,
              markupValue: product.supplierMapping.markupValue,
              isAutoSync: product.supplierMapping.isAutoSync,
              lastSyncAt: product.supplierMapping.lastSyncAt ? product.supplierMapping.lastSyncAt.toISOString() : null,
            }
          : null,
      }}
      categories={categories.map((category) => ({ id: category.id, name: category.name }))}
    />
  );
}
