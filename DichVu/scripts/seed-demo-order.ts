import prisma from "../src/lib/prisma";

async function seedDemoOrder() {
  let product = await prisma.product.findFirst({
    where: { OR: [{ slug: { contains: "codex" } }, { title: { contains: "Codex" } }] },
  });

  if (!product) {
    let cat = await prisma.category.findFirst();
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: "AI & API", slug: "ai-api" },
      });
    }
    product = await prisma.product.create({
      data: {
        title: "Gói Codex 10$ Credit",
        slug: "codex-credit-10usd",
        description: "5.000.000 Quota Points — Thích hợp dùng thử cá nhân hoặc test bot",
        price: 12000,
        type: "LICENSE_KEY",
        categoryId: cat.id,
      },
    });
  }

  // Delete existing demo if any
  await prisma.productItem.deleteMany({ where: { order: { orderCode: "DEMO-CODEX" } } }).catch(() => {});
  await prisma.orderItem.deleteMany({ where: { order: { orderCode: "DEMO-CODEX" } } }).catch(() => {});
  await prisma.order.deleteMany({ where: { orderCode: "DEMO-CODEX" } }).catch(() => {});

  const order = await prisma.order.create({
    data: {
      orderCode: "DEMO-CODEX",
      customerEmail: "demo@daitruong.com",
      customerNote: "0988888888",
      totalAmount: 12000,
      status: "COMPLETED",
      upstreamStatus: "COMPLETED",
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      orderItems: {
        create: {
          productId: product.id,
          price: product.price,
          quantity: 1,
        },
      },
      deliveredItems: {
        create: {
          productId: product.id,
          secretContent: "sk-modelapi-demo7455abcd1234efgh5678ijkl9012",
          status: "SOLD",
        },
      },
    },
  });

  console.log("SUCCESS_DEMO_ORDER_CREATED:", order.orderCode);
  process.exit(0);
}

seedDemoOrder().catch((err) => {
  console.error(err);
  process.exit(1);
});
