const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== SYNCING GEMINI PRODUCTS FROM KHOMMO ===");

  // 1. Find supplier
  const supplier = await prisma.supplier.findFirst({
    where: { type: 'KHOMMO_API' }
  });
  if (!supplier) {
    throw new Error("KHOMMO_API supplier not found in DB!");
  }
  console.log(`Found KhoMMO supplier: ${supplier.name} (${supplier.id})`);

  // 2. Fetch live stock and price from KhoMMO
  const baseUrl = (supplier.baseUrl || 'https://api.khommo.vn/api/partner/v1').replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/products?limit=500`, {
    headers: {
      Authorization: `Bearer ${supplier.apiKey}`,
      Accept: 'application/json'
    }
  });

  let live3087Stock = 397;
  let live3087Price = 66500;
  let live3556Stock = 14;
  let live3556Price = 94050;
  let live3483Stock = 0;
  let live3483Price = 47500;

  if (res.ok) {
    const json = await res.json();
    const products = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    const p3087 = products.find(p => String(p.id) === '3087');
    if (p3087) {
      live3087Stock = p3087.stock ?? 397;
      live3087Price = p3087.priceVnd || p3087.price || 66500;
      console.log(`KhoMMO #3087 live: stock=${live3087Stock}, price=${live3087Price}`);
    }
    const p3556 = products.find(p => String(p.id) === '3556');
    if (p3556) {
      live3556Stock = p3556.stock ?? 14;
      live3556Price = p3556.priceVnd || p3556.price || 94050;
      console.log(`KhoMMO #3556 live: stock=${live3556Stock}, price=${live3556Price}`);
    }
    const p3483 = products.find(p => String(p.id) === '3483');
    if (p3483) {
      live3483Stock = p3483.stock ?? 0;
      live3483Price = p3483.priceVnd || p3483.price || 47500;
      console.log(`KhoMMO #3483 live: stock=${live3483Stock}, price=${live3483Price}`);
    }
  }

  // 3. Find category
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

  // 4. Product 1: Slot Gemini Pro 5TB 1 Năm (Nâng Mail Chính Chủ)
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
  console.log(`Upserted Product 1: ${product1.title} (${product1.id})`);

  await prisma.supplierProductMapping.upsert({
    where: { productId: product1.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: '3087',
      supplierPrice: live3087Price,
      supplierStock: live3087Stock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 12500,
      isAutoSync: true,
      customConfig: JSON.stringify({
        alternativeSuppliers: [
          { supplierCode: 'DKEY_API', supplierProductCode: '6ae8666b5edeecad99c77919', supplierPrice: 80000 }
        ]
      })
    },
    create: {
      productId: product1.id,
      supplierId: supplier.id,
      supplierProductCode: '3087',
      supplierPrice: live3087Price,
      supplierStock: live3087Stock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 12500,
      isAutoSync: true,
      customConfig: JSON.stringify({
        alternativeSuppliers: [
          { supplierCode: 'DKEY_API', supplierProductCode: '6ae8666b5edeecad99c77919', supplierPrice: 80000 }
        ]
      })
    }
  });
  console.log(`✓ Mapped Product 1 -> KhoMMO #3087 (Stock: ${live3087Stock})`);

  // 5. Product 2: Tài Khoản Gemini Pro 5TB Argon 4 (Chủ Family Mời 5 Gmail) 3 Tháng
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
  console.log(`Upserted Product 2: ${product2.title} (${product2.id})`);

  await prisma.supplierProductMapping.upsert({
    where: { productId: product2.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: '3556',
      supplierPrice: live3556Price,
      supplierStock: live3556Stock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 24950,
      isAutoSync: true,
    },
    create: {
      productId: product2.id,
      supplierId: supplier.id,
      supplierProductCode: '3556',
      supplierPrice: live3556Price,
      supplierStock: live3556Stock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 24950,
      isAutoSync: true,
    }
  });
  console.log(`✓ Mapped Product 2 -> KhoMMO #3556 (Stock: ${live3556Stock})`);

  // 6. Product 3: Existing Gemini Pro Argon 4 Family 2 Năm (KhoMMO #3483)
  const product3 = await prisma.product.findFirst({
    where: { slug: 'gemini-pro-argon-4-family-5tb' }
  });
  if (product3) {
    await prisma.product.update({
      where: { id: product3.id },
      data: {
        price: 109000,
        originalPrice: 250000,
        isActive: true,
      }
    });
    await prisma.supplierProductMapping.upsert({
      where: { productId: product3.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: '3483',
        supplierPrice: live3483Price,
        supplierStock: live3483Stock,
        markupType: 'FIXED_AMOUNT',
        markupValue: 61500,
        isAutoSync: true,
      },
      create: {
        productId: product3.id,
        supplierId: supplier.id,
        supplierProductCode: '3483',
        supplierPrice: live3483Price,
        supplierStock: live3483Stock,
        markupType: 'FIXED_AMOUNT',
        markupValue: 61500,
        isAutoSync: true,
      }
    });
    console.log(`✓ Updated Product 3 -> KhoMMO #3483 (Stock: ${live3483Stock})`);
  }

  console.log("=== ALL GEMINI PRODUCTS SUCCESSFULLY SYNCED! ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
