const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              supplierMapping: { include: { supplier: true } }
            }
          }
        }
      },
      deliveredItems: true
    }
  });

  console.log("=== ORDERS ===");
  for (const o of orders) {
    console.log(`Order: ${o.orderCode} | Status: ${o.status} | Total: ${o.totalAmount} | Time: ${o.createdAt}`);
    console.log(`Customer: ${o.customerEmail || "anonymous"}`);
    for (const item of o.orderItems) {
      console.log(`  - Item: ${item.product?.title}`);
      console.log(`    Mapping: Sup=${item.product?.supplierMapping?.supplier?.code}, SupProductCode=${item.product?.supplierMapping?.supplierProductCode}`);
    }
    console.log(`  Delivered Items (${o.deliveredItems.length}):`);
    for (const d of o.deliveredItems) {
      console.log(`    Secret: ${d.secretContent}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
