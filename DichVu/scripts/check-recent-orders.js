const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: { product: true },
      },
      deliveredItems: true,
    },
  });

  console.log(
    JSON.stringify(
      orders.map((o) => ({
        orderCode: o.orderCode,
        status: o.status,
        upstreamStatus: o.upstreamStatus,
        upstreamOrderId: o.upstreamOrderId,
        upstreamError: o.upstreamError,
        createdAt: o.createdAt,
        items: o.orderItems.map((i) => ({
          title: i.product?.title,
          slug: i.product?.slug,
          qty: i.quantity,
        })),
        delivered: o.deliveredItems.map((pi) => ({
          secretContent: pi.secretContent,
          status: pi.status,
        })),
      })),
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
