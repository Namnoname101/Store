const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.findFirst({
    where: { id: 'a8fb9548-6350-4c67-8b63-2ba2c946d488' }
  });

  const res = await fetch('https://genzshop.vn/api/partner/v1/balance.php', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': supplier.apiKey,
      'Authorization': `Bearer ${supplier.apiKey}`
    }
  });

  console.log('Balance status:', res.status, await res.text());
}

main().finally(() => prisma.$disconnect());
