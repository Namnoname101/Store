const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const capcut = await prisma.product.findFirst({
    where: { slug: "capcut-pro-7-ngay" },
    include: {
      items: true
    }
  });

  console.log("=== CAPCUT ITEMS IN DB ===");
  console.log("Product:", capcut?.title, "Total items:", capcut?.items.length);
  for (const it of capcut?.items || []) {
    console.log(`ID: ${it.id} | Status: ${it.status} | OrderId: ${it.orderId} | Content: ${it.secretContent} | Created: ${it.createdAt}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
