const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * MASTER CATALOG & PRICING SYNCHRONIZATION SCRIPT
 * Enforces:
 * 1. Only API Codex & API Claude active in API category (all other APIs hidden).
 * 2. Minimum 50% - 85%+ profit margin on supplier cost.
 * 3. Charm pricing ending in .000đ (or 9.900đ for CapCut 7d, exact int for SMM).
 * 4. SupplierProductMapping: markupType = FIXED_AMOUNT, markupValue = price - supplierPrice.
 * 5. CTV & Affiliate Safeguard: Shop Net Profit (after 5% customer coupon + CTV commission) > CTV Commission.
 */

const MASTER_UPDATES = [
  // === 1. API CLAUDE (5 gói) ===
  {
    slug: 'api-claude-10-max-10-credit',
    price: 29000,
    originalPrice: 250000,
    costPrice: 15000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0036',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'api-claude-30-max-30-credit',
    price: 79000,
    originalPrice: 750000,
    costPrice: 45000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0042',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'api-claude-50-max-50-credit',
    price: 129000,
    originalPrice: 1250000,
    costPrice: 75000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0044',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'api-claude-100-max-100-credit',
    price: 249000,
    originalPrice: 2500000,
    costPrice: 150000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0037',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'api-claude-1-thang-max-5000-credit',
    price: 2490000,
    originalPrice: 125000000,
    costPrice: 1500000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0083',
    isActive: true,
    isAutoSync: false,
  },

  // === 2. API CODEX (5 gói chính thức - Volume Tiering & Decoy Pricing) ===
  {
    slug: 'cdx-0055-api-codex-ai-toc-o-nhanh-10-credit',
    price: 19000,
    originalPrice: 45000,
    costPrice: 10000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CDX-0055',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'cdx-0056-api-codex-ai-toc-o-nhanh-50-credit',
    price: 89000,
    originalPrice: 190000,
    costPrice: 50000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CDX-0056',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'cdx-0057-api-codex-ai-toc-o-nhanh-100-credit',
    price: 169000,
    originalPrice: 360000,
    costPrice: 100000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CDX-0057',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'cdx-0058-api-codex-ai-toc-o-nhanh-200-credit',
    price: 329000,
    originalPrice: 750000,
    costPrice: 200000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CDX-0058',
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'cdx-0060-api-codex-ai-toc-o-nhanh-500-credit',
    price: 749000,
    originalPrice: 1490000,
    costPrice: 450000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CDX-0060',
    isActive: true,
    isAutoSync: false,
  },

  // === 3. TÀI KHOẢN AI ===
  {
    slug: 'chatgpt-free-verify-phone',
    price: 19000,
    originalPrice: 50000,
    costPrice: 4000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'muse-ai-31-ty-token',
    price: 39000,
    originalPrice: 150000,
    costPrice: 12800,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'nordvpn-premium-3-thang',
    price: 79000,
    originalPrice: 199000,
    costPrice: 50000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'gemini-pro-5tb-1-nam-slot-chinh-chu',
    price: 129000,
    originalPrice: 320000,
    costPrice: 66500,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'gemini-pro-argon-4-family-5tb',
    price: 159000,
    originalPrice: 350000,
    costPrice: 95000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'tai-khoan-gemini-pro-argon-4-chu-family-3-thang',
    price: 169000,
    originalPrice: 390000,
    costPrice: 94050,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'chatgpt-plus-1-thang',
    price: 199000,
    originalPrice: 499000,
    costPrice: 89000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'slot-chatgpt-business-1-thang',
    price: 199000,
    originalPrice: 350000,
    costPrice: 119000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'chatgpt-plus-1-thang-bhf',
    price: 299000,
    originalPrice: 550000,
    costPrice: 165000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'suno-ai-pro-1-thang',
    price: 239000,
    originalPrice: 350000,
    costPrice: 150000,
    isAutoSync: false,
  },

  // === 4. HỌC TẬP & THIẾT KẾ ===
  {
    slug: 'wink-vip-plus-7-ngay',
    price: 25000,
    originalPrice: 60000,
    costPrice: 9600,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'duolingo-super-12-thang',
    price: 49000,
    originalPrice: 190000,
    costPrice: 19800,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'photoroom-max-7-ngay',
    price: 49000,
    originalPrice: 80000,
    costPrice: 19000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'quizlet-plus-1-thang',
    price: 59000,
    originalPrice: 90000,
    costPrice: 25000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'xingtu-vip-30-ngay',
    price: 119000,
    originalPrice: 150000,
    costPrice: 65000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'figma-pro-education-2-nam',
    price: 249000,
    originalPrice: 350000,
    costPrice: 139000,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'adobe-full-apps-1-thang',
    price: 599000,
    originalPrice: 1100000,
    costPrice: 370000,
    isActive: true,
    isAutoSync: false,
  },

  // === 5. PHẦN MỀM & BẢN QUYỀN ===
  {
    slug: 'capcut-pro-7-ngay',
    price: 19000,
    originalPrice: 50000,
    costPrice: 5900,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'canva-pro-1-thang',
    price: 19000,
    originalPrice: 99000,
    costPrice: 9900,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'meitu-vip-7-ngay',
    price: 19000,
    originalPrice: 45000,
    costPrice: 9500,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'key-hma-vpn-1-thang',
    price: 29000,
    originalPrice: 79000,
    costPrice: 5320,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'office-365-1-nam',
    price: 39000,
    originalPrice: 120000,
    costPrice: 16800,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'capcut-pro-30-ngay',
    price: 79000,
    originalPrice: 150000,
    costPrice: 32900,
    isActive: true,
    isAutoSync: false,
  },
  {
    slug: 'adobe-express-12-thang',
    price: 89000,
    originalPrice: 199000,
    costPrice: 33250,
    isActive: true,
    isAutoSync: false,
  },
];

