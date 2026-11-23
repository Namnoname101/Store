const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const suppliers = await prisma.supplier.findMany();
  console.log("Suppliers in DB:", suppliers.map(s => ({ id: s.id, code: s.code, name: s.name, type: s.type, isActive: s.isActive })));

  // Check Canboso
  const canboso = suppliers.find(s => s.type === 'CANBOSO_BUYER');
  if (canboso) {
    try {
      const url = `https://canboso.com/api/v2/telegram-buyer/products?key=${encodeURIComponent(canboso.apiKey)}`;
      const res = await fetch(url, { headers: { 'x-buyer-key': canboso.apiKey, Accept: 'application/json' } });
      const data = await res.json();
      const list = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
      const gem = list.filter(p => (p.name || '').toLowerCase().includes('gemini') || (p.name || '').toLowerCase().includes('google'));
      console.log(`\nCanboso Gemini products (${gem.length}):`, gem.map(p => ({ id: p.id || p.productId, name: p.name, price: p.price, stock: p.availability?.available ?? p.stock })));
    } catch (e) {
      console.log("Canboso err:", e.message);
    }
  }

  // Check DBot
  const dbot = suppliers.find(s => s.type === 'DBOT_API');
  if (dbot) {
    try {
      const res = await fetch(`https://dbot.pro.vn/public-api/v1/products`, {
        headers: { 'X-API-Key': dbot.apiKey, Accept: 'application/json' }
      });
      const data = await res.json();
      const list = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
      const gem = list.filter(p => (p.name || '').toLowerCase().includes('gemini') || (p.name || '').toLowerCase().includes('google'));
      console.log(`\nDBot Gemini products (${gem.length}):`, gem.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock })));
    } catch (e) {
      console.log("DBot err:", e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
