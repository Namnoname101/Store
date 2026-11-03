const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sups = await prisma.supplier.findMany({
    include: {
      mappings: {
        include: { product: true }
      }
    }
  });

  console.log('--- ALL SUPPLIERS ---');
  for (const s of sups) {
    console.log({
      id: s.id,
      name: s.name,
      code: s.code,
      type: s.type,
      balance: s.balance,
      isActive: s.isActive,
      baseUrl: s.baseUrl,
      apiKey: s.apiKey ? s.apiKey.slice(0, 8) + '...' : null,
      mappings: s.mappings.map(m => `${m.product.title} (code: ${m.supplierProductCode}, stock: ${m.supplierStock}, price: ${m.supplierPrice})`)
    });
  }
}

main().finally(() => prisma.$disconnect());