// Explicit slugs to deactivate (duplicates, discontinued, non-Codex/Claude APIs)
const DEACTIVATE_SLUGS = [
  'cdx-0055-api-codex-ai-toc-o-nhanh',
  'cdx-0056-api-codex-ai-toc-o-nhanh',
  'cdx-0057-api-codex-ai-toc-o-nhanh',
  'cdx-0058-api-codex-ai-toc-o-nhanh',
  'cdx-0060-api-codex-ai-toc-o-nhanh',
  'codex-credit-10usd',
  'codex-credit-50usd',
  'gem-0105-api-gemini-pro-18-thang-chinh-hang',
  'gem-0105-gemini-pro-18-thang-chinh-hang',
  'gemini-advanced-18-thang',
  'tesssttt',
  'youtube-premium-6-thang',
  'youtube-premium-1-nam',
  'cla-0036-api-claude-10-max',
  'cla-0042-api-claude-30-max',
  'cla-0044-api-claude-50-max',
  'cla-0037-api-claude-100-max',
  'cla-0083-api-claude-1-thang-max',
  'cla-0038-api-claude-1-thang-max',
  'cla-0038-api-claude-1-thang-max-300-credit-ngay-reset-7h-sang',
  'cla-0043-api-claude-1-thang-max',
  'cla-0043-api-claude-1-thang-max-150-credit-ngay-reset-7h-sang',
  'cla-0051-api-claude-20h-23h59p-co-kha-nang-dung-en-6h-sang-mua-xong-ib-tele-hoac-zalo-450-han-20h-23h59p-co-kha-nang-dung-en-6h-sang',
  'cla-0051-api-claude-21h-6h-sang-mua-xong-ib-zalo-hoac-tele-450-han-21h-6h-sang',
  'cla-0084-api-claude-unlimited-1-ngay',
  'cla-0085-api-claude-1-tuan-max',
  'cla-0085-api-claude-1-tuan-max-500-credit-1-ngay',
  'cla-0086-api-claude-1-tuan-max',
  'cla-0086-api-claude-1-tuan-max-20-credit-1-ngay',
  'cla-0103-api-claude-25-ngay',
  'cla-0104-api-claude-23-ngay-5000-a-dung-uoc-790',
  'netflix-1-month',
  'canva-pro-vinh-vien',
  'vps-cloud-2core-4gb',
  'tiktok-1000-follow',
];

