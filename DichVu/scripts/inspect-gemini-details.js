const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetails() {
  const dkey = await prisma.supplier.findFirst({ where: { name: { contains: 'DKey' }, type: 'CANBOSO_BUYER' } });
  if (dkey) {
    const baseUrl = (dkey.baseUrl || 'https://canboso.com').replace(/\/+$/, '');
    const url = `${baseUrl}/api/v2/telegram-buyer/products?key=${encodeURIComponent(dkey.apiKey)}`;
    const res = await fetch(url, { headers: { 'x-buyer-key': dkey.apiKey } });
    const data = await res.json();
    const prods = data.products || data || [];
    const gemini = prods.filter(p => (p.name || '').toLowerCase().includes('gemini'));
    console.log('=== DKEY GEMINI PRODUCTS ===');
    gemini.forEach(p => {
      console.log('---');
      console.log('ID:', p.id || p.productId);
      console.log('Name:', p.name);
      console.log('Price:', p.price);
      console.log('Stock:', p.availability?.available ?? p.stock);
      console.log('Description:', p.description || p.desc || p.shortDescription || '(No description)');
    });
  }

  const khommo = await prisma.supplier.findFirst({ where: { name: { contains: 'Kho MMO' }, type: 'KHOMMO_API' } });
  if (khommo) {
    const baseUrl = (khommo.baseUrl || 'https://api.khommo.vn/api/partner/v1').replace(/\/+$/, '');
    const res = await fetch(`${baseUrl}/products?limit=500`, {
      headers: { Authorization: `Bearer ${khommo.apiKey}` }
    });
    const json = await res.json();
    const prods = json.data || [];
    const gemini = prods.filter(p => (p.name || '').toLowerCase().includes('gemini'));
    console.log('\n=== KHOMMO GEMINI PRODUCTS ===');
    gemini.forEach(p => {
      console.log('---');
      console.log('ID:', p.id);
      console.log('Name:', p.name);
      console.log('Price:', p.priceVnd || p.price);
      console.log('Stock:', p.stock);
      console.log('Description:', p.description || p.shortDescription || '(No description)');
    });
  }
}

checkDetails().finally(() => prisma.$disconnect());
