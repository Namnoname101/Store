const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const o = await prisma.order.findFirst({
    where: { orderCode: 'ORD626949' },
    include: { deliveredItems: true }
  });
  console.log('Order ORD626949:', {
    orderCode: o.orderCode,
    status: o.status,
    upstreamStatus: o.upstreamStatus,
    accessToken: o.accessToken,
    deliveredItemsCount: o.deliveredItems.length,
    deliveredKey: o.deliveredItems[0]?.secretContent
  });
}

main().finally(() => prisma.$disconnect());
