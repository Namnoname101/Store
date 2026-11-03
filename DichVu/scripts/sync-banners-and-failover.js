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
            "Tài khoản ChatGPT Plus 1 tháng chính chủ, mở khóa toàn bộ mô hình GPT-4o, OpenAI o1, DALL·E 3, Canvas và Advanced Voice. Bảo hành trọn thời gian sử dụng.",
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
          price: 199000,
          originalPrice: 499000,
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
          // Has order history: deactivate and hide completely
          await prisma.product.update({
            where: { id: gemini.id },
            data: { isActive: false, title: "[NGỪNG BÁN] " + gemini.title },
          });
          console.log("[SyncBanners] Deactivated discontinued Gemini 18M product (preserved order history)");
        } else {
          // No orders: delete items and product cleanly
          await prisma.productItem.deleteMany({ where: { productId: gemini.id } }).catch(() => {});
          await prisma.product.delete({ where: { id: gemini.id } });
          console.log("[SyncBanners] Cleanly removed discontinued Gemini 18M product");
        }
      }
    } catch (e) {
      console.warn("[SyncBanners] Gemini removal notice:", e.message);
    }

    // 5. Office 365 1 Năm
    const office = await prisma.product.findUnique({
      where: { slug: "office-365-1-nam" },
      include: { supplierMapping: true },
    });
    if (office) {
      await prisma.product.update({
        where: { id: office.id },
        data: {
          thumbnailUrl: "/images/products/microsoft-365.svg",
          price: 45000,
          originalPrice: 120000,
        },
      });
      if (office.supplierMapping) {
        await prisma.supplierProductMapping.update({
          where: { id: office.supplierMapping.id },
          data: {
            supplierPrice: 16800,
            customConfig: JSON.stringify({
              retailPrice: 45000,
              resellerPrice: 28000,
              supplierCost: 16800,
              alternativeSuppliers: [
                {
                  supplierCode: "DSHOP_TELE",
                  supplierProductCode: "OFFICE_365",
                  supplierPrice: 22000,
                  priority: 2,
                },
                {
                  supplierCode: "NGHIENTRICK_TELE",
                  supplierProductCode: "OFFICE_42",
                  supplierPrice: 34500,
                  priority: 3,
                },
              ],
            }),
          },
        });
      }
      console.log(`[SyncBanners] Updated Office 365`);
    }

    // 6. Duolingo Super 12 Tháng
    const duolingo = await prisma.product.findUnique({
      where: { slug: "duolingo-super-12-thang" },
      include: { supplierMapping: true },
    });
    if (duolingo) {
      await prisma.product.update({
        where: { id: duolingo.id },
        data: {
          thumbnailUrl: "/images/products/duolingo-super.svg",
          price: 45000,
          originalPrice: 190000,
        },
      });
      if (duolingo.supplierMapping) {
        await prisma.supplierProductMapping.update({
          where: { id: duolingo.supplierMapping.id },
          data: {
            supplierPrice: 19800,
            customConfig: JSON.stringify({
              retailPrice: 45000,
              resellerPrice: 32000,
              supplierCost: 19800,
              alternativeSuppliers: [
                {
                  supplierCode: "KHOMMO_TELE",
                  supplierProductCode: "DUOLINGO_12M",
                  supplierPrice: 25000,
                  priority: 2,
                },
              ],
            }),
          },
        });
      }
      console.log(`[SyncBanners] Updated Duolingo Super`);
    }

    // 7. CapCut Pro
    const capcut30 = await prisma.product.findUnique({
      where: { slug: "capcut-pro-30-ngay" },
      include: { supplierMapping: true },
    });
    if (capcut30) {
      await prisma.product.update({
        where: { id: capcut30.id },
        data: {
          thumbnailUrl: "/images/products/capcut-pro.svg",
          price: 75000,
          originalPrice: 150000,
        },
      });
      if (capcut30.supplierMapping) {
        await prisma.supplierProductMapping.update({
          where: { id: capcut30.supplierMapping.id },
          data: {
            supplierPrice: 38800,
            customConfig: JSON.stringify({
              retailPrice: 75000,
              resellerPrice: 55000,
              supplierCost: 38800,
              alternativeSuppliers: [
                {
                  supplierCode: "DSHOP_TELE",
                  supplierProductCode: "CAPCUT_PRO_MONTH",
                  supplierPrice: 45000,
                  priority: 2,
                },
                {
                  supplierCode: "NGHIENTRICK_TELE",
                  supplierProductCode: "CAPCUT_PRO_6M",
                  supplierPrice: 155000,
                  priority: 3,
                },
              ],
            }),
          },
        });
      }
      console.log(`[SyncBanners] Updated CapCut Pro 30 Ngày`);
    }

    const capcut7 = await prisma.product.findUnique({ where: { slug: "capcut-pro-7-ngay" } });
    if (capcut7) {
      await prisma.product.update({
        where: { id: capcut7.id },
        data: { thumbnailUrl: "/images/products/capcut-pro.svg" },
      });
    }

    // 8. Canva Pro
    const canva = await prisma.product.findUnique({
      where: { slug: "canva-pro-1-thang" },
      include: { supplierMapping: true },
    });
    if (canva) {
      await prisma.product.update({
        where: { id: canva.id },
        data: {
          thumbnailUrl: "/images/products/canva-pro.svg",
          price: 29000,
          originalPrice: 99000,
        },
      });
      if (canva.supplierMapping) {
        await prisma.supplierProductMapping.update({
          where: { id: canva.supplierMapping.id },
          data: {
            supplierPrice: 9900,
            customConfig: JSON.stringify({
              retailPrice: 29000,
              resellerPrice: 19000,
              supplierCost: 9900,
              alternativeSuppliers: [
                {
                  supplierCode: "DSHOP_TELE",
                  supplierProductCode: "CANVA_EDU_PRO",
                  supplierPrice: 12000,
                  priority: 2,
                },
              ],
            }),
          },
        });
      }
      console.log(`[SyncBanners] Updated Canva Pro`);
    }

    // 9. NordVPN
    const nordvpn = await prisma.product.findUnique({
      where: { slug: "nordvpn-premium-3-thang" },
      include: { supplierMapping: true },
    });
    if (nordvpn) {
      await prisma.product.update({
        where: { id: nordvpn.id },
        data: {
          thumbnailUrl: "/images/products/nordvpn.svg",
          price: 65000,
          originalPrice: 199000,
        },
      });
      if (nordvpn.supplierMapping) {
        await prisma.supplierProductMapping.update({
          where: { id: nordvpn.supplierMapping.id },
          data: {
            customConfig: JSON.stringify({
              retailPrice: 65000,
              resellerPrice: 45000,
              supplierCost: 28000,
              alternativeSuppliers: [
                {
                  supplierCode: "XOAINON_TELE",
                  supplierProductCode: "NORDVPN_1Y",
                  supplierPrice: 28000,
                  priority: 1,
                },
              ],
            }),
          },
        });
      }
      console.log(`[SyncBanners] Updated NordVPN`);
    }

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
