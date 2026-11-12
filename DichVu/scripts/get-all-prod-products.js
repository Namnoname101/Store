const fs = require('fs');
const { spawnSync } = require('child_process');

const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      supplierMapping: {
        include: { supplier: true }
      }
    },
    orderBy: [
      { category: { name: 'asc' } },
      { price: 'asc' }
    ]
  });

  const formatted = products.map(p => {
    const cost = p.supplierMapping ? p.supplierMapping.supplierPrice : null;
    const price = p.price;
    const profit = cost != null ? price - cost : null;
    const margin = cost != null && price > 0 ? ((profit / price) * 100).toFixed(1) : null;

    let ctvPercent = 15;
    const cat = (p.category ? p.category.name : '').toLowerCase();
    if (cat.includes('api') || cat.includes('key ai') || cat.includes('claude')) {
      ctvPercent = 8;
    } else if (cat.includes('mxh') || cat.includes('buff') || cat.includes('tiktok') || cat.includes('facebook')) {
      ctvPercent = 20;
    }

    // Khi khách dùng mã CTV: khách được giảm 5%, CTV nhận ctvPercent trên số tiền khách thanh toán
    const priceAfterDiscount = Math.round(price * 0.95);
    const ctvCommissionVnd = Math.round((priceAfterDiscount * ctvPercent) / 100);
    // Giá CTV tự nhập (Giá sỉ CTV nếu mua đứt = Bán lẻ - Hoa hồng)
    const ctvWholesalePrice = price - ctvCommissionVnd;
    const shopNetProfit = profit != null ? (priceAfterDiscount - (cost || 0) - ctvCommissionVnd) : null;

    return {
      category: p.category ? p.category.name : 'Chưa phân loại',
      title: p.title,
      slug: p.slug,
      type: p.type,
      isActive: p.isActive,
      supplierStock: p.supplierMapping ? p.supplierMapping.supplierStock : null,
      sellingPrice: price,
      costPrice: cost,
      profit: profit,
      marginPercent: margin ? margin + '%' : 'N/A',
      supplierName: p.supplierMapping && p.supplierMapping.supplier ? p.supplierMapping.supplier.name : (p.type === 'CODEX_CREDIT' || p.slug.includes('codex') ? 'ModelAPI Quota' : 'Nội bộ / KhoDEE'),
      supplierCode: p.supplierMapping ? p.supplierMapping.supplierProductCode : 'N/A',
      ctvPercent: ctvPercent + '%',
      ctvCommissionVnd: ctvCommissionVnd,
      ctvWholesalePrice: ctvWholesalePrice,
      shopNetProfit: shopNetProfit
    };
  });

  console.log('---JSON_ALL_START---' + JSON.stringify(formatted) + '---JSON_ALL_END---');
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;

const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024
});

if (res.stdout.includes('---JSON_ALL_START---')) {
  const jsonStr = res.stdout.split('---JSON_ALL_START---')[1].split('---JSON_ALL_END---')[0];
  const list = JSON.parse(jsonStr);
  fs.writeFileSync('scripts/prod-all-products.json', JSON.stringify(list, null, 2), 'utf8');
  console.log(`Successfully saved ${list.length} products total from production.`);
} else {
  console.log('Stdout:', res.stdout);
  console.log('Stderr:', res.stderr);
}
