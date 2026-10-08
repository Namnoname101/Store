const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        include: { product: true }
      },
      deliveredItems: true
    }
  });

  console.log("=== RECENT ORDERS ===");
  for (const o of orders) {
    console.log(`Order: ${o.orderCode} | Status: ${o.status} | UpstreamStatus: ${o.upstreamStatus} | Total: ${o.totalAmount} | UpstreamError: ${o.upstreamError}`);
    console.log(`CustomerNote: ${o.customerNote}`);
    for (const item of o.orderItems) {
      console.log(`  Item: ${item.product.title} (x${item.quantity}) - Price: ${item.price}`);
    }
  }

  const deposits = await prisma.deposit.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log("=== RECENT DEPOSITS ===");
  for (const d of deposits) {
    console.log(`Deposit: ${d.depositCode} | Status: ${d.status} | Amount: ${d.amount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
