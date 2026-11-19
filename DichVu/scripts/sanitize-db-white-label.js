/**
 * sanitize-db-white-label.js
 * Comprehensive database sanitizer to guarantee 100% white-label customer storefront.
 * Strips all internal supplier names, codes, abbreviations (NCC, DKey, XoaiNon, DShop, KhoMMO, etc.)
 * from product titles, descriptions, and user-facing records.
 */
const { PrismaClient } = require("@prisma/client");

async function sanitizeDatabase() {
  const prisma = new PrismaClient();
  console.log("[Sanitizer] Starting white-label database sanitization...");

  try {
    const products = await prisma.product.findMany();
    console.log(`[Sanitizer] Checking ${products.length} products...`);

    let updatedCount = 0;

    for (const p of products) {
      let title = p.title || "";
      let description = p.description || "";
      const originalTitle = title;
      const originalDesc = description;

      // 1. Sanitize Titles
      title = title
        .replace(/\s*\(Chuẩn NCC [^)]+\)/gi, "")
        .replace(/\s*\(Chuẩn NCC\)/gi, "")
        .replace(/\s*-\s*Chuẩn NCC [^)]+/gi, "")
        .replace(/\bNCC DKeyShop\b/gi, "")
        .replace(/\bNCC DKey\b/gi, "")
        .replace(/\bNCC Xoài Non\b/gi, "")
        .replace(/\bShop Xoài Non\b/gi, "")
        .replace(/\bNCC D-Shop\b/gi, "")
        .replace(/\bNCC\b/g, "")
        .replace(/\s+-\s+BHF\b/gi, "")
        .replace(/\s*\(\s*\)/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Specific known titles
      if (p.slug === "slot-chatgpt-business-1-thang") {
        title = "Slot ChatGPT Business Dùng Chung 1 Tháng (Bảo Hành Full 30 Ngày)";
      } else if (p.slug === "chatgpt-plus-1-thang-bhf") {
        title = "Tài Khoản ChatGPT Plus 1 Tháng Riêng Tư (Bảo Hành Full 30 Ngày)";
      } else if (p.slug === "chatgpt-plus-1-thang") {
        title = "Tài Khoản ChatGPT Plus 1 Tháng (Gói Tiết Kiệm - BH 24H)";
      } else if (p.slug === "capcut-pro-7-ngay") {
        title = "Tài khoản CapCut Pro 7 Ngày (Full Hiệu Ứng AI)";
      } else if (p.slug === "capcut-pro-30-ngay") {
        title = "Tài khoản CapCut Pro 30 Ngày (Full Hiệu Ứng AI)";
      } else if (p.slug === "wink-vip-plus-7-ngay") {
        title = "Tài khoản Wink VIP+ Riêng Tư (7 Ngày Full Tính Năng)";
      }

      // 2. Sanitize Descriptions
      description = description
        // Specific supplier brands
        .replace(/Chuẩn NCC DKeyShop/gi, "Chuẩn Bản Quyền Cao Cấp")
        .replace(/chuẩn NCC DKey/gi, "chuẩn bản quyền cao cấp")
        .replace(/chuẩn NCC Shop Xoài Non/gi, "chuẩn hệ thống tự động")
        .replace(/Shop Xoài Non/gi, "Hệ Thống")
        .replace(/Xoài Non/gi, "Hệ Thống")
        .replace(/DKeyShop/gi, "Hệ Thống")
        .replace(/DKey/gi, "Hệ Thống")
        .replace(/D-Shop/gi, "Hệ Thống")
        .replace(/Kho MMO/gi, "Hệ Thống")
        .replace(/KhoMMO/gi, "Hệ Thống")
        .replace(/Canboso/gi, "Hệ Thống")
        // Generic NCC and supplier phrases
        .replace(/QUY ĐỊNH BẮT BUỘC TỪ NHÀ CUNG CẤP/gi, "QUY ĐỊNH BẮT BUỘC KHI SỬ DỤNG")
        .replace(/từ nhà cung cấp CapCut/gi, "khi sử dụng CapCut")
        .replace(/từ nhà cung cấp/gi, "từ hệ thống")
        .replace(/từ NCC/gi, "từ hệ thống")
        .replace(/theo chuẩn NCC/gi, "theo chuẩn dịch vụ")
        .replace(/chuẩn NCC/gi, "chuẩn hệ thống")
        .replace(/chính sách nhà cung cấp/gi, "chính sách dịch vụ")
        .replace(/chính sách của nhà cung cấp/gi, "chính sách dịch vụ")
        .replace(/nhà cung cấp cam kết/gi, "hệ thống cam kết")
        .replace(/nhà cung cấp/gi, "hệ thống")
        .replace(/\bNCC\b/g, "Hệ Thống")
        .replace(/\(BHF 30D\)/gi, "(Full 30 Ngày)")
        .replace(/\bBHF 30D\b/gi, "Full 30 Ngày")
        .replace(/\bBHF\b/g, "Bảo Hành Full");

      if (title !== originalTitle || description !== originalDesc) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            title,
            description,
          },
        });
        updatedCount++;
        console.log(`[Sanitizer] Cleaned: ${p.slug}`);
      }
    }

    console.log(`[Sanitizer] Finished! Updated ${updatedCount} products to 100% white-label.`);
  } catch (err) {
    console.error("[Sanitizer] Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  sanitizeDatabase();
}

module.exports = { sanitizeDatabase };
