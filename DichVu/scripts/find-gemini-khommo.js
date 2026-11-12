const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.findFirst({
    where: { name: { contains: 'MMO' } }
  });
  if (!supplier) {
    console.log('Supplier Kho MMO not found');
    return;
  }
  console.log('Supplier:', supplier.name, supplier.apiUrl);
  
  // Call Kho MMO products endpoint
  const url = `${supplier.apiUrl.replace(/\/$/, '')}/products`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${supplier.apiKey}` }
  });
  const data = await res.json();
  const products = data.data || data || [];
  console.log('Total products from Kho MMO:', products.length);
  const gemini = products.filter(p => {
    const text = (p.name || p.title || '').toLowerCase();
    return text.includes('gemini') || text.includes('argon');
  });
  console.log('Gemini products in Kho MMO:', JSON.stringify(gemini, null, 2));
}

main().finally(() => prisma.$disconnect());
