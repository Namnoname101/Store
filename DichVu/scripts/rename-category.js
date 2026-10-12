const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Renaming categories to clean, concise names...');
  
  await prisma.category.updateMany({
    where: { slug: 'ai-api' },
    data: { name: 'API & Key AI' }
  });

  await prisma.category.updateMany({
    where: { slug: 'dich-vu-mxh' },
    data: { name: 'Dịch Vụ MXH' }
  });

  await prisma.category.updateMany({
    where: { slug: 'ai-tool' },
    data: { name: 'Tài Khoản AI' }
  });

  console.log('Categories renamed successfully.');
}

main().finally(() => prisma.$disconnect());
