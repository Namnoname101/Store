/**
 * Script to synchronize product banners, thumbnails, and multi-supplier failover mappings
 * Runs locally or during container boot on Fly.io (/data/dev.db)
 */
const { PrismaClient } = require("@prisma/client");

async function main() {
  console.log("[SyncBanners] Checking and synchronizing product banners and failover...");
  const prisma = new PrismaClient();

  try {
    // 1. Ensure Suppliers exist
    const suppliers = [
      {
        code: "XOAINON_TELE",
        name: "Shop Xoài Non (Telegram Bot)",
        type: "TELEGRAM_BOT",
        baseUrl: "tg://resolve?domain=shopxoainon_bot",
        apiKey: "XOAINON_SESSION",
        currentBalance: 0,
        isActive: true,
      },
      {
        code: "KHOMMO_TELE",
        name: "Kho MMO Market (Telegram Bot)",
        type: "TELEGRAM_BOT",
        baseUrl: "tg://resolve?domain=KhoMMO_Market_bot",
        apiKey: "KHOMMO_SESSION",
        currentBalance: 0,
        isActive: true,
      },
      {
        code: "DSHOP_TELE",
        name: "MMO DShop (Telegram Bot)",
        type: "TELEGRAM_BOT",
        baseUrl: "tg://resolve?domain=mmo_dshop_bot",
        apiKey: "DSHOP_SESSION",
        currentBalance: 0,
        isActive: true,
      },
      {
        code: "NGHIENTRICK_TELE",
        name: "Nghiện Trick Shop (Telegram Bot)",
        type: "TELEGRAM_BOT",
        baseUrl: "tg://resolve?domain=nghientrickshop_bot",
        apiKey: "NGHIENTRICK_SESSION",
        currentBalance: 0,
        isActive: true,
      },
    ];

    for (const s of suppliers) {
      const existing = await prisma.supplier.findUnique({ where: { code: s.code } });
      if (!existing) {
        await prisma.supplier.create({ data: s });
        console.log(`[SyncBanners] Created supplier: ${s.name} (${s.code})`);
      }
    }

    const xoaiNon = await prisma.supplier.findUnique({ where: { code: "XOAINON_TELE" } });

    // 2. Ensure Category
    let aiCat = await prisma.category.findFirst({
      where: {
        OR: [{ name: { contains: "AI" } }, { slug: { contains: "ai" } }],
      },
    });
    if (!aiCat) {
      aiCat = await prisma.category.findFirst();
    }

    // 3. ChatGPT Plus 1 Tháng
    const chatGptSlug = "chatgpt-plus-1-thang";
    const existingGpt = await prisma.product.findUnique({ where: { slug: chatGptSlug } });
    if (!existingGpt && aiCat && xoaiNon) {
      await prisma.product.create({
        data: {
          title: "Tài Khoản ChatGPT Plus 1 Tháng Chính Chủ",
          slug: chatGptSlug,
          description:
            "Tài khoản ChatGPT Plus 1 tháng chính chủ, mở khóa toàn bộ mô hình thế hệ mới nhất của OpenAI (GPT-4.5, OpenAI o3, o1, GPT-4o), DALL·E 3, Canvas và Advanced Voice. Bảo hành trọn thời gian sử dụng.",
          price: 199000,
          originalPrice: 499000,
          type: "ACCOUNT",
          thumbnailUrl: "/images/products/chatgpt-plus.svg",
          categoryId: aiCat.id,
          fulfillmentType: "API_DROPSHIP",
          minQuantity: 1,
          maxQuantity: 5,
          isActive: true,
          supplierMapping: {
            create: {
              supplierId: xoaiNon.id,
              supplierProductCode: "10",
              supplierPrice: 128800,
              supplierStock: 10,
              markupType: "FIXED_AMOUNT",
              markupValue: 70200,
              isAutoSync: false,
              customConfig: JSON.stringify({
                retailPrice: 199000,
                resellerPrice: 165000,
                supplierCost: 128800,
                alternativeSuppliers: [],
              }),
            },
          },
        },
      });
      console.log(`[SyncBanners] Created ChatGPT Plus product`);
    } else if (existingGpt) {
      await prisma.product.update({
        where: { id: existingGpt.id },
        data: {
          thumbnailUrl: "/images/products/chatgpt-plus.svg",
        },
      });
    }

    // 4. Remove or Deactivate Gemini Pro 18 Tháng (suppliers discontinued)
    try {
      const gemini = await prisma.product.findUnique({
        where: { slug: "gemini-advanced-18-thang" },
        include: { supplierMapping: true, orderItems: true, items: true },
      });
      if (gemini) {
        if (gemini.supplierMapping) {
          await prisma.supplierProductMapping.delete({ where: { id: gemini.supplierMapping.id } }).catch(() => {});
        }
        if (gemini.orderItems && gemini.orderItems.length > 0) {
          const cleanTitle = gemini.title.replace(/^(\[NGỪNG BÁN\]\s*)+/i, "").trim();
          await prisma.product.update({
            where: { id: gemini.id },
            data: { isActive: false, title: "[NGỪNG BÁN] " + cleanTitle },
          });
          console.log("[SyncBanners] Deactivated discontinued Gemini 18M product (preserved order history)");
        } else {
          await prisma.productItem.deleteMany({ where: { productId: gemini.id } }).catch(() => {});
          await prisma.product.delete({ where: { id: gemini.id } });
          console.log("[SyncBanners] Cleanly removed discontinued Gemini 18M product");
        }
      }
    } catch (e) {
      console.warn("[SyncBanners] Gemini removal notice:", e.message);
    }

    // 5. Ensure thumbnails for Office 365, Duolingo, CapCut, Canva, NordVPN (preserve Admin DB prices!)
    const thumbUpdates = [
      { slug: "office-365-1-nam", thumbnailUrl: "/images/products/microsoft-365.svg" },
      { slug: "duolingo-super-12-thang", thumbnailUrl: "/images/products/duolingo-super.svg" },
      { slug: "capcut-pro-30-ngay", thumbnailUrl: "/images/products/capcut-pro.svg" },
      { slug: "capcut-pro-7-ngay", thumbnailUrl: "/images/products/capcut-pro.svg" },
      { slug: "canva-pro-1-thang", thumbnailUrl: "/images/products/canva-pro.svg" },
      { slug: "nordvpn-premium-3-thang", thumbnailUrl: "/images/products/nordvpn.svg" },
    ];
    for (const item of thumbUpdates) {
      await prisma.product.updateMany({
        where: { slug: item.slug },
        data: { thumbnailUrl: item.thumbnailUrl },
      });
    }
    console.log("[SyncBanners] Verified thumbnails for Office 365, Duolingo, CapCut, Canva, NordVPN.");

        // 10. Sync Claude AI & API thumbnails to high-res 5.5/5.6 generation banner
    await prisma.product.updateMany({
      where: {
        OR: [
          { slug: { startsWith: "api-claude-" } },
          { slug: { startsWith: "cla-" } }
        ]
      },
      data: {
        thumbnailUrl: "/images/products/claude-api.svg"
      }
    });
    console.log("[SyncBanners] Updated Claude API product thumbnails to /images/products/claude-api.svg");

    // 11. Ensure ChatGPT Plus thumbnail
    await prisma.product.updateMany({
      where: { slug: "chatgpt-plus-1-thang" },
      data: {
        thumbnailUrl: "/images/products/chatgpt-plus.svg",
      }
    });
    console.log("[SyncBanners] Normalized OpenAI & Gemini product descriptions in DB.");

    console.log("[SyncBanners] All product banners and failover mappings synced successfully.");
  } catch (err) {
    console.error("[SyncBanners] Error:", err?.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
