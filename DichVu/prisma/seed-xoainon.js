"use strict";

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("--> Seeding Shop Xoai Non (Telegram Bot) supplier and products...");

  let sessionString = process.env.TELEGRAM_USER_SESSION || "";
  let apiId = process.env.TELEGRAM_API_ID || "30557242";
  let apiHash = process.env.TELEGRAM_API_HASH || "2ade2dd2c0c5a42e9d3e7b224dac9337";

  const sessionFile = path.join(__dirname, "../tele-session.json");
  if (fs.existsSync(sessionFile)) {
    try {
      const creds = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
      sessionString = creds.sessionString || sessionString;
      apiId = String(creds.apiId || apiId);
      apiHash = creds.apiHash || apiHash;
    } catch (e) {}
  }

  if (!sessionString) {
    sessionString =
      "1BQANOTEuMTA4LjU2LjE1MgG7YBlC7lZMTogoEiqIzf/ZrrAX2p2iRwLkJWbyJcFJmClHK7UHi7Z8cDm7EChbKGw//xxkJgGySWUABkn0ZRtt9WopNtKmXd/vQRtiji1ggjU1t9VS+20rkfsCuF3Uv/v9bbqilJMXr6yUnRxpQayG8HQE7P4g+xZJsv+yxVJKuwv/g0WxM5rZ28BcQW/eb9vN6RAF5fZiaxvvAyYnNnuUIPIFhm2vWeoXoMmXAc13MNUp5aUbmE8wgp6B2i6NNs0+0vRLNxY+SN+wWDWC3U4pHOsjYRWSd8iix970n2Vvkhb62nwINBCopmjUwBSCEP5kSPvuvTJAtWC/gSBSlqlwGg==";
  }

  // 1. Create or update XOAINON_TELE Supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "XOAINON_TELE" },
    update: {
      name: "Shop Xoài Non (Telegram Bot)",
      type: "TELEGRAM_BOT",
      baseUrl: "shopxoainon_bot",
      apiKey: sessionString,
      apiSecret: `${apiId}:${apiHash}`,
      isActive: true,
    },
    create: {
      name: "Shop Xoài Non (Telegram Bot)",
      code: "XOAINON_TELE",
      type: "TELEGRAM_BOT",
      baseUrl: "shopxoainon_bot",
      apiKey: sessionString,
      apiSecret: `${apiId}:${apiHash}`,
      isActive: true,
    },
  });

  console.log(`✓ Supplier ready: ${supplier.name} (id: ${supplier.id})`);

  // 2. Ensure Category 'software' or fallback exists
  let catSoftware = await prisma.category.findUnique({
    where: { slug: "software" },
  });
  if (!catSoftware) {
    catSoftware = await prisma.category.create({
      data: {
        name: "Phần mềm & Bản quyền",
        slug: "software",
        description: "Bản quyền ứng dụng, tài khoản học tập, làm việc giá rẻ",
      },
    });
  }

  // 3. Map Gemini Advanced 18 Thang: Xoai Non is CHEAPER (13.800d) than Nghien Trick (14.567d)
  // Alternative suppliers will fallback to Nghien Trick
  const gemini = await prisma.product.findUnique({
    where: { slug: "gemini-advanced-18-thang" },
  });
  if (gemini) {
    await prisma.supplierProductMapping.upsert({
      where: { productId: gemini.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: "51",
        supplierPrice: 13800,
        supplierStock: 68,
        markupType: "PERCENTAGE",
        markupValue: 50,
        isAutoSync: true,
        customConfig: JSON.stringify({
          alternativeSuppliers: [
            {
              supplierCode: "NGHIENTRICK_TELE",
              supplierProductCode: "19",
              supplierPrice: 14567,
            },
          ],
        }),
      },
      create: {
        productId: gemini.id,
        supplierId: supplier.id,
        supplierProductCode: "51",
        supplierPrice: 13800,
        supplierStock: 68,
        markupType: "PERCENTAGE",
        markupValue: 50,
        isAutoSync: true,
        customConfig: JSON.stringify({
          alternativeSuppliers: [
            {
              supplierCode: "NGHIENTRICK_TELE",
              supplierProductCode: "19",
              supplierPrice: 14567,
            },
          ],
        }),
      },
    });
    console.log("✓ Mapped Gemini Advanced 18 Tháng: Xoai Non (#51, 13.8k) with fallback to Nghien Trick (#19, 14.5k)");
  }

  // 4. Map Duolingo Super 12 Thang: Xoai Non (#60, 19.8k)
  const duo = await prisma.product.findUnique({
    where: { slug: "duolingo-super-12-thang" },
  });
  if (duo) {
    await prisma.supplierProductMapping.upsert({
      where: { productId: duo.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: "60",
        supplierPrice: 19800,
        supplierStock: 2,
        markupType: "PERCENTAGE",
        markupValue: 40,
        isAutoSync: true,
      },
      create: {
        productId: duo.id,
        supplierId: supplier.id,
        supplierProductCode: "60",
        supplierPrice: 19800,
        supplierStock: 2,
        markupType: "PERCENTAGE",
        markupValue: 40,
        isAutoSync: true,
      },
    });
    console.log("✓ Mapped Duolingo Super 12 Tháng to Xoai Non (#60, 19.8k)");
  }

  // 5. Office 365 1 Nam: Xoai Non (#73, 16.8k)
  let office = await prisma.product.findUnique({
    where: { slug: "office-365-1-nam" },
  });
  if (!office) {
    office = await prisma.product.create({
      data: {
        slug: "office-365-1-nam",
        title: "Microsoft Office 365 Plus 1 Năm Riêng Tư",
        description: "Bản quyền Microsoft 365 (Word, Excel, PowerPoint, OneDrive) 1 năm sử dụng ổn định.",
        price: 35000,
        type: "ACCOUNT",
        fulfillmentType: "API_DROPSHIP",
        categoryId: catSoftware.id,
      },
    });
  } else if (office.type !== "ACCOUNT") {
    office = await prisma.product.update({
      where: { id: office.id },
      data: { type: "ACCOUNT" },
    });
  }
  await prisma.supplierProductMapping.upsert({
    where: { productId: office.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: "73",
      supplierPrice: 16800,
      supplierStock: 59,
      markupType: "PERCENTAGE",
      markupValue: 50,
      isAutoSync: true,
    },
    create: {
      productId: office.id,
      supplierId: supplier.id,
      supplierProductCode: "73",
      supplierPrice: 16800,
      supplierStock: 59,
      markupType: "PERCENTAGE",
      markupValue: 50,
      isAutoSync: true,
    },
  });
  console.log("✓ Mapped Office 365 1 Năm to Xoai Non (#73, 16.8k)");

  // 6. Canva Pro 1 Thang: Xoai Non (#71, 9.9k)
  let canva = await prisma.product.findUnique({
    where: { slug: "canva-pro-1-thang" },
  });
  if (!canva) {
    canva = await prisma.product.create({
      data: {
        slug: "canva-pro-1-thang",
        title: "Tài khoản Canva Pro 1 Tháng Chính Chủ",
        description: "Nâng cấp Canva Pro chính chủ dùng full tính năng đồ hoạ, template, font, không giới hạn.",
        price: 25000,
        fulfillmentType: "API_DROPSHIP",
        categoryId: catSoftware.id,
      },
    });
  }
  await prisma.supplierProductMapping.upsert({
    where: { productId: canva.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: "71",
      supplierPrice: 9900,
      supplierStock: 5,
      markupType: "PERCENTAGE",
      markupValue: 50,
      isAutoSync: true,
    },
    create: {
      productId: canva.id,
      supplierId: supplier.id,
      supplierProductCode: "71",
      supplierPrice: 9900,
      supplierStock: 5,
      markupType: "PERCENTAGE",
      markupValue: 50,
      isAutoSync: true,
    },
  });
  console.log("✓ Mapped Canva Pro 1 Tháng to Xoai Non (#71, 9.9k)");

  // 7. Capcut Pro 30d: Xoai Non (#35, 42.8k)
  let capcut = await prisma.product.findUnique({
    where: { slug: "capcut-pro-30-ngay" },
  });
  if (!capcut) {
    capcut = await prisma.product.create({
      data: {
        slug: "capcut-pro-30-ngay",
        title: "Tài khoản CapCut Pro 30 Ngày Full Date",
        description: "Tài khoản CapCut Pro 30 ngày mở khoá toàn bộ tính năng và hiệu ứng Pro.",
        price: 65000,
        fulfillmentType: "API_DROPSHIP",
        categoryId: catSoftware.id,
      },
    });
  }
  await prisma.supplierProductMapping.upsert({
    where: { productId: capcut.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: "35",
      supplierPrice: 42800,
      supplierStock: 13,
      markupType: "PERCENTAGE",
      markupValue: 50,
      isAutoSync: true,
    },
    create: {
      productId: capcut.id,
      supplierId: supplier.id,
      supplierProductCode: "35",
      supplierPrice: 42800,
      supplierStock: 13,
      markupType: "PERCENTAGE",
      markupValue: 50,
      isAutoSync: true,
    },
  });
  console.log("✓ Mapped Capcut Pro 30 Ngày to Xoai Non (#35, 42.8k)");

  console.log("--> All Shop Xoai Non products successfully seeded and mapped!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
