const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  console.log('Categories:', cats.map(c => ({ id: c.id, slug: c.slug, name: c.name })));
}

main().finally(() => prisma.$disconnect());
