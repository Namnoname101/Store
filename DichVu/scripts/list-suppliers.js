const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const suppliers = await prisma.supplier.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      baseUrl: true,
      isActive: true,
      currentBalance: true
    }
  });
  console.log('Suppliers count:', suppliers.length);
  for (const s of suppliers) {
    console.log(`- [${s.code}] ${s.name} | Type: ${s.type} | Active: ${s.isActive} | Balance: ${s.currentBalance} | URL: ${s.baseUrl}`);
  }
}

main().finally(() => prisma.$disconnect());
