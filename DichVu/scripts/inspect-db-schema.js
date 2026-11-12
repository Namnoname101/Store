const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log('Categories:', categories.map(c => ({ id: c.id, slug: c.slug, name: c.name })));

  const suppliers = await prisma.supplier.findMany();
  console.log('Suppliers:', suppliers.map(s => ({ id: s.id, name: s.name, type: s.type })));
}

main().finally(() => prisma.$disconnect());
