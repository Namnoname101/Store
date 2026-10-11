const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orderCode = "ORD526702";
  const realLink =
    "https://go.serviceactivation-google.co/subscription/new/ZcdVr-TTSN5iqJNcxdBBrH3PZb0zOSRCaPWd6FLISGTeHvtAzG1gO0JbQ3e6igIYtR5yrp7Mx5hM4gA0fVQSGSKuv9X2l7xQ3ZRsgMhdAdzCn5EW9kdlAiFGE3fy3vdxgcq3RUCtpTyjeGB4AV3e8M14mNtKMfkNJAw2SUeF64Uzvhf-bPLWDujBADQibFkmrYLYVZt9A6s2z7oxxzhEOgohKBSKOes-k46TXjfeiYSxPqoCNEeYhbyWuEnKSm79";

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: { deliveredItems: true },
  });

  if (!order) {
    console.error("Order not found:", orderCode);
    process.exit(1);
  }

  console.log("Found order:", order.orderCode, "with items:", order.deliveredItems.length);

  for (const item of order.deliveredItems) {
    await prisma.productItem.update({
      where: { id: item.id },
      data: { secretContent: realLink },
    });
    console.log("Updated ProductItem:", item.id, "with real link!");
  }

  console.log("SUCCESS: Order ORD526702 updated!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
