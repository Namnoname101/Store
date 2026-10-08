const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.findFirst({
    where: { type: 'HACKTIM' }
  });

  const body = new URLSearchParams({
    key: supplier.apiKey.trim(),
    action: 'status',
    order: '7376829'
  });

  const res = await fetch(supplier.baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json();
  console.log("=== HACKTIM RAW STATUS (POST) ===");
  console.log(data);
}

main().catch(console.error).finally(() => prisma.$disconnect());
