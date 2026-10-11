const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: { include: { product: true } },
      transactions: true,
      paymentIntents: true,
    },
  });

  const txs = await prisma.paymentTransaction.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  console.log("=== RECENT ORDERS ===");
  console.log(
    JSON.stringify(
      orders.map((o) => ({
        orderCode: o.orderCode,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        expiresAt: o.expiresAt,
        items: o.orderItems.map((i) => i.product?.title),
        txCount: o.transactions.length,
        intents: o.paymentIntents.map((pi) => ({
          amount: pi.amount,
          transferContent: pi.transferContent,
          status: pi.status,
          expiresAt: pi.expiresAt,
        })),
      })),
      null,
      2
    )
  );

  console.log("=== RECENT PAYMENT TRANSACTIONS ===");
  console.log(
    JSON.stringify(
      txs.map((t) => ({
        id: t.id,
        transactionId: t.transactionId,
        amount: t.amount,
        content: t.content,
        status: t.status,
        orderId: t.orderId,
        createdAt: t.createdAt,
      })),
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
