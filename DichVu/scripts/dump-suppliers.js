const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sups = await prisma.supplier.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      depositBankId: true,
      depositAccountNo: true,
      depositAccountName: true,
      depositSyntax: true,
      currentBalance: true,
      isActive: true,
    }
  });

  console.log(JSON.stringify(sups, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)));
