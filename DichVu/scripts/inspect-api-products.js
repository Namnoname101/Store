const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      category: { slug: 'ai-api' }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      description: true,
    },
    take: 20
  });

  console.log(`Found ${products.length} products:`);
  products.forEach(p => {
    console.log(`- [${p.slug}] ${p.title} -> ${p.price} VND`);
  });
}

main().finally(() => prisma.$disconnect());
