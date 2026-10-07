import { prisma, SupplierType, MarkupType, ItemStatus, UpstreamStatus } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Setting up Telegram Bot supplier and remapping Gemini product...");

  let sessionString = process.env.TELEGRAM_USER_SESSION || "";
  let apiId = process.env.TELEGRAM_API_ID || "30557242";
  let apiHash = process.env.TELEGRAM_API_HASH || "2ade2dd2c0c5a42e9d3e7b224dac9337";

  const sessionFile = path.join(__dirname, "../tele-session.json");
  if (fs.existsSync(sessionFile)) {
    const creds = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
    sessionString = creds.sessionString || sessionString;
    apiId = String(creds.apiId || apiId);
    apiHash = creds.apiHash || apiHash;
  }

  // 1. Create or update Telegram Supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "NGHIENTRICK_TELE" },
    update: {
      name: "Nghiện Trick Shop (Telegram Bot)",
      type: SupplierType.TELEGRAM_BOT,
      baseUrl: "nghientrickshop_bot",
      apiKey: sessionString,
      apiSecret: `${apiId}:${apiHash}`,
      isActive: true,
    },
    create: {
      name: "Nghiện Trick Shop (Telegram Bot)",
      code: "NGHIENTRICK_TELE",
      type: SupplierType.TELEGRAM_BOT,
      baseUrl: "nghientrickshop_bot",
      apiKey: sessionString,
      apiSecret: `${apiId}:${apiHash}`,
      isActive: true,
    },
  });

  console.log("Supplier created/updated:", supplier.name, supplier.id);

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
        markupType: MarkupType.PERCENTAGE,
        markupValue: 50,
        isAutoSync: true,
      },
      create: {
        productId: geminiProduct.id,
        supplierId: supplier.id,
        supplierProductCode: "19",
        supplierPrice: 14567,
        supplierStock: 25,
        markupType: MarkupType.PERCENTAGE,
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

    // Check if ProductItem already exists for this order
    const existing = await prisma.productItem.findFirst({
      where: { orderId: order.id },
    });

    if (!existing) {
      await prisma.productItem.create({
        data: {
          productId: geminiProduct.id,
          secretContent: link,
          status: ItemStatus.SOLD,
          orderId: order.id,
        },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        upstreamStatus: UpstreamStatus.COMPLETED,
        upstreamOrderId: "ORD3B7E42206EA7",
        upstreamError: null,
      },
    });

    console.log("Updated order ORD973167 with delivered Gemini link!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
