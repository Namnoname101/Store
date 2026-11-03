const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const mappings = await prisma.supplierProductMapping.findMany({
    where: { supplier: { code: "XOAINON_TELE" } },
    include: { product: true }
  });
  console.log("=== MAPPINGS FOR XOAINON_TELE ===");
  for (const m of mappings) {
    console.log(`Product: "${m.product.title}" | ID: ${m.productId} | SupProductCode: "${m.supplierProductCode}" | Price: ${m.supplierPrice}`);
  }
}

main().finally(() => prisma.$disconnect());
