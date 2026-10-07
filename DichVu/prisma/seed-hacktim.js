"use strict";

// prisma/seed-hacktim.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();
async function main() {
  console.log("Seeding HackTim supplier and TikTok / Facebook products...");
  const supplier = await prisma.supplier.upsert({
    where: { code: "HACKTIM" },
    update: {
      name: "HackTim SMM",
      type: "HACKTIM",
      baseUrl: "https://hacktim.com/api/v2",
      apiKey: "e0d72b6a7f53ee2e9103b85914e11dc5",
      apiSecret: "27000",
      isActive: true
    },
    create: {
      code: "HACKTIM",
      name: "HackTim SMM",
      type: "HACKTIM",
      baseUrl: "https://hacktim.com/api/v2",
      apiKey: "e0d72b6a7f53ee2e9103b85914e11dc5",
      apiSecret: "27000",
      currentBalance: 418,
      isActive: true
    }
  });
  console.log("Supplier:", supplier.name);
  const category = await prisma.category.upsert({
    where: { slug: "dich-vu-mxh" },
    update: {
      name: "D\u1ECBch v\u1EE5 MXH (TikTok, Facebook)",
      description: "T\u0103ng tim, follow, like TikTok & Facebook t\u1EF1 \u0111\u1ED9ng si\xEAu t\u1ED1c"
    },
    create: {
      name: "D\u1ECBch v\u1EE5 MXH (TikTok, Facebook)",
      slug: "dich-vu-mxh",
      description: "T\u0103ng tim, follow, like TikTok & Facebook t\u1EF1 \u0111\u1ED9ng si\xEAu t\u1ED1c"
    }
  });
  console.log("Category:", category.name);
  const productsToSeed = [
    {
      title: "T\u0103ng Tim / Like TikTok Vi\u1EC7t Nam (Si\xEAu T\u1ED1c)",
      slug: "tang-tim-tiktok-1000",
      description: `T\u0103ng tim/like cho video TikTok Vi\u1EC7t Nam ch\u1EA5t l\u01B0\u1EE3ng cao.
Kh\u1EDFi ch\u1EA1y t\u1EF1 \u0111\u1ED9ng sau khi thanh to\xE1n, t\u1ED1c \u0111\u1ED9 cao, t\u1EF7 l\u1EC7 t\u1EE5t c\u1EF1c th\u1EA5p.
Vui l\xF2ng nh\u1EADp ch\xEDnh x\xE1c link video TikTok c\xF4ng khai c\u1EA7n t\u0103ng tim.`,
      price: 25,
      originalPrice: 45,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      minQuantity: 50,
      maxQuantity: 15e3,
      thumbnailUrl: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "6799",
      supplierPrice: 4,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 21
    },
    {
      title: "T\u0103ng Follower TikTok Vi\u1EC7t Nam",
      slug: "tang-follow-tiktok-1000",
      description: `T\u0103ng ng\u01B0\u1EDDi theo d\xF5i (Followers) k\xEAnh TikTok Vi\u1EC7t Nam th\u1EADt.
Gi\xFAp b\u1EADt t\xEDnh n\u0103ng ph\xE1t tr\u1EF1c ti\u1EBFp (Livestream) v\xE0 m\u1EDF gi\u1ECF h\xE0ng TikTok Shop nhanh ch\xF3ng.
Vui l\xF2ng nh\u1EADp link profile k\xEAnh TikTok (d\u1EA1ng https://www.tiktok.com/@username).`,
      price: 69,
      originalPrice: 119,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      minQuantity: 50,
      maxQuantity: 1e7,
      thumbnailUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "6803",
      supplierPrice: 20,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 49
    },
    {
      title: "T\u0103ng Like B\xE0i Vi\u1EBFt Facebook",
      slug: "tang-like-facebook-1000",
      description: `T\u0103ng l\u01B0\u1EE3t like/c\u1EA3m x\xFAc b\xE0i vi\u1EBFt Facebook Vi\u1EC7t Nam ng\u01B0\u1EDDi d\xF9ng th\u1EADt.
\u0110\u1EA9y t\u01B0\u01A1ng t\xE1c b\xE1n h\xE0ng, uy t\xEDn cho b\xE0i vi\u1EBFt tr\xEAn trang c\xE1 nh\xE2n ho\u1EB7c fanpage.
Vui l\xF2ng \u0111\u1EC3 b\xE0i vi\u1EBFt \u1EDF ch\u1EBF \u0111\u1ED9 C\xF4ng khai (Public).`,
      price: 35,
      originalPrice: 60,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      minQuantity: 50,
      maxQuantity: 2e3,
      thumbnailUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "6741",
      supplierPrice: 8,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 27
    },
    {
      title: "T\u0103ng Follower Facebook (Profile/Page)",
      slug: "tang-follow-facebook-1000",
      description: `T\u0103ng l\u01B0\u1EE3t theo d\xF5i trang c\xE1 nh\xE2n ho\u1EB7c Fanpage Facebook Vi\u1EC7t Nam.
T\xE0i kho\u1EA3n Vi\u1EC7t Nam ch\u1EA5t l\u01B0\u1EE3ng cao, \u0111\u1ED9 \u1ED5n \u0111\u1ECBnh cao, b\u1EA3o h\xE0nh \xEDt t\u1EE5t.
Vui l\xF2ng b\u1EADt t\xEDnh n\u0103ng cho ph\xE9p ng\u01B0\u1EDDi theo d\xF5i c\xF4ng khai.`,
      price: 49,
      originalPrice: 89,
      type: "COURSE_LINK",
      fulfillmentType: "API_DROPSHIP",
      minQuantity: 10,
      maxQuantity: 500000,
      thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
      supplierProductCode: "5408",
      supplierPrice: 5,
      supplierStock: 999999,
      markupType: "FIXED_AMOUNT",
      markupValue: 44
    }
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
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        thumbnailUrl: item.thumbnailUrl,
        categoryId: category.id,
        isActive: true
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        type: item.type,
        fulfillmentType: item.fulfillmentType,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        thumbnailUrl: item.thumbnailUrl,
        categoryId: category.id,
        isActive: true
      }
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
        isAutoSync: true
      },
      create: {
        productId: product.id,
        supplierId: supplier.id,
        supplierProductCode: item.supplierProductCode,
        supplierPrice: item.supplierPrice,
        supplierStock: item.supplierStock,
        markupType: item.markupType,
        markupValue: item.markupValue,
        isAutoSync: true
      }
    });
    console.log(`Product synced: ${product.title} -> HackTim Service #${item.supplierProductCode}`);
  }
  console.log("Seeding complete!");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
