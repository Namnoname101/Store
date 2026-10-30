const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Migrating Claude API products to LOCAL_STOCK...");

  const claudeProducts = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { contains: "claude" } },
        { slug: { startsWith: "cla-" } },
        { title: { contains: "Claude" } },
      ],
    },
    include: {
      supplierMapping: true,
    },
  });

  console.log(`Found ${claudeProducts.length} Claude products to update.`);

  for (const product of claudeProducts) {
    // 1. Update product fulfillmentType to LOCAL_STOCK
    await prisma.product.update({
      where: { id: product.id },
      data: {
        fulfillmentType: "LOCAL_STOCK",
      },
    });

    // 2. Remove supplierMapping if present so it doesn't try upstream sync
    if (product.supplierMapping) {
      await prisma.supplierProductMapping.delete({
        where: { id: product.supplierMapping.id },
      });
    }

    console.log(`Updated "${product.title}" (${product.slug}) -> LOCAL_STOCK`);
  }

  console.log("Successfully migrated all Claude products to LOCAL_STOCK!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
