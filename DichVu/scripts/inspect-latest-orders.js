const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
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
      transactions: true
    }
  });

  console.log('--- LATEST ORDERS ---');
  for (const o of recentOrders) {
    console.log(`Order: ${o.orderCode} | Status: ${o.status} | UpstreamStatus: ${o.upstreamStatus} | Created: ${o.createdAt}`);
    console.log(`Total: ${o.totalAmount} | UpstreamOrderId: ${o.upstreamOrderId}`);
    console.log(`UpstreamError: ${o.upstreamError}`);
    for (const item of o.orderItems) {
      console.log(`  - Item: ${item.product.title} (slug: ${item.product.slug})`);
      console.log(`    Mapping:`, item.product.supplierMapping ? {
        supplierName: item.product.supplierMapping.supplier.name,
        supplierType: item.product.supplierMapping.supplier.type,
        supplierProductCode: item.product.supplierMapping.supplierProductCode,
        supplierPrice: item.product.supplierMapping.supplierPrice,
        balance: item.product.supplierMapping.supplier.balance
      } : 'NO MAPPING');
    }
  }
}

main().finally(() => prisma.$disconnect());
