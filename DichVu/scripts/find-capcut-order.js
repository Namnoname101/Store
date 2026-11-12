const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          product: {
            title: { contains: 'CapCut', mode: 'insensitive' }
          }
        }
      }
    },
    include: {
      items: {
        include: { product: true }
      },
      deliveries: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('---CAPCUT_ORDERS---');
  for (const o of orders) {
    console.log(`Order ID: ${o.id}, Code: ${o.code}, Status: ${o.status}, CreatedAt: ${o.createdAt}`);
    console.log(`Customer: ${o.customerEmail || o.customerPhone || o.customerName}`);
    for (const item of o.items) {
      console.log(`  Item: ${item.product.title} (Qty: ${item.quantity})`);
    }
    console.log('  Deliveries:', JSON.stringify(o.deliveries, null, 2));
  }
  console.log('---END---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
