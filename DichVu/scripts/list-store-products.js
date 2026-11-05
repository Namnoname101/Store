const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.product.findMany({
    include: {
      category: true,
      supplierMapping: {
        include: { supplier: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  console.log(`=== STORE CATALOG (Total: ${prods.length}) ===`);
  for (const p of prods) {
    console.log(`[${p.isActive ? 'ACTIVE' : 'INACTIVE'}] [${p.category?.name || 'No Cat'}] ${p.title}`);
    console.log(`  Slug: ${p.slug} | Price: ${p.price?.toLocaleString('vi-VN')}đ | Type: ${p.type} | Fulfillment: ${p.fulfillmentType}`);
    if (p.supplierMapping) {
      console.log(`  Supplier: ${p.supplierMapping.supplier?.name} (${p.supplierMapping.supplier?.code}) | Code: ${p.supplierMapping.supplierProductCode} | Cost: ${p.supplierMapping.supplierPrice?.toLocaleString('vi-VN')}đ | Stock: ${p.supplierMapping.supplierStock}`);
    } else {
      console.log(`  Supplier: None (Local stock)`);
    }
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
