const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const o = await prisma.order.findUnique({
    where: { orderCode: "ORD777289" },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              supplierMapping: {
                include: { supplier: true }
              }
            }
          }
        }
      },
      deliveredItems: true
    }
  });

  console.log("=== ORD777289 DETAILS ===");
  console.log(JSON.stringify(o, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
