const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating category name by id...');
  const res = await prisma.category.update({
    where: { id: '2c69d4c5-b493-40c5-bb3e-019c9f8599dd' },
    data: { name: 'API & Key AI' }
  });
  console.log('Result:', res);
}

main().finally(() => prisma.$disconnect());