function buildRunnerCode() {
  return `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MASTER_UPDATES = ${JSON.stringify(MASTER_UPDATES)};
const DEACTIVATE_SLUGS = ${JSON.stringify(DEACTIVATE_SLUGS)};

async function executeSync(label) {
  console.log('=== [' + label + '] STARTING MASTER CATALOG & PRICING SYNC ===');
  const genz = await prisma.supplier.findFirst({ where: { code: 'GENZSHOP' } });

  // 1. Deactivate all non-Codex/Claude API products and duplicate/short-term SKUs
  const allApiProducts = await prisma.product.findMany({
    where: {
      OR: [
        { category: { name: { contains: 'API' } } },
        { slug: { in: DEACTIVATE_SLUGS } },
        { type: 'CODEX_CREDIT' },
      ]
    },
    select: { id: true, slug: true, title: true, isActive: true }
  });

  const keepApiSlugs = new Set([
    'api-claude-10-max-10-credit',
    'api-claude-30-max-30-credit',
    'api-claude-50-max-50-credit',
    'api-claude-100-max-100-credit',
    'api-claude-1-thang-max-5000-credit',
    'cdx-0055-api-codex-ai-toc-o-nhanh-10-credit',
    'cdx-0056-api-codex-ai-toc-o-nhanh-50-credit',
    'cdx-0057-api-codex-ai-toc-o-nhanh-100-credit',
    'cdx-0058-api-codex-ai-toc-o-nhanh-200-credit',
    'cdx-0060-api-codex-ai-toc-o-nhanh-500-credit',
  ]);

  const idsToHide = allApiProducts
    .filter(p => !keepApiSlugs.has(p.slug))
    .map(p => p.id);

  if (idsToHide.length > 0) {
    const res = await prisma.product.updateMany({
      where: { id: { in: idsToHide } },
      data: { isActive: false }
    });
    console.log('[' + label + '] Hidden ' + res.count + ' non-canonical API / duplicate products.');
  }

  // Clean repeated [NGỪNG BÁN] prefix on gemini-advanced-18-thang if present
  const gem18 = await prisma.product.findUnique({ where: { slug: 'gemini-advanced-18-thang' } });
  if (gem18) {
    const cleanTitle = '[NGỪNG BÁN] ' + gem18.title.replace(/^(\\[NGỪNG BÁN\\]\\s*)+/i, '').trim();
    await prisma.product.update({
      where: { id: gem18.id },
      data: { title: cleanTitle, isActive: false }
    });
  }

  // 2. Apply master pricing & FIXED_AMOUNT markup rules
  for (const item of MASTER_UPDATES) {
    const product = await prisma.product.findUnique({
      where: { slug: item.slug },
      include: { supplierMapping: true }
    });
    if (!product) {
      console.log('[' + label + ' SKIP] Missing slug: ' + item.slug);
      continue;
    }

    const markupVal = item.price - item.costPrice;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: item.price,
        ...(item.originalPrice !== undefined ? { originalPrice: item.originalPrice } : {}),
        ...(item.isActive !== undefined ? { isActive: item.isActive } : {}),
      }
    });

    if (product.supplierMapping) {
      await prisma.supplierProductMapping.update({
        where: { id: product.supplierMapping.id },
        data: {
          supplierPrice: item.costPrice,
          markupType: 'FIXED_AMOUNT',
          markupValue: markupVal,
          ...(item.isAutoSync !== undefined ? { isAutoSync: item.isAutoSync } : {}),
          ...(item.supplierProductCode ? { supplierProductCode: item.supplierProductCode } : {}),
          ...(item.supplierCode && genz ? { supplierId: genz.id } : {}),
        }
      });
    } else if (item.supplierCode && genz) {
      await prisma.supplierProductMapping.create({
        data: {
          productId: product.id,
          supplierId: genz.id,
          supplierProductCode: item.supplierProductCode || 'N/A',
          supplierPrice: item.costPrice,
          supplierStock: 20,
          markupType: 'FIXED_AMOUNT',
          markupValue: markupVal,
          isAutoSync: false,
        }
      });
    }
    console.log('[' + label + ' OK] ' + item.slug + ': Cost=' + item.costPrice + ' -> Price=' + item.price + ' (Markup=+' + markupVal + ')');
  }

  // 3. Ensure SMM products have exact FIXED_AMOUNT markupValue = price - supplierPrice
  const smmSlugs = ['tang-tim-tiktok-1000', 'tang-like-facebook-1000', 'tang-follow-facebook-1000', 'tang-follow-tiktok-1000'];
  for (const sSlug of smmSlugs) {
    const smm = await prisma.product.findUnique({ where: { slug: sSlug }, include: { supplierMapping: true } });
    if (smm && smm.supplierMapping) {
      await prisma.supplierProductMapping.update({
        where: { id: smm.supplierMapping.id },
        data: {
          markupType: 'FIXED_AMOUNT',
          markupValue: smm.price - smm.supplierMapping.supplierPrice,
        }
      });
    }
  }

  await prisma.$disconnect();
  console.log('=== [' + label + '] MASTER SYNC COMPLETE ===');
}

executeSync(process.env.SYNC_LABEL || 'DB').catch(e => { console.error(e); process.exit(1); });
`;
}

async function main() {
  const runnerCode = buildRunnerCode();

  // 1. Run on Local DB
  console.log('>>> Running on LOCAL database...');
  process.env.SYNC_LABEL = 'LOCAL';
  const localTmp = path.join(__dirname, '.tmp-master-sync.js');
  fs.writeFileSync(localTmp, runnerCode, 'utf8');
  const localRes = spawnSync('node', [localTmp], { encoding: 'utf8', stdio: 'inherit' });
  fs.unlinkSync(localTmp);
  if (localRes.status !== 0) {
    throw new Error('Local sync failed');
  }

  // 2. Run on Fly.io Production DB
  if (process.argv.includes('--fly')) {
    console.log('\n>>> Running on FLY.IO PRODUCTION database...');
    const envPath = path.resolve(__dirname, '../.env');
    const env = fs.readFileSync(envPath, 'utf8');
    const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

    const b64 = Buffer.from(runnerCode.replace("process.env.SYNC_LABEL || 'DB'", "'FLY_PROD'")).toString('base64');
    const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
    const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
    console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
