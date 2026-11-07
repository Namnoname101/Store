const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 10,
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

  console.log("=== PROD RECENT ORDERS ===");
  for (const o of orders) {
    console.log(`Order: ${o.orderCode} | Status: ${o.status} | UpstreamStatus: ${o.upstreamStatus} | Total: ${o.totalAmount} | Time: ${o.createdAt}`);
    console.log(`  upstreamOrderId: ${o.upstreamOrderId || "none"} | upstreamError: ${o.upstreamError || "none"}`);
    for (const item of o.orderItems) {
      console.log(`  - Item: ${item.product?.title} (ID: ${item.product?.id})`);
      console.log(`    fulfillmentType: ${item.product?.fulfillmentType}`);
      console.log(`    Supplier: ${item.product?.supplierMapping?.supplier?.code}, SupProductCode: ${item.product?.supplierMapping?.supplierProductCode}`);
    }
    console.log(`  Delivered Items count: ${o.deliveredItems.length}`);
    for (const d of o.deliveredItems) {
      console.log(`    Delivered: ${d.content?.slice(0, 100)}...`);
    }
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
