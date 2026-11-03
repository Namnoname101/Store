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

  console.log("=== RECENT ORDERS ===");
  for (const o of orders) {
    console.log(`Order: ${o.code} | Status: ${o.status} | Total: ${o.totalAmount} | Time: ${o.createdAt}`);
    console.log(`Payment Status: ${o.paymentStatus} | Notes: ${o.notes || "none"}`);
    for (const item of o.orderItems) {
      console.log(`  - Item: ${item.product?.title} (ID: ${item.product?.id})`);
      console.log(`    Mapping: Sup=${item.product?.supplierMapping?.supplier?.code}, SupProductCode=${item.product?.supplierMapping?.supplierProductCode}, customConfig=${item.product?.supplierMapping?.customConfig}`);
    }
    console.log(`  Delivered Items count: ${o.deliveredItems.length}`);
    for (const d of o.deliveredItems) {
      console.log(`    Delivered: ${d.content?.slice(0, 100)}...`);
    }
  }
}

main().finally(() => prisma.$disconnect());
