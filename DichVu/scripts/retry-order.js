const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { orderCode: 'ORD626949' },
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
      }
    }
  });

  if (!order) {
    console.log('Order not found');
    return;
  }

  console.log('Order details:', {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    upstreamStatus: order.upstreamStatus,
    error: order.upstreamError
  });

  const { retryUpstreamFulfillment } = require('./src/services/upstream-fulfillment.service');
  console.log('Attempting retryUpstreamFulfillment...');
  const result = await retryUpstreamFulfillment(order.id);
  console.log('Retry result:', result);

  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: {
      status: true,
      upstreamStatus: true,
      upstreamError: true,
      deliveredContent: true,
      deliveredItems: true
    }
  });
  console.log('Updated order:', updatedOrder);
}

main().finally(() => prisma.$disconnect());
