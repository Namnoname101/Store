const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              supplierMapping: true
            }
          }
        }
      },
      transactions: true
    }
  });

  console.log('--- RECENT ORDERS ---');
  for (const o of recentOrders) {
    console.log(`Order: ${o.orderCode} | Status: ${o.status} | UpstreamStatus: ${o.upstreamStatus} | Created: ${o.createdAt}`);
    console.log(`Total: ${o.totalAmount} | UpstreamOrderId: ${o.upstreamOrderId} | UpstreamError: ${o.upstreamError}`);
    for (const item of o.orderItems) {
      console.log(`  - Item: ${item.product.title} (slug: ${item.product.slug})`);
      console.log(`    Mapping:`, item.product.supplierMapping ? {
        supplierId: item.product.supplierMapping.supplierId,
        supplierProductCode: item.product.supplierMapping.supplierProductCode,
        estimatedCost: item.product.supplierMapping.estimatedCost
      } : 'NO MAPPING');
    }
    console.log(`  - Delivered Content:`, o.deliveredContent ? 'HAS CONTENT' : 'NONE');
    console.log(`  - Transactions:`, o.transactions.map(t => ({ id: t.transactionId, amount: t.amount, status: t.status })));
  }
}

main().finally(() => prisma.$disconnect());
