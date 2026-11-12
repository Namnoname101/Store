const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const xn = await prisma.supplier.findFirst({
    where: { code: 'XOAINON_TELE' }
  });
  const nt = await prisma.supplier.findFirst({
    where: { code: 'NGHIENTRICK_TELE' }
  });
  console.log('XOAINON balance:', xn?.currentBalance);
  console.log('NGHIENTRICK balance:', nt?.currentBalance);
}

main().finally(() => prisma.$disconnect());
