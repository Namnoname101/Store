const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { contains: 'photo' } },
        { title: { contains: 'Photoroom' } }
      ]
    },
    select: { id: true, title: true, slug: true, isActive: true }
  });
  console.log('Photoroom prods in DB:', prods);
}

main().finally(() => prisma.$disconnect());
