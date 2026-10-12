const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.findFirst({
    where: { id: 'a8fb9548-6350-4c67-8b63-2ba2c946d488' }
  });

  if (!supplier) {
    console.log('Supplier not found');
    return;
  }

  console.log('Supplier:', {
    id: supplier.id,
    name: supplier.name,
    type: supplier.type,
    baseUrl: supplier.baseUrl,
    isActive: supplier.isActive,
    balance: supplier.balance,
  });
}

main().finally(() => prisma.$disconnect());
