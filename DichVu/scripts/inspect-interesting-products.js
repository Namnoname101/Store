const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dkey = await prisma.supplier.findFirst({ where: { name: { contains: 'DKey' }, type: 'CANBOSO_BUYER' } });
  const hxn = await prisma.supplier.findFirst({ where: { name: { contains: 'HXN' }, type: 'CANBOSO_BUYER' } });
  const dbot = await prisma.supplier.findFirst({ where: { type: 'DBOT_API' } });
  const khommo = await prisma.supplier.findFirst({ where: { type: 'KHOMMO_API' } });

  const all = [];

  // DKey
  if (dkey) {
    const r = await fetch(`https://canboso.com/api/v2/telegram-buyer/products?key=${dkey.apiKey}`, {
      headers: { 'x-buyer-key': dkey.apiKey }
    });
    const d = await r.json();
    (d.products || []).forEach(p => all.push({
      sup: 'DKey',
      id: p.id,
      name: p.name,
      price: p.price?.amount || p.price,
      stock: p.availability?.available ?? p.stock
    }));
  }

  // HXN
  if (hxn) {
    const r = await fetch(`https://canboso.com/api/v2/telegram-buyer/products?key=${hxn.apiKey}`, {
      headers: { 'x-buyer-key': hxn.apiKey }
    });
    const d = await r.json();
    (d.products || []).forEach(p => all.push({
      sup: 'Shop HXN',
      id: p.id,
      name: p.name,
      price: p.price?.amount || p.price,
      stock: p.availability?.available ?? p.stock
    }));
  }

  // DBot
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

  // Kho MMO
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

  const valid = all.filter(p => {
    const s = parseInt(p.stock);
    return !isNaN(s) ? s > 0 : p.stock > 0;
  });

  console.log(`=== TỔNG CỘNG ${valid.length} SẢN PHẨM CÒN HÀNG ===\n`);

  // Lọc các sản phẩm bán lẻ nổi bật (không tính mail rác/bot interaction)
  const interesting = valid.filter(p => {
    const n = (p.name || '').toLowerCase();
    const bad = ['member', 'sub', 'view', 'like', 'tim tiktok', 'cmt', 'share', 'discord', 'outlook', 'hotmail', 'mail khôi phục', 'gmail random', 'gmail trắng'];
    if (bad.some(b => n.includes(b))) return false;
    return true;
  });

  interesting.sort((a, b) => (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0));

  console.log(`Tìm thấy ${interesting.length} sản phẩm HOT tiêu dùng:`);
  interesting.forEach(p => {
    console.log(`[${p.sup}] ${p.name} | Mã: ${p.id} | Giá nhập: ${Number(p.price).toLocaleString('vi-VN')}đ | Stock: ${p.stock}`);
  });
}

main().finally(() => prisma.$disconnect());
