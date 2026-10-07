"use strict";

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Telegram Bot supplier and remapping Gemini product...");

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
    sessionString = "1BQANOTEuMTA4LjU2LjE1MgG7YBlC7lZMTogoEiqIzf/ZrrAX2p2iRwLkJWbyJcFJmClHK7UHi7Z8cDm7EChbKGw//xxkJgGySWUABkn0ZRtt9WopNtKmXd/vQRtiji1ggjU1t9VS+20rkfsCuF3Uv/v9bbqilJMXr6yUnRxpQayG8HQE7P4g+xZJsv+yxVJKuwv/g0WxM5rZ28BcQW/eb9vN6RAF5fZiaxvvAyYnNnuUIPIFhm2vWeoXoMmXAc13MNUp5aUbmE8wgp6B2i6NNs0+0vRLNxY+SN+wWDWC3U4pHOsjYRWSd8iix970n2Vvkhb62nwINBCopmjUwBSCEP5kSPvuvTJAtWC/gSBSlqlwGg==";
  }

  // 1. Create or update Telegram Supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "NGHIENTRICK_TELE" },
    update: {
      name: "Nghiện Trick Shop (Telegram Bot)",
      type: "TELEGRAM_BOT",
      baseUrl: "nghientrickshop_bot",
      apiKey: sessionString,
      apiSecret: `${apiId}:${apiHash}`,
      isActive: true,
    },
    create: {
      name: "Nghiện Trick Shop (Telegram Bot)",
      code: "NGHIENTRICK_TELE",
      type: "TELEGRAM_BOT",
      baseUrl: "nghientrickshop_bot",
      apiKey: sessionString,
      apiSecret: `${apiId}:${apiHash}`,
      isActive: true,
    },
  });

  console.log("Supplier ready:", supplier.name, "(id:", supplier.id, ")");

  // 2. Remap Gemini Advanced 18 Thang to this supplier
  const geminiProduct = await prisma.product.findUnique({
    where: { slug: "gemini-advanced-18-thang" },
  });

  if (geminiProduct) {
    await prisma.supplierProductMapping.upsert({
      where: { productId: geminiProduct.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: "19",
        supplierPrice: 14567,
        supplierStock: 25,
        markupType: "PERCENTAGE",
        markupValue: 50,
        isAutoSync: true,
      },
      create: {
        productId: geminiProduct.id,
        supplierId: supplier.id,
        supplierProductCode: "19",
        supplierPrice: 14567,
        supplierStock: 25,
        markupType: "PERCENTAGE",
        markupValue: 50,
        isAutoSync: true,
      },
    });

    console.log("Remapped Gemini Advanced 18 Tháng to Telegram Bot Supplier!");
  }

  // 3. Deliver tested link into customer order ORD973167
  const order = await prisma.order.findUnique({
    where: { orderCode: "ORD973167" },
  });

  if (order && geminiProduct) {
    const link =
      "https://gemini-pro-18m.com/subscription/new/gAAAAABqxUPZtagowTi7qUYqxzWwol35UAEJHosh8kwrYGCDXz91RUYDfEtO3zO-1gSh_JCeUIN9IKYKoMgNBgXiKWc_DiWJiA==";

    const existing = await prisma.productItem.findFirst({
      where: { orderId: order.id },
    });

    if (!existing) {
      await prisma.productItem.create({
        data: {
          productId: geminiProduct.id,
          secretContent: link,
          status: "SOLD",
          orderId: order.id,
        },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        upstreamStatus: "COMPLETED",
        upstreamOrderId: "ORD3B7E42206EA7",
        upstreamError: null,
      },
    });

    console.log("Updated order ORD973167 with delivered Gemini link!");
  }

  console.log("Telegram seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
