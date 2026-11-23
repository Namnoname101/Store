const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.supplier.findFirst({ where: { type: 'KHOMMO_API' } });
  const baseUrl = (s.baseUrl || 'https://api.khommo.vn/api/partner/v1').replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/products?limit=500`, {
    headers: { Authorization: `Bearer ${s.apiKey}`, Accept: 'application/json' }
  });
  const json = await res.json();
  const prods = (json.data || json).filter(p => [3564, 3556, 3534, 3483, 3087, 2020].includes(Number(p.id)));
  console.log(JSON.stringify(prods, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
