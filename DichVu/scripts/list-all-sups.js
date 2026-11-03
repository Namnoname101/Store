const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sups = await prisma.supplier.findMany();
  console.log('ALL SUPPLIERS IN DB:');
  for (const s of sups) {
    console.log({
      id: s.id,
      name: s.name,
      code: s.code,
      type: s.type,
      baseUrl: s.baseUrl,
      isActive: s.isActive
    });
  }
}

main().finally(() => prisma.$disconnect());
