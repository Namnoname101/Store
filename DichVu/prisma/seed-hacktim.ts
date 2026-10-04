import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding HackTim supplier and TikTok / Facebook products...");

  // 1. Create or update Supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "HACKTIM" },
    update: {
      name: "HackTim SMM",
      type: "HACKTIM",
      baseUrl: "https://hacktim.com/api/v2",
      apiKey: "e0d72b6a7f53ee2e9103b85914e11dc5",
      apiSecret: "27000",
      isActive: true,
    },
    create: {
      code: "HACKTIM",
      name: "HackTim SMM",
      type: "HACKTIM",
      baseUrl: "https://hacktim.com/api/v2",
      apiKey: "e0d72b6a7f53ee2e9103b85914e11dc5",
      apiSecret: "27000",
      currentBalance: 418,
      isActive: true,
    },
  });

  console.log("Supplier:", supplier.name);

  // 2. Create or update Category
  const category = await prisma.category.upsert({
    where: { slug: "dich-vu-mxh" },
    update: {
      name: "Dịch vụ MXH (TikTok, Facebook)",
      description: "Tăng tim, follow, like TikTok & Facebook tự động siêu tốc",
    },
    create: {
      name: "Dịch vụ MXH (TikTok, Facebook)",
      slug: "dich-vu-mxh",
      description: "Tăng tim, follow, like TikTok & Facebook tự động siêu tốc",
    },
  });

  console.log("Category:", category.name);

  // 3. Define products
  const productsToSeed = [
    {
      title: "Gói 1.000 Tim TikTok Việt Nam (Siêu Tốc)",
      slug: "tang-tim-tiktok-1000",
      description: `Tăng 1.000 tim/like cho video TikTok Việt Nam chất lượng cao.
Khởi chạy tự động sau khi thanh toán, tốc độ cao, tỷ lệ tụt cực thấp.
Vui lòng nhập chính xác link video TikTok công khai cần tăng tim.`,
      price: 25000,
      originalPrice: 45000,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      thumbnailUrl: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "6799",
      supplierPrice: 4000,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 21000,
    },
    {
      title: "Gói 1.000 Follower TikTok Việt Nam",
      slug: "tang-follow-tiktok-1000",
      description: `Tăng 1.000 người theo dõi (Followers) kênh TikTok Việt Nam thật.
Giúp bật tính năng phát trực tiếp (Livestream) và mở giỏ hàng TikTok Shop nhanh chóng.
Vui lòng nhập link profile kênh TikTok (dạng https://www.tiktok.com/@username).`,
      price: 69000,
      originalPrice: 119000,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      thumbnailUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "6803",
      supplierPrice: 20000,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 49000,
    },
    {
      title: "Gói 1.000 Like Bài Viết Facebook",
      slug: "tang-like-facebook-1000",
      description: `Tăng 1.000 lượt like/cảm xúc bài viết Facebook Việt Nam người dùng thật.
Đẩy tương tác bán hàng, uy tín cho bài viết trên trang cá nhân hoặc fanpage.
Vui lòng để bài viết ở chế độ Công khai (Public).`,
      price: 35000,
      originalPrice: 60000,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      thumbnailUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "6741",
      supplierPrice: 8000,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 27000,
    },
    {
      title: "Gói 1.000 Follower Facebook (Profile/Page)",
      slug: "tang-follow-facebook-1000",
      description: `Tăng 1.000 lượt theo dõi trang cá nhân hoặc Fanpage Facebook Việt Nam.
Tài khoản Việt Nam chất lượng cao, độ ổn định cao, bảo hành ít tụt.
Vui lòng bật tính năng cho phép người theo dõi công khai.`,
      price: 49000,
      originalPrice: 89000,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "6709",
      supplierPrice: 12000,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 37000,
    },
  ];

  for (const item of productsToSeed) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        type: item.type,
        fulfillmentType: item.fulfillmentType,
        thumbnailUrl: item.thumbnailUrl,
        categoryId: category.id,
        isActive: true,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        type: item.type,
        fulfillmentType: item.fulfillmentType,
        thumbnailUrl: item.thumbnailUrl,
        categoryId: category.id,
        isActive: true,
      },
    });

    await prisma.supplierProductMapping.upsert({
      where: { productId: product.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: item.supplierProductCode,
        supplierPrice: item.supplierPrice,
        supplierStock: item.supplierStock,
        markupType: item.markupType,
        markupValue: item.markupValue,
        isAutoSync: true,
      },
      create: {
        productId: product.id,
        supplierId: supplier.id,
        supplierProductCode: item.supplierProductCode,
        supplierPrice: item.supplierPrice,
        supplierStock: item.supplierStock,
        markupType: item.markupType,
        markupValue: item.markupValue,
        isAutoSync: true,
      },
    });

    console.log(`Product synced: ${product.title} -> HackTim Service #${item.supplierProductCode}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
