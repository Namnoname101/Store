const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const r = await prisma.product.updateMany({
    where: {
      OR: [
        { title: { contains: 'NGỪNG BÁN' } },
        { slug: { contains: 'tesssttt' } }
      ]
    },
    data: { isActive: false }
  });
  console.log('Deactivated NGUNG BAN products:', r);
}

main().catch(console.error).finally(() => prisma.$disconnect());
