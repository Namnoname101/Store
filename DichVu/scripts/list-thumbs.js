const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { title: true, slug: true, thumbnailUrl: true }
  });
  for (const p of products) {
    console.log(p.slug.padEnd(40) + ' -> ' + p.thumbnailUrl);
  }
}

run().finally(() => prisma.$disconnect());
