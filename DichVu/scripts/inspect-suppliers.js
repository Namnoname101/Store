const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sups = await prisma.supplier.findMany({
    select: {
      code: true,
      name: true,
      depositBankId: true,
      depositAccountNo: true,
      depositAccountName: true,
      depositSyntax: true,
      currentBalance: true,
    }
  });

  console.log('--- ALL SUPPLIER BANK DETAILS IN DB ---');
  for (const s of sups) {
    console.log(s);
  }
}

main().finally(() => prisma.$disconnect());
