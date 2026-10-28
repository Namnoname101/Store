"use strict";

const { PrismaClient } = require("@prisma/client");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("=== Bắt đầu dọn dẹp các sản phẩm không mở bán ===");

  // Whitelist of active storefront slugs
  const activeSlugs = [
    "cdx-0055-api-codex-ai-toc-o-nhanh-10-credit",
    "codex-credit-10usd",
    "cla-0036-api-claude-10-max-10-credit",
    "cla-0042-api-claude-30-max-30-credit",
    "cla-0044-api-claude-50-max-50-credit",
    "cla-0037-api-claude-100-max-100-credit",
    "cla-0083-api-claude-1-thang-max-5000-credit",
    "nordvpn-premium-3-thang",
    "gemini-advanced-18-thang",
    "duolingo-super-12-thang",
    "capcut-pro-7-ngay",
    "meitu-vip-7-ngay",
    "capcut-pro-30-ngay",
    "canva-pro-1-thang",
    "office-365-1-nam",
    "tang-follow-facebook-1000",
    "tang-like-facebook-1000",
    "tang-follow-tiktok-1000",
    "tang-tim-tiktok-1000",
  ];

  const allProducts = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          orderItems: true,
          items: true,
        },
      },
      supplierMapping: true,
    },
  });

  console.log(`Tổng số sản phẩm trong database: ${allProducts.length}`);

  let keptCount = 0;
  let deletedCount = 0;
  let deactivatedCount = 0;

  for (const prod of allProducts) {
    // Keep if in activeSlugs or if isActive is true
    const isStorefrontActive = activeSlugs.includes(prod.slug) || prod.isActive;

    if (isStorefrontActive) {
      keptCount++;
      // Ensure it is marked active
      if (!prod.isActive) {
        await prisma.product.update({
          where: { id: prod.id },
          data: { isActive: true },
        });
      }
      console.log(`[GIỮ LẠI] ${prod.title} (slug: ${prod.slug})`);
    } else {
      // Inactive / dummy product to delete
      if (prod._count.orderItems === 0) {
        // Safe hard delete: delete supplierMapping & items first
        if (prod.supplierMapping) {
          await prisma.supplierProductMapping.delete({
            where: { productId: prod.id },
          }).catch(() => {});
        }

        await prisma.productItem.deleteMany({
          where: { productId: prod.id },
        }).catch(() => {});

        await prisma.product.delete({
          where: { id: prod.id },
        });

        deletedCount++;
        console.log(`[ĐÃ XÓA] ${prod.title} (id: ${prod.id})`);
      } else {
        // Has order history: keep deactivated
        await prisma.product.update({
          where: { id: prod.id },
          data: { isActive: false },
        });
        deactivatedCount++;
        console.log(`[ĐÃ ẨN VĨNH VIỄN] ${prod.title} (do có ${prod._count.orderItems} đơn hàng lịch sử)`);
      }
    }
  }

  // Also clean up empty categories with no products
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  for (const cat of categories) {
    if (cat._count.products === 0 && cat.slug !== "software") {
      await prisma.category.delete({
        where: { id: cat.id },
      }).catch(() => {});
      console.log(`[XÓA DANH MỤC TRỐNG] ${cat.name} (${cat.slug})`);
    }
  }

  console.log("=== HOÀN TẤT DỌN DẸP ===");
  console.log(`- Sản phẩm giữ lại: ${keptCount}`);
  console.log(`- Sản phẩm đã xóa vĩnh viễn: ${deletedCount}`);
  console.log(`- Sản phẩm có lịch sử đơn hàng đã ẩn: ${deactivatedCount}`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi dọn dẹp sản phẩm:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
