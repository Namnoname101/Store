const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Starting ChatGPT products sync on production DB...");

  // 1. Find or create AI Category
  let category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'tai-khoan-ai' },
        { name: 'Tài Khoản AI' },
        { slug: 'ai-tools' }
      ]
    }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Tài Khoản AI',
        slug: 'tai-khoan-ai',
        icon: 'Bot'
      }
    });
    console.log("Created category 'Tài Khoản AI':", category.id);
  } else {
    console.log("Using existing category:", category.name, category.id);
  }

  // Find suppliers
  const dkeySupplier = await prisma.supplier.findFirst({ where: { code: 'DKEY_TELE' } });
  const dshopSupplier = await prisma.supplier.findFirst({ where: { code: 'DSHOP_TELE' } });
  const xoainonSupplier = await prisma.supplier.findFirst({ where: { code: 'XOAINON_TELE' } });

  console.log("Suppliers loaded:", {
    DKEY: dkeySupplier?.id,
    DSHOP: dshopSupplier?.id,
    XOAINON: xoainonSupplier?.id
  });

  // 2. Product 1: Slot ChatGPT Business 1 Tháng BHF
  const p1Slug = 'slot-chatgpt-business-1-thang';
  let p1 = await prisma.product.findUnique({ where: { slug: p1Slug } });
  const p1Data = {
    title: 'Slot ChatGPT Business Dùng Chung 1 Tháng (Bảo Hành Full 30 Ngày - BHF)',
    slug: p1Slug,
    description: 'Sử dụng tài khoản trong Workspace ChatGPT Business riêng tư. Truy cập không giới hạn GPT-4o, o3-mini, Canvas, tạo ảnh DALL-E, giới hạn tin nhắn cao hơn gói Plus thông thường. Bảo hành Full 30 ngày 1-đổi-1.',
    price: 199000,
    originalPrice: 350000,
    type: 'ACCOUNT',
    fulfillmentType: 'API_DROPSHIP',
    isActive: true,
    categoryId: category.id,
    thumbnailUrl: '/images/products/chatgpt-plus.svg',
  };

  if (!p1) {
    p1 = await prisma.product.create({ data: p1Data });
    console.log("Created Product 1:", p1.title, p1.id);
  } else {
    p1 = await prisma.product.update({ where: { id: p1.id }, data: p1Data });
    console.log("Updated Product 1:", p1.title, p1.id);
  }

  if (dkeySupplier) {
    await prisma.supplierProductMapping.upsert({
      where: { productId: p1.id },
      create: {
        productId: p1.id,
        supplierId: dkeySupplier.id,
        supplierProductCode: '6aa4079751155c938b655d88',
        supplierPrice: 119000,
        supplierStock: 26,
        markupType: 'PERCENTAGE',
        markupValue: 67,
        customConfig: JSON.stringify({
          retailPrice: 199000,
          ctvPrice: 175000,
          alternativeSuppliers: [
            { supplierCode: 'DKEY_API', supplierProductCode: '6aa4079751155c938b655d88', supplierPrice: 119000 }
          ]
        })
      },
      update: {
        supplierId: dkeySupplier.id,
        supplierProductCode: '6aa4079751155c938b655d88',
        supplierPrice: 119000,
        supplierStock: 26,
        markupType: 'PERCENTAGE',
        markupValue: 67,
        customConfig: JSON.stringify({
          retailPrice: 199000,
          ctvPrice: 175000,
          alternativeSuppliers: [
            { supplierCode: 'DKEY_API', supplierProductCode: '6aa4079751155c938b655d88', supplierPrice: 119000 }
          ]
        })
      }
    });
    console.log("Mapped Product 1 to DKEY_TELE (119.000đ)");
  }

  // 3. Product 2: Acc ChatGPT Free Verify Phone
  const p2Slug = 'chatgpt-free-verify-phone';
  let p2 = await prisma.product.findUnique({ where: { slug: p2Slug } });
  const p2Data = {
    title: 'Tài Khoản ChatGPT Free Đã Kích Hoạt Phone (Codex / Cursor / API)',
    slug: p2Slug,
    description: 'Tài khoản ChatGPT sạch đã kích hoạt sẵn số điện thoại quốc tế (SMS Verified). Đăng nhập dùng ngay hoặc trích xuất token cho Cursor, VS Code (Roo Code / Cline), Aider, Codex mà không bị OpenAI bắt xác minh SMS.',
    price: 19000,
    originalPrice: 50000,
    type: 'ACCOUNT',
    fulfillmentType: 'API_DROPSHIP',
    isActive: true,
    categoryId: category.id,
    thumbnailUrl: '/images/products/chatgpt-plus.svg',
  };

  if (!p2) {
    p2 = await prisma.product.create({ data: p2Data });
    console.log("Created Product 2:", p2.title, p2.id);
  } else {
    p2 = await prisma.product.update({ where: { id: p2.id }, data: p2Data });
    console.log("Updated Product 2:", p2.title, p2.id);
  }

  if (dshopSupplier) {
    await prisma.supplierProductMapping.upsert({
      where: { productId: p2.id },
      create: {
        productId: p2.id,
        supplierId: dshopSupplier.id,
        supplierProductCode: 'prod:4:2',
        supplierPrice: 4000,
        supplierStock: 129,
        markupType: 'PERCENTAGE',
        markupValue: 375,
        customConfig: JSON.stringify({
          retailPrice: 19000,
          ctvPrice: 12000
        })
      },
      update: {
        supplierId: dshopSupplier.id,
        supplierProductCode: 'prod:4:2',
        supplierPrice: 4000,
        supplierStock: 129,
        markupType: 'PERCENTAGE',
        markupValue: 375,
        customConfig: JSON.stringify({
          retailPrice: 19000,
          ctvPrice: 12000
        })
      }
    });
    console.log("Mapped Product 2 to DSHOP_TELE (4.000đ)");
  }

  // 4. Update Product 3: chatgpt-plus-1-thang-bhf -> Switch primary to DKEY_TELE (165.000đ)
  const p3 = await prisma.product.findUnique({ where: { slug: 'chatgpt-plus-1-thang-bhf' } });
  if (p3 && dkeySupplier) {
    await prisma.supplierProductMapping.upsert({
      where: { productId: p3.id },
      create: {
        productId: p3.id,
        supplierId: dkeySupplier.id,
        supplierProductCode: '6af3cae3f438034400606787',
        supplierPrice: 165000,
        supplierStock: 90,
        markupType: 'PERCENTAGE',
        markupValue: 81,
        customConfig: JSON.stringify({
          retailPrice: 299000,
          ctvPrice: 265000,
          alternativeSuppliers: [
            { supplierCode: 'XOAINON_TELE', supplierProductCode: '1', supplierPrice: 188000 },
            { supplierCode: 'DKEY_API', supplierProductCode: '6af3cae3f438034400606787', supplierPrice: 165000 }
          ]
        })
      },
      update: {
        supplierId: dkeySupplier.id,
        supplierProductCode: '6af3cae3f438034400606787',
        supplierPrice: 165000,
        supplierStock: 90,
        markupType: 'PERCENTAGE',
        markupValue: 81,
        customConfig: JSON.stringify({
          retailPrice: 299000,
          ctvPrice: 265000,
          alternativeSuppliers: [
            { supplierCode: 'XOAINON_TELE', supplierProductCode: '1', supplierPrice: 188000 },
            { supplierCode: 'DKEY_API', supplierProductCode: '6af3cae3f438034400606787', supplierPrice: 165000 }
          ]
        })
      }
    });
    console.log("Updated Product 3 (BHF) -> Primary DKEY_TELE 165.000đ (Fallback XOAINON #1 188.000đ)");
  }

  // 5. Update Product 4: chatgpt-plus-1-thang -> Update supplierPrice to 109.000đ
  const p4 = await prisma.product.findUnique({ where: { slug: 'chatgpt-plus-1-thang' } });
  if (p4 && xoainonSupplier) {
    await prisma.supplierProductMapping.upsert({
      where: { productId: p4.id },
      create: {
        productId: p4.id,
        supplierId: xoainonSupplier.id,
        supplierProductCode: '37',
        supplierPrice: 109000,
        supplierStock: 49,
        markupType: 'PERCENTAGE',
        markupValue: 64,
        customConfig: JSON.stringify({
          retailPrice: 179000,
          ctvPrice: 159000,
          alternativeSuppliers: [
            { supplierCode: 'DKEY_API', supplierProductCode: '6aed24fbed839c4b838b0370', supplierPrice: 115000 },
            { supplierCode: 'DKEY_TELE', supplierProductCode: '6aed24fbed839c4b838b0370', supplierPrice: 115000 }
          ]
        })
      },
      update: {
        supplierId: xoainonSupplier.id,
        supplierProductCode: '37',
        supplierPrice: 109000,
        supplierStock: 49,
        markupType: 'PERCENTAGE',
        markupValue: 64,
        customConfig: JSON.stringify({
          retailPrice: 179000,
          ctvPrice: 159000,
          alternativeSuppliers: [
            { supplierCode: 'DKEY_API', supplierProductCode: '6aed24fbed839c4b838b0370', supplierPrice: 115000 },
            { supplierCode: 'DKEY_TELE', supplierProductCode: '6aed24fbed839c4b838b0370', supplierPrice: 115000 }
          ]
        })
      }
    });
    console.log("Updated Product 4 (24H) -> XOAINON_TELE 109.000đ (Fallback DKEY 115.000đ)");
  }

  console.log("ALL 4 CHATGPT PRODUCTS SYNC COMPLETED SUCCESSFULLY!");
  await prisma.$disconnect();
}

run().catch(console.error);
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
if (res.stderr) console.error('STDERR:', res.stderr);
