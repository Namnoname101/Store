import { prisma } from "@/lib/prisma";
import SupplierManagerClient from "@/components/admin/SupplierManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  const [suppliers, mappings, products] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        mappings: {
          include: {
            product: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.supplierProductMapping.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        supplier: true,
      },
    }),
    prisma.product.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        fulfillmentType: true,
        isActive: true,
        supplierMapping: {
          select: { id: true, supplierId: true, supplierProductCode: true },
        },
      },
    }),
  ]);

  return (
    <SupplierManagerClient
      initialSuppliers={suppliers}
      initialMappings={mappings}
      products={products}
    />
  );
}
