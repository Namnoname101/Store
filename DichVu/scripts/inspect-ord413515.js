const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { orderCode: 'ORD413515' },
    include: {
      orderItems: { include: { product: true } },
      transactions: true
    }
  });

  console.log("=== ORDER ORD413515 ===");
  console.log({
    id: order?.id,
    orderCode: order?.orderCode,
    status: order?.status,
    totalAmount: order?.totalAmount,
    createdAt: order?.createdAt,
    expiresAt: order?.expiresAt,
    paidAt: order?.paidAt,
    upstreamStatus: order?.upstreamStatus,
    upstreamError: order?.upstreamError,
    upstreamOrderId: order?.upstreamOrderId,
    customerNote: order?.customerNote,
    txCount: order?.transactions?.length
  });

  const tx = await prisma.paymentTransaction.findUnique({
    where: { transactionId: '88003392' }
  });
  console.log("=== TX 88003392 ===");
  console.log(tx);
}

main().catch(console.error).finally(() => prisma.$disconnect());
