const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCanboso(name, creds) {
  try {
    const baseUrl = (creds.baseUrl || 'https://canboso.com').replace(/\/+$/, '');
    const url = `${baseUrl}/api/v2/telegram-buyer/products?key=${encodeURIComponent(creds.apiKey)}`;
    const res = await fetch(url, {
      headers: {
        'x-buyer-key': creds.apiKey,
        Accept: 'application/json'
      }
    });
    if (!res.ok) {
      console.log(`[${name}] Failed with HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
    return products.map(p => ({
      supplier: name,
      id: p.productId || p.id,
      name: p.name,
      price: p.price?.amount || p.price,
      stock: p.availability?.available ?? p.stock ?? 'N/A'
    }));
  } catch (e) {
    console.log(`[${name}] Error:`, e.message);
    return [];
  }
}

async function checkDbot(name, creds) {
  try {
    const baseUrl = (creds.baseUrl || 'https://dbot.pro.vn').replace(/\/+$/, '');
    const url = `${baseUrl}/public-api/v1/products`;
    const res = await fetch(url, {
      headers: {
        'X-API-Key': creds.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    if (!res.ok) {
      console.log(`[${name}] Failed with HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
    return products.map(p => ({
      supplier: name,
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock
    }));
  } catch (e) {
    console.log(`[${name}] Error:`, e.message);
    return [];
  }
}

async function checkKhoMmo(name, creds) {
  try {
    const baseUrl = (creds.baseUrl || 'https://api.khommo.vn/api/partner/v1').replace(/\/+$/, '');
    const url = `${baseUrl}/products?limit=500`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        Accept: 'application/json'
      }
    });
    if (!res.ok) {
      console.log(`[${name}] Failed with HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    const products = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return products.map(p => ({
      supplier: name,
      id: p.id || p.sku,
      name: p.name,
      price: p.priceVnd || p.price,
      stock: p.stock
    }));
  } catch (e) {
    console.log(`[${name}] Error:`, e.message);
    return [];
  }
}

async function main() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true }
  });

  console.log(`Checking ${suppliers.length} suppliers...`);
  let allProducts = [];

  for (const s of suppliers) {
    if (s.type === 'CANBOSO_BUYER') {
      const prods = await checkCanboso(s.name, s);
      allProducts.push(...prods);
    } else if (s.type === 'DBOT_API') {
      const prods = await checkDbot(s.name, s);
      allProducts.push(...prods);
    } else if (s.type === 'KHOMMO_API') {
      const prods = await checkKhoMmo(s.name, s);
      allProducts.push(...prods);
    }
  }

  console.log(`\nTotal products collected from API suppliers: ${allProducts.length}`);

  const geminiProds = allProducts.filter(p => {
    const n = (p.name || '').toLowerCase();
    return n.includes('gemini') || n.includes('google one') || n.includes('google ai') || n.includes('google drive');
  });

  console.log(`\n=== GEMINI / GOOGLE AI PRODUCTS (${geminiProds.length}) ===`);
  for (const p of geminiProds) {
    console.log(`[${p.supplier}] Code: ${p.id} | Name: ${p.name} | Price: ${p.price?.toLocaleString('vi-VN')}đ | Stock: ${p.stock}`);
  }

  // Also search for general AI products (Claude, ChatGPT, etc.)
  const otherAiProds = allProducts.filter(p => {
    const n = (p.name || '').toLowerCase();
    return n.includes('claude') || n.includes('openai') || n.includes('chatgpt') || n.includes('midjourney') || n.includes('suno');
  });

  console.log(`\n=== OTHER RELEVANT AI PRODUCTS (${otherAiProds.length}) ===`);
  for (const p of otherAiProds.slice(0, 10)) {
    console.log(`[${p.supplier}] Code: ${p.id} | Name: ${p.name} | Price: ${p.price?.toLocaleString('vi-VN')}đ | Stock: ${p.stock}`);
  }
}

main().finally(() => prisma.$disconnect());
