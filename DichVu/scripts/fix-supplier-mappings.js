const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Updating CapCut 7 day and ChatGPT Plus mappings...");

  // 1. Capcut 7 day: Update mapping from '34' to '21'
  const capcutMapping = await prisma.supplierProductMapping.findFirst({
    where: {
      supplier: { code: "XOAINON_TELE" },
      product: { title: { contains: "CapCut Pro 7" } }
    }
  });

  if (capcutMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: capcutMapping.id },
      data: {
        supplierProductCode: "21",
        supplierPrice: 4500
      }
    });
    console.log(`✓ Updated Capcut 7 day mapping to supplierProductCode: "21" (price: 4,500đ)`);
  } else {
    console.log("Capcut 7 day mapping not found");
  }

  // 2. ChatGPT Plus: Update mapping from '10' to '33'
  const gptMapping = await prisma.supplierProductMapping.findFirst({
    where: {
      supplier: { code: "XOAINON_TELE" },
      product: { title: { contains: "ChatGPT Plus" } }
    }
  });

  if (gptMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: gptMapping.id },
      data: {
        supplierProductCode: "33",
        supplierPrice: 135400
      }
    });
    console.log(`✓ Updated ChatGPT Plus mapping to supplierProductCode: "33" (price: 135,400đ)`);
  } else {
    console.log("ChatGPT Plus mapping not found");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
