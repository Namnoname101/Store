const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dkey = await prisma.supplier.findFirst({ where: { name: { contains: 'DKey' }, type: 'CANBOSO_BUYER' } });
  const hxn = await prisma.supplier.findFirst({ where: { name: { contains: 'HXN' }, type: 'CANBOSO_BUYER' } });
  const dbot = await prisma.supplier.findFirst({ where: { type: 'DBOT_API' } });
  const khommo = await prisma.supplier.findFirst({ where: { type: 'KHOMMO_API' } });

  const all = [];

  if (dkey) {
    const r = await fetch(`https://canboso.com/api/v2/telegram-buyer/products?key=${dkey.apiKey}`, {
      headers: { 'x-buyer-key': dkey.apiKey }
    });
    const d = await r.json();
    (d.products || []).forEach(p => all.push({
      sup: 'DKey Shop',
      id: p.productId || p.id,
      name: p.name,
      price: p.price?.amount || p.price,
      stock: p.availability?.available ?? p.stock
    }));
  }

  if (hxn) {
    const r = await fetch(`https://canboso.com/api/v2/telegram-buyer/products?key=${hxn.apiKey}`, {
      headers: { 'x-buyer-key': hxn.apiKey }
    });
    const d = await r.json();
    (d.products || []).forEach(p => all.push({
      sup: 'Shop HXN',
      id: p.productId || p.id,
      name: p.name,
      price: p.price?.amount || p.price,
      stock: p.availability?.available ?? p.stock
    }));
  }

  if (dbot) {
    const r = await fetch('https://dbot.pro.vn/public-api/v1/products', {
      headers: { 'X-API-Key': dbot.apiKey }
    });
    const d = await r.json();
    (d.products || []).forEach(p => all.push({
      sup: 'Chợ Đầu Mối',
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock
    }));
  }

  if (khommo) {
    const r = await fetch('https://api.khommo.vn/api/partner/v1/products?limit=500', {
      headers: { Authorization: `Bearer ${khommo.apiKey}` }
    });
    const d = await r.json();
    (d.data || []).forEach(p => all.push({
      sup: 'Kho MMO',
      id: p.id,
      name: p.name,
      price: p.priceVnd || p.price,
      stock: p.stock
    }));
  }

  const inStock = all.filter(p => (parseInt(p.stock) || 0) > 0);

  // Group by category
  const categories = {
    '🎨 Thiết Kế & Sáng Tạo (Canva, CapCut, Adobe, Meitu, Wink)': [],
    '🤖 AI Tools & Trí Tuệ Nhân Tạo (ChatGPT, Claude, Suno, GPT Team)': [],
    '🎬 Giải Trí & Truyền Hình (YouTube Premium, VieON, TV360, Spotify)': [],
    '🛡️ VPN & Bảo Mật (NordVPN, Surfshark, ExpressVPN, PIA)': [],
    '⚡ API & Token AI (Claude 50M-100M, Codex Credit)': []
  };

  inStock.forEach(p => {
    const n = p.name.toLowerCase();
    if (n.includes('canva') || n.includes('capcut') || n.includes('adobe') || n.includes('meitu') || n.includes('wink') || n.includes('photoroom') || n.includes('vidiq')) {
      categories['🎨 Thiết Kế & Sáng Tạo (Canva, CapCut, Adobe, Meitu, Wink)'].push(p);
    } else if (n.includes('gpt') || n.includes('chatgpt') || n.includes('claude') || n.includes('suno') || n.includes('grok') || n.includes('pitpit') || n.includes('notion')) {
      if (n.includes('api') || n.includes('token') || n.includes('credit')) {
        categories['⚡ API & Token AI (Claude 50M-100M, Codex Credit)'].push(p);
      } else {
        categories['🤖 AI Tools & Trí Tuệ Nhân Tạo (ChatGPT, Claude, Suno, GPT Team)'].push(p);
      }
    } else if (n.includes('youtube') || n.includes('vieon') || n.includes('tv360') || n.includes('galaxy') || n.includes('spotify') || n.includes('netflix')) {
      categories['🎬 Giải Trí & Truyền Hình (YouTube Premium, VieON, TV360, Spotify)'].push(p);
    } else if (n.includes('vpn') || n.includes('nord') || n.includes('surfshark') || n.includes('express') || n.includes('hma') || n.includes('pia')) {
      categories['🛡️ VPN & Bảo Mật (NordVPN, Surfshark, ExpressVPN, PIA)'].push(p);
    }
  });

  for (const [title, list] of Object.entries(categories)) {
    console.log(`\n==============================================`);
    console.log(`### ${title} (${list.length} sp)`);
    console.log(`==============================================`);
    list.sort((a, b) => (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0));
    list.forEach(p => {
      console.log(`- [${p.sup}] ${p.name} | Mã: ${p.id} | Giá: ${Number(p.price).toLocaleString('vi-VN')}đ | Stock: ${p.stock}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
