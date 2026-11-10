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
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
    return products.map(p => ({
      supplier: name,
      id: p.productId || p.id,
      name: p.name,
      price: p.price?.amount || p.price,
      stock: p.availability?.available ?? p.stock ?? 0,
      description: p.description || p.desc || ''
    }));
  } catch (e) {
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
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
    return products.map(p => ({
      supplier: name,
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock ?? 0,
      description: p.description || ''
    }));
  } catch (e) {
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
    if (!res.ok) return [];
    const json = await res.json();
    const products = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return products.map(p => ({
      supplier: name,
      id: p.id || p.sku,
      name: p.name,
      price: p.priceVnd || p.price,
      stock: p.stock ?? 0,
      description: p.description || ''
    }));
  } catch (e) {
    return [];
  }
}

async function main() {
  const suppliers = await prisma.supplier.findMany({ where: { isActive: true } });
  console.log(`Checking ${suppliers.length} active suppliers...`);
  let allProducts = [];

  for (const s of suppliers) {
    let prods = [];
    if (s.type === 'CANBOSO_BUYER') {
      prods = await checkCanboso(s.name, s);
    } else if (s.type === 'DBOT_API') {
      prods = await checkDbot(s.name, s);
    } else if (s.type === 'KHOMMO_API') {
      prods = await checkKhoMmo(s.name, s);
    }
    console.log(`[${s.name}] fetched ${prods.length} items`);
    allProducts.push(...prods);
  }

  // Filter in-stock items
  const inStock = allProducts.filter(p => {
    const s = parseInt(p.stock);
    return !isNaN(s) ? s > 0 : p.stock !== 'N/A' && p.stock !== 0;
  });

  console.log(`\nTotal In-Stock Products: ${inStock.length}`);

  // Categorize
  const categories = {
    'AI Tools & Accounts (Claude, ChatGPT, Midjourney, Cursor, Perplexity, etc.)': [],
    'YouTube & Streaming & Music (YouTube, Netflix, Spotify, Discord)': [],
    'Software & Work & Design (Canva, JetBrains, CapCut, Office, Adobe, Google Drive)': [],
    'VPN & Network Security (NordVPN, Surfshark, ExpressVPN)': [],
    'Hot API / Token / Credits (Claude, OpenAI, Codex)': []
  };

  for (const p of inStock) {
    const n = (p.name || '').toLowerCase();
    
    // Skip telegram bot / smm reactions
    if (n.includes('follow') || n.includes('like') || n.includes('sub') || n.includes('view') || n.includes('tim tiktok') || n.includes('telegram member')) {
      continue;
    }

    if (n.includes('api') || n.includes('token') || n.includes('credit')) {
      categories['Hot API / Token / Credits (Claude, OpenAI, Codex)'].push(p);
    } else if (n.includes('claude') || n.includes('chatgpt') || n.includes('gpt') || n.includes('midjourney') || n.includes('suno') || n.includes('perplexity') || n.includes('cursor') || n.includes('copilot') || n.includes('gemini')) {
      categories['AI Tools & Accounts (Claude, ChatGPT, Midjourney, Cursor, Perplexity, etc.)'].push(p);
    } else if (n.includes('youtube') || n.includes('netflix') || n.includes('spotify') || n.includes('discord') || n.includes('apple music') || n.includes('vieon') || n.includes('k+')) {
      categories['YouTube & Streaming & Music (YouTube, Netflix, Spotify, Discord)'].push(p);
    } else if (n.includes('canva') || n.includes('jetbrains') || n.includes('office') || n.includes('365') || n.includes('adobe') || n.includes('capcut') || n.includes('zoom') || n.includes('freepik') || n.includes('envato') || n.includes('drive') || n.includes('icloud') || n.includes('grammarly') || n.includes('duolingo') || n.includes('quillbot')) {
      categories['Software & Work & Design (Canva, JetBrains, CapCut, Office, Adobe, Google Drive)'].push(p);
    } else if (n.includes('vpn') || n.includes('nord') || n.includes('surfshark') || n.includes('express')) {
      categories['VPN & Network Security (NordVPN, Surfshark, ExpressVPN)'].push(p);
    }
  }

  for (const [catName, prods] of Object.entries(categories)) {
    console.log(`\n======================================================`);
    console.log(`### ${catName} (${prods.length} items) ###`);
    console.log(`======================================================`);
    // sort by stock desc or price
    prods.sort((a, b) => (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0));
    prods.slice(0, 15).forEach(p => {
      console.log(`- [${p.supplier}] ${p.name} | Mã: ${p.id} | Giá: ${Number(p.price).toLocaleString('vi-VN')}đ | Stock: ${p.stock}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
