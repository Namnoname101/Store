const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  // 1. Nhóm API Claude (GenzShop)
  {
    slug: 'api-claude-10-max-10-credit',
    price: 29000,
    originalPrice: 250000,
    costPrice: 15000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0036',
  },
  {
    slug: 'api-claude-30-max-30-credit',
    price: 79000,
    originalPrice: 750000,
    costPrice: 45000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0037',
  },
  {
    slug: 'api-claude-50-max-50-credit',
    price: 129000,
    originalPrice: 1250000,
    costPrice: 75000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0038',
  },
  {
    slug: 'api-claude-100-max-100-credit',
    price: 249000,
    originalPrice: 2500000,
    costPrice: 150000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0039',
  },
  {
    slug: 'api-claude-1-thang-max-5000-credit',
    price: 2490000,
    originalPrice: 125000000,
    costPrice: 1500000,
    supplierCode: 'GENZSHOP',
    supplierProductCode: 'CLA-0040',
  },

  // 2. Nhóm Tài Khoản AI
  {
    slug: 'chatgpt-plus-1-thang',
    price: 179000,
    originalPrice: 530000,
    costPrice: 109000,
  },
  {
    slug: 'chatgpt-plus-1-thang-bhf',
    price: 299000,
    originalPrice: 550000,
    costPrice: 188000,
  },
  {
    slug: 'suno-ai-pro-1-thang',
    price: 239000,
    originalPrice: 350000,
    costPrice: 150000,
  },
  {
    slug: 'muse-ai-31-ty-token',
    price: 39000,
    originalPrice: 1500000,
    costPrice: 14800,
  },
  {
    slug: 'gemini-pro-argon-4-family-5tb',
    price: 109000,
    originalPrice: 180000,
    costPrice: 47500,
    isActive: true,
  },

  // 3. Nhóm Phần Mềm & Tiện Ích Bản Quyền
  {
    slug: 'capcut-pro-7-ngay',
    price: 9900,
    originalPrice: 90000,
    costPrice: 3900,
  },
  {
    slug: 'capcut-pro-30-ngay',
    price: 79000,
    originalPrice: 260000,
    costPrice: 32900,
  },
  {
    slug: 'office-365-1-nam',
    price: 39000,
    originalPrice: 2099000,
    costPrice: 16800,
  },
  {
    slug: 'key-hma-vpn-1-thang',
    price: 29000,
    originalPrice: 120000,
    costPrice: 5320,
  },
  {
    slug: 'adobe-express-12-thang',
    price: 89000,
    originalPrice: 2800000,
    costPrice: 33250,
  },

  // 4. Nhóm Học Tập & Thiết Kế Đồ Họa
  {
    slug: 'wink-vip-plus-7-ngay',
    price: 25000,
    originalPrice: 60000,
    costPrice: 9600,
  },
  {
    slug: 'duolingo-super-12-thang',
    price: 49000,
    originalPrice: 1290000,
    costPrice: 19800,
  },
  {
    slug: 'photoroom-max-7-ngay',
    price: 49000,
    originalPrice: 80000,
    costPrice: 19000,
  },
  {
    slug: 'quizlet-plus-1-thang',
    price: 59000,
    originalPrice: 90000,
    costPrice: 25000,
  },
  {
    slug: 'xingtu-vip-30-ngay',
    price: 119000,
    originalPrice: 150000,
    costPrice: 65000,
  },
  {
    slug: 'figma-pro-education-2-nam',
    price: 249000,
    originalPrice: 7200000,
    costPrice: 139000,
  },
  {
    slug: 'adobe-full-apps-1-thang',
    price: 599000,
    originalPrice: 1100000,
    costPrice: 370000,
  },
];

async function main() {
  console.log(`Bắt đầu cập nhật ${updates.length} sản phẩm theo bảng giá mới...`);

  // Tìm supplier GENZSHOP
  let genzSupplier = await prisma.supplier.findUnique({
    where: { code: 'GENZSHOP' },
  });

  for (const item of updates) {
    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      include: { supplierMapping: true },
    });

    if (!existing) {
      console.warn(`[WARN] Không tìm thấy sản phẩm slug: ${item.slug}`);
      continue;
    }

    const dataToUpdate = {
      price: item.price,
      originalPrice: item.originalPrice !== undefined ? item.originalPrice : existing.originalPrice,
    };
    if (item.isActive !== undefined) {
      dataToUpdate.isActive = item.isActive;
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    // Cập nhật supplierMapping nếu có
    if (item.costPrice !== undefined) {
      if (existing.supplierMapping) {
        await prisma.supplierProductMapping.update({
          where: { id: existing.supplierMapping.id },
          data: {
            supplierPrice: item.costPrice,
            ...(item.supplierProductCode ? { supplierProductCode: item.supplierProductCode } : {}),
            ...(item.supplierCode && genzSupplier ? { supplierId: genzSupplier.id } : {}),
          },
        });
      } else if (item.supplierCode && genzSupplier) {
        await prisma.supplierProductMapping.create({
          data: {
            productId: existing.id,
            supplierId: genzSupplier.id,
            supplierProductCode: item.supplierProductCode || 'N/A',
            supplierPrice: item.costPrice,
            markupType: 'FIXED_AMOUNT',
            markupValue: item.price - item.costPrice,
            isAutoSync: false,
          },
        });
      }
    }

    console.log(`[OK] Đã cập nhật ${item.slug}: Giá mới = ${item.price.toLocaleString('vi-VN')}đ (Vốn = ${item.costPrice ? item.costPrice.toLocaleString('vi-VN') + 'đ' : 'N/A'})`);
  }

  console.log('\nHoàn tất cập nhật cơ sở dữ liệu local!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
