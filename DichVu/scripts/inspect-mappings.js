const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mappings = await prisma.supplierProductMapping.findMany({
    take: 5,
    include: { product: true, supplier: true }
  });
  console.log('Sample mappings:', mappings.map(m => ({
    productId: m.productId,
    productSlug: m.product.slug,
    supplierName: m.supplier.name,
    externalProductId: m.externalProductId,
    autoFulfill: m.autoFulfill
  })));
}

main().finally(() => prisma.$disconnect());
