const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { orderCode: 'ORD626949' },
    include: {
      orderItems: true
    }
  });

  if (!order) {
    console.log('Order not found');
    return;
  }

  const key = '1cc126216dab4215b3040455a26370f5';

  // 1. Create ProductItem
  const item = await prisma.productItem.create({
    data: {
      productId: order.orderItems[0].productId,
      secretContent: key,
      status: 'SOLD',
      orderId: order.id
    }
  });
  console.log('Created product item:', item.id);

  // 2. Update Order
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      upstreamStatus: 'COMPLETED',
      upstreamOrderId: 'GZ261012CDXD85278',
      upstreamError: null,
    }
  });
  console.log('Order ORD626949 is now COMPLETED:', updatedOrder.upstreamStatus);
}

main().finally(() => prisma.$disconnect());
