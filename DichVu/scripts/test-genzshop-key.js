const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.findFirst({
    where: { id: 'a8fb9548-6350-4c67-8b63-2ba2c946d488' }
  });

  const testKey1 = `ORDTEST_${Date.now()}_1`;
  console.log('Testing GenzShop with key:', testKey1);

  const res1 = await fetch('https://genzshop.vn/api/partner/v1/purchase.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': supplier.apiKey,
      'Authorization': `Bearer ${supplier.apiKey}`
    },
    body: JSON.stringify({
      product_id: 'CDX-0055',
      quantity: 1,
      idempotency_key: testKey1
    })
  });

  console.log('Status 1:', res1.status, await res1.text());
}

main().finally(() => prisma.$disconnect());
