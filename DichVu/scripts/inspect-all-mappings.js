const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const mappings = await prisma.supplierProductMapping.findMany({
    include: {
      product: true,
      supplier: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`=== ALL SUPPLIER PRODUCT MAPPINGS (Total: ${mappings.length}) ===\n`);
  for (const m of mappings) {
    console.log(`Product: [${m.product.title}] (slug: ${m.product.slug})`);
    console.log(`  fulfillmentType: ${m.product.fulfillmentType} | price: ${m.product.price}đ | isActive: ${m.product.isActive}`);
    console.log(`  Supplier: ${m.supplier.name} (${m.supplier.code})`);
    console.log(`  supplierProductCode: "${m.supplierProductCode}" | supplierPrice: ${m.supplierPrice}đ | stock: ${m.supplierStock}`);
    if (m.customConfig) {
      console.log(`  customConfig: ${m.customConfig}`);
    }
    console.log("-------------------------------------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
