const fs = require('fs');
const { spawnSync } = require('child_process');

const targetPlans = [
  // 1. Nhóm API Claude (GenzShop)
  {
    slug: 'api-claude-10-max-10-credit',
    targetPrice: 29000,
    costPrice: 15000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0036',
  },
  {
    slug: 'api-claude-30-max-30-credit',
    targetPrice: 79000,
    costPrice: 45000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0037',
  },
  {
    slug: 'api-claude-50-max-50-credit',
    targetPrice: 129000,
    costPrice: 75000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0038',
  },
  {
    slug: 'api-claude-100-max-100-credit',
    targetPrice: 249000,
    costPrice: 150000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0039',
  },
  {
    slug: 'api-claude-1-thang-max-5000-credit',
    targetPrice: 2490000,
    costPrice: 1500000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0040',
  },

  // 2. Nhóm Tài Khoản AI
  {
    slug: 'chatgpt-plus-1-thang',
    targetPrice: 179000,
    costPrice: 109000,
  },
  {
    slug: 'chatgpt-plus-1-thang-bhf',
    targetPrice: 299000,
    costPrice: 188000,
  },
  {
    slug: 'suno-ai-pro-1-thang',
    targetPrice: 239000,
    costPrice: 150000,
  },
  {
    slug: 'muse-ai-31-ty-token',
    targetPrice: 39000,
    costPrice: 14800,
  },
  {
    slug: 'gemini-pro-argon-4-family-5tb',
    targetPrice: 109000,
    costPrice: 47500,
    isActive: true,
  },

  // 3. Nhóm Phần Mềm & Tiện Ích Bản Quyền
  {
    slug: 'capcut-pro-7-ngay',
    targetPrice: 9900,
    costPrice: 3900,
  },
  {
    slug: 'capcut-pro-30-ngay',
    targetPrice: 79000,
    costPrice: 32900,
  },
  {
    slug: 'office-365-1-nam',
    targetPrice: 39000,
    costPrice: 16800,
  },
  {
    slug: 'key-hma-vpn-1-thang',
    targetPrice: 29000,
    costPrice: 5320,
  },
  {
    slug: 'adobe-express-12-thang',
    targetPrice: 89000,
    costPrice: 33250,
  },

  // 4. Nhóm Học Tập & Thiết Kế Đồ Họa
  {
    slug: 'wink-vip-plus-7-ngay',
    targetPrice: 25000,
    costPrice: 9600,
  },
  {
    slug: 'duolingo-super-12-thang',
    targetPrice: 49000,
    costPrice: 19800,
  },
  {
    slug: 'photoroom-max-7-ngay',
    targetPrice: 49000,
    costPrice: 19000,
  },
  {
    slug: 'quizlet-plus-1-thang',
    targetPrice: 59000,
    costPrice: 25000,
  },
  {
    slug: 'xingtu-vip-30-ngay',
    targetPrice: 119000,
    costPrice: 65000,
  },
  {
    slug: 'figma-pro-education-2-nam',
    targetPrice: 249000,
    costPrice: 139000,
  },
  {
    slug: 'adobe-full-apps-1-thang',
    targetPrice: 599000,
    costPrice: 370000,
  },
];

async function updateDb(prisma, label) {
  console.log(`[${label}] Bắt đầu cập nhật ${targetPlans.length} sản phẩm và cấu hình markup...`);

  let genz = await prisma.supplier.findUnique({ where: { code: 'GENZSHOP' } });

  for (const item of targetPlans) {
    const product = await prisma.product.findUnique({
      where: { slug: item.slug },
      include: { supplierMapping: true },
    });

    if (!product) {
      console.warn(`[${label} WARN] Không tìm thấy slug: ${item.slug}`);
      continue;
    }

    const calculatedMarkup = item.targetPrice - item.costPrice;

    // 1. Cập nhật Product
    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: item.targetPrice,
        ...(item.isActive !== undefined ? { isActive: item.isActive } : {}),
      },
    });

    // 2. Cập nhật SupplierProductMapping để sync cron không bao giờ ghi đè sai giá
    if (product.supplierMapping) {
      await prisma.supplierProductMapping.update({
        where: { id: product.supplierMapping.id },
        data: {
          supplierPrice: item.costPrice,
          markupType: 'FIXED_AMOUNT',
          markupValue: calculatedMarkup,
          ...(item.supplierProductCode ? { supplierProductCode: item.supplierProductCode } : {}),
          ...(item.supplierCode && genz ? { supplierId: genz.id } : {}),
        },
      });
    } else if (item.supplierCode && genz) {
      await prisma.supplierProductMapping.create({
        data: {
          productId: product.id,
          supplierId: genz.id,
          supplierProductCode: item.supplierProductCode || 'N/A',
          supplierPrice: item.costPrice,
          markupType: 'FIXED_AMOUNT',
          markupValue: calculatedMarkup,
          isAutoSync: true,
        },
      });
    }

    console.log(`[${label} OK] ${item.slug} -> Giá: ${item.targetPrice.toLocaleString('vi-VN')}đ | Vốn: ${item.costPrice.toLocaleString('vi-VN')}đ | Markup: +${calculatedMarkup.toLocaleString('vi-VN')}đ`);
  }
}

// Chạy trên Local trước
const { PrismaClient } = require('@prisma/client');
const localPrisma = new PrismaClient();

updateDb(localPrisma, 'LOCAL')
  .then(() => localPrisma.$disconnect())
  .then(() => {
    // Chạy trên Fly.io Production
    console.log('\n--- BẮT ĐẦU CẬP NHẬT FLY.IO PRODUCTION ---');
    const env = fs.readFileSync('.env', 'utf8');
    const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

    const remoteCode = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const targetPlans = ${JSON.stringify(targetPlans)};
      
      async function run() {
        let genz = await prisma.supplier.findUnique({ where: { code: 'GENZSHOP' } });
        for (const item of targetPlans) {
          const product = await prisma.product.findUnique({
            where: { slug: item.slug },
            include: { supplierMapping: true }
          });
          if (!product) continue;
          const calculatedMarkup = item.targetPrice - item.costPrice;
          await prisma.product.update({
            where: { id: product.id },
            data: {
              price: item.targetPrice,
              ...(item.isActive !== undefined ? { isActive: item.isActive } : {})
            }
          });
          if (product.supplierMapping) {
            await prisma.supplierProductMapping.update({
              where: { id: product.supplierMapping.id },
              data: {
                supplierPrice: item.costPrice,
                markupType: 'FIXED_AMOUNT',
                markupValue: calculatedMarkup,
                ...(item.supplierProductCode ? { supplierProductCode: item.supplierProductCode } : {}),
                ...(item.supplierCode && genz ? { supplierId: genz.id } : {})
              }
            });
          }
          console.log('[PROD LOCK OK] ' + item.slug + ' -> ' + item.targetPrice);
        }
        await prisma.$disconnect();
        console.log('=== TOÀN BỘ GIÁ & MARKUP PRODUCTION ĐÃ ĐƯỢC KHÓA CHÍNH XÁC ===');
      }
      run().catch(e => { console.error(e); process.exit(1); });
    `;

    const b64 = Buffer.from(remoteCode).toString('base64');
    const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;

    const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
      env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    });

    console.log(res.stdout);
    if (res.stderr && !res.stderr.includes('Connecting')) {
      console.error(res.stderr);
    }
  })
  .catch(console.error);
