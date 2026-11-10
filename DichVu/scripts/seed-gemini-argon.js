const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING GEMINI PRO ARGON 4 FAMILY 5TB ---');

  // 1. Find category
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'ai-tool' },
        { slug: 'tai-khoan-ai' }
      ]
    }
  });
  if (!category) {
    throw new Error('Category for AI accounts not found');
  }
  console.log('Category found:', category.name, category.id);

  // 2. Find supplier Kho MMO (Partner API)
  const supplier = await prisma.supplier.findFirst({
    where: {
      type: 'KHOMMO_API'
    }
  });
  if (!supplier) {
    throw new Error('Supplier Kho MMO (KHOMMO_API) not found');
  }
  console.log('Supplier found:', supplier.name, supplier.id, supplier.type);

  // 3. Upsert product
  const product = await prisma.product.upsert({
    where: { slug: 'gemini-pro-argon-4-family-5tb' },
    update: {
      title: 'Tài Khoản Gemini Pro 5TB, Argon 4 Hạn 2 Năm (Chủ Family) - Gói KBH',
      price: 79000,
      originalPrice: 180000,
      description: 'Tài khoản Google Gemini Pro bản quyền (Chủ Family) sở hữu 5TB lưu trữ Google One, kích hoạt sẵn mô hình Gemini 4 Argon và Gemini 3.8 Flash trong Google Antigravity & AI Studio. Được toàn quyền mời tối đa 5 tài khoản Gmail khác vào nhóm Family để cùng dùng chung quyền lợi.',
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-argon-family.svg',
      isActive: true,
    },
    create: {
      title: 'Tài Khoản Gemini Pro 5TB, Argon 4 Hạn 2 Năm (Chủ Family) - Gói KBH',
      slug: 'gemini-pro-argon-4-family-5tb',
      price: 79000,
      originalPrice: 180000,
      description: 'Tài khoản Google Gemini Pro bản quyền (Chủ Family) sở hữu 5TB lưu trữ Google One, kích hoạt sẵn mô hình Gemini 4 Argon và Gemini 3.8 Flash trong Google Antigravity & AI Studio. Được toàn quyền mời tối đa 5 tài khoản Gmail khác vào nhóm Family để cùng dùng chung quyền lợi.',
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-argon-family.svg',
      isActive: true,
    }
  });
  console.log('Product upserted:', product.title, product.id);

  // 4. Upsert mapping to Kho MMO #3483
  const mapping = await prisma.supplierProductMapping.upsert({
    where: { productId: product.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: '3483',
      supplierPrice: 47500,
      supplierStock: 16,
      markupType: 'FIXED_AMOUNT',
      markupValue: 31500,
      isAutoSync: true,
    },
    create: {
      productId: product.id,
      supplierId: supplier.id,
      supplierProductCode: '3483',
      supplierPrice: 47500,
      supplierStock: 16,
      markupType: 'FIXED_AMOUNT',
      markupValue: 31500,
      isAutoSync: true,
    }
  });
  console.log('SupplierProductMapping upserted to #3483:', mapping.id);
  console.log('DONE!');
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
