const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetails() {
  const khommo = await prisma.supplier.findFirst({ where: { type: 'KHOMMO_API' } });
  const hxn = await prisma.supplier.findFirst({ where: { name: { contains: 'HXN' }, type: 'CANBOSO_BUYER' } });
  const dkey = await prisma.supplier.findFirst({ where: { name: { contains: 'DKey' }, type: 'CANBOSO_BUYER' } });

  console.log('--- KHOMMO 1636 & 2789 ---');
  if (khommo) {
    const r = await fetch('https://api.khommo.vn/api/partner/v1/products?limit=500', { headers: { Authorization: 'Bearer ' + khommo.apiKey } });
    const j = await r.json();
    const p1 = (j.data || []).find(p => p.id == 1636);
    const p2 = (j.data || []).find(p => p.id == 2789);
    console.log('HMA 1636:', JSON.stringify(p1, null, 2));
    console.log('Adobe 2789:', JSON.stringify(p2, null, 2));
  }

  console.log('\n--- HXN Suno Pro ---');
  if (hxn) {
    const r = await fetch('https://canboso.com/api/v2/telegram-buyer/products?key=' + hxn.apiKey, { headers: { 'x-buyer-key': hxn.apiKey } });
    const j = await r.json();
    const p = (j.products || []).find(p => p.id === '6af2c974fe16327c209e1818' || p.productId === '6af2c974fe16327c209e1818');
    console.log('Suno Pro:', JSON.stringify(p, null, 2));
  }

  console.log('\n--- DKey HMA ---');
  if (dkey) {
    const r = await fetch('https://canboso.com/api/v2/telegram-buyer/products?key=' + dkey.apiKey, { headers: { 'x-buyer-key': dkey.apiKey } });
    const j = await r.json();
    const p = (j.products || []).find(p => p.id === '6aa485346231787f04683449' || p.productId === '6aa485346231787f04683449');
    console.log('DKey HMA:', JSON.stringify(p, null, 2));
  }
}

checkDetails().then(() => prisma.$disconnect());
