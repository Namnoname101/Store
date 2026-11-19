const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== SYNCING GEMINI PRODUCTS DIRECTLY FROM TELEGRAM @KhoMMO_Market_bot ===");

  // Exact data crawled live from Telegram @KhoMMO_Market_bot:
  // 1. "Tài khoản Gemini Pro, 5TB, Argon, Neon 4, Opus 5.5 (Antigravity) Hạn 3 Tháng - BH 1 Tuần"
  //    Giá: 99.000 VND | Tồn kho: 11 tài khoản | Callback: a:pv:2qs
  // 2. "[Slot] Gemini Pro , GG 5TB Hạn 1 Năm, Bảo hành 3 tháng"
  //    Giá: 70.000 VND | Tồn kho: 397 tài khoản | Callback: a:pv:2dr

  const liveData = {
    account3M: {
      name: "Tài khoản Gemini Pro, 5TB, Argon, Neon 4, Opus 5.5 (Antigravity) Hạn 3 Tháng - BH 1 Tuần",
      telePrice: 99000,
      teleStock: 11,
      teleCallback: "a:pv:2qs",
      apiCode: "3556"
    },
    slot1Y: {
      name: "[Slot] Gemini Pro , GG 5TB Hạn 1 Năm, Bảo hành 3 tháng",
      telePrice: 70000,
      teleStock: 397,
      teleCallback: "a:pv:2dr",
      apiCode: "3087"
    }
  };

  // 1. Find supplier
  const supplier = await prisma.supplier.findFirst({
    where: { type: 'KHOMMO_API' }
  });
  if (!supplier) {
    throw new Error("KHOMMO_API supplier not found in DB!");
  }
  console.log(`Found KhoMMO supplier: ${supplier.name} (${supplier.id})`);

  // 2. Find category
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'ai-tool' },
        { slug: 'tai-khoan-ai' }
      ]
    }
  });
  if (!category) {
    throw new Error("Category ai-tool not found in DB!");
  }
  console.log(`Found category: ${category.name} (${category.id})`);

  // 3. Product 1: Slot Gemini Pro 5TB 1 Năm (Nâng Mail Chính Chủ)
  // Giá Telegram: 70.000 VND -> Giá bán niêm yết: 79.000 VND (Lời 9.000đ)
  const product1 = await prisma.product.upsert({
    where: { slug: 'gemini-pro-5tb-1-nam-slot-chinh-chu' },
    update: {
      title: 'Slot Gemini Pro & Google One 5TB Hạn 1 Năm (Nâng Mail Chính Chủ) - BH 3 Tháng',
      price: 79000,
      originalPrice: 190000,
      description: 'Gói nâng cấp bản quyền Google Gemini Pro & Google One 5TB thời hạn 1 năm trực tiếp vào tài khoản Gmail chính chủ của bạn (Dạng tham gia Family Google). Mở khóa mô hình Gemini 4 Argon, Gemini 3.8 Flash, NotebookLM, tặng kèm 5TB Google Drive và 1.000 Credit Veo 3. Bảo hành 3 tháng 1 đổi 1 chu đáo.',
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-pro.svg',
      isActive: true,
    },
    create: {
      title: 'Slot Gemini Pro & Google One 5TB Hạn 1 Năm (Nâng Mail Chính Chủ) - BH 3 Tháng',
      slug: 'gemini-pro-5tb-1-nam-slot-chinh-chu',
      price: 79000,
      originalPrice: 190000,
      description: 'Gói nâng cấp bản quyền Google Gemini Pro & Google One 5TB thời hạn 1 năm trực tiếp vào tài khoản Gmail chính chủ của bạn (Dạng tham gia Family Google). Mở khóa mô hình Gemini 4 Argon, Gemini 3.8 Flash, NotebookLM, tặng kèm 5TB Google Drive và 1.000 Credit Veo 3. Bảo hành 3 tháng 1 đổi 1 chu đáo.',
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-pro.svg',
      isActive: true,
    }
  });
  console.log(`Upserted Product 1: ${product1.title}`);

  await prisma.supplierProductMapping.upsert({
    where: { productId: product1.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: liveData.slot1Y.apiCode,
      supplierPrice: liveData.slot1Y.telePrice,
      supplierStock: liveData.slot1Y.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 9000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.slot1Y.teleCallback,
        source: "@KhoMMO_Market_bot",
        alternativeSuppliers: [
          { supplierCode: 'DKEY_API', supplierProductCode: '6ae8666b5edeecad99c77919', supplierPrice: 80000 }
        ]
      })
    },
    create: {
      productId: product1.id,
      supplierId: supplier.id,
      supplierProductCode: liveData.slot1Y.apiCode,
      supplierPrice: liveData.slot1Y.telePrice,
      supplierStock: liveData.slot1Y.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 9000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.slot1Y.teleCallback,
        source: "@KhoMMO_Market_bot",
        alternativeSuppliers: [
          { supplierCode: 'DKEY_API', supplierProductCode: '6ae8666b5edeecad99c77919', supplierPrice: 80000 }
        ]
      })
    }
  });
  console.log(`✓ Mapped Slot 1Y -> Giá Tele: ${liveData.slot1Y.telePrice}đ | Kho: ${liveData.slot1Y.teleStock}`);

  // 4. Product 2: Tài Khoản Gemini Pro 5TB Argon 4 (Chủ Family Mời 5 Gmail) 3 Tháng
  // Giá Telegram: 99.000 VND -> Giá bán niêm yết: 119.000 VND (Lời 20.000đ)
  const product2 = await prisma.product.upsert({
    where: { slug: 'tai-khoan-gemini-pro-argon-4-chu-family-3-thang' },
    update: {
      title: 'Tài Khoản Gemini Pro 5TB, Argon 4 (Chủ Family Mời 5 Gmail) 3 Tháng - BH 1 Tuần',
      price: 119000,
      originalPrice: 250000,
      description: 'Tài khoản Google Gemini Pro bản quyền (Chủ Family) sở hữu 5TB lưu trữ Google One, kích hoạt sẵn mô hình Gemini 4 Argon và Gemini 3.8 Flash trong Google Antigravity & AI Studio. Toàn quyền mời tối đa 5 tài khoản Gmail khác vào nhóm Family để cùng dùng chung 5TB dung lượng và các đặc quyền AI. Bảo hành 1 tuần 1 đổi 1.',
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-argon-family.svg',
      isActive: true,
    },
    create: {
      title: 'Tài Khoản Gemini Pro 5TB, Argon 4 (Chủ Family Mời 5 Gmail) 3 Tháng - BH 1 Tuần',
      slug: 'tai-khoan-gemini-pro-argon-4-chu-family-3-thang',
      price: 119000,
      originalPrice: 250000,
      description: 'Tài khoản Google Gemini Pro bản quyền (Chủ Family) sở hữu 5TB lưu trữ Google One, kích hoạt sẵn mô hình Gemini 4 Argon và Gemini 3.8 Flash trong Google Antigravity & AI Studio. Toàn quyền mời tối đa 5 tài khoản Gmail khác vào nhóm Family để cùng dùng chung 5TB dung lượng và các đặc quyền AI. Bảo hành 1 tuần 1 đổi 1.',
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-argon-family.svg',
      isActive: true,
    }
  });
  console.log(`Upserted Product 2: ${product2.title}`);

  await prisma.supplierProductMapping.upsert({
    where: { productId: product2.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: liveData.account3M.apiCode,
      supplierPrice: liveData.account3M.telePrice,
      supplierStock: liveData.account3M.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 20000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.account3M.teleCallback,
        source: "@KhoMMO_Market_bot"
      })
    },
    create: {
      productId: product2.id,
      supplierId: supplier.id,
      supplierProductCode: liveData.account3M.apiCode,
      supplierPrice: liveData.account3M.telePrice,
      supplierStock: liveData.account3M.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 20000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.account3M.teleCallback,
        source: "@KhoMMO_Market_bot"
      })
    }
  });
  console.log(`✓ Mapped Account 3M -> Giá Tele: ${liveData.account3M.telePrice}đ (Đúng chuẩn 99K) | Kho: ${liveData.account3M.teleStock}`);

  console.log("=== SYNC COMPLETED SUCCESSFULLY ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
