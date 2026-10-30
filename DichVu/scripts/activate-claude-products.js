/**
 * Script to activate Claude API packages in database
 * Can run locally (dev.db, prisma/dev.db) or in production (/data/dev.db)
 */
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");

async function activateInDb(dbUrl) {
  console.log(`\n=== Activating Claude API packages in: ${dbUrl} ===`);
  const prisma = new PrismaClient(
    dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
  );

  try {
    // 1. Ensure category 'ai-api' exists and has clean title
    let cat = await prisma.category.findFirst({
      where: { slug: { in: ["ai-api", "ai-api-keys"] } },
    });

    if (cat) {
      cat = await prisma.category.update({
        where: { id: cat.id },
        data: {
          name: "API & Key AI (Claude, Codex, Cursor)",
          description: "API Claude, Cursor, OpenAI, Codex Credit cấp phát tự động 24/7",
        },
      });
      console.log(`✓ Updated category: ${cat.name} (${cat.slug})`);
    } else {
      cat = await prisma.category.create({
        data: {
          name: "API & Key AI (Claude, Codex, Cursor)",
          slug: "ai-api",
          description: "API Claude, Cursor, OpenAI, Codex Credit cấp phát tự động 24/7",
        },
      });
      console.log(`✓ Created category: ${cat.name} (${cat.slug})`);
    }

    // 2. Define Claude API packages to activate
    const packagesToActivate = [
      {
        slug: "cla-0036-api-claude-10-max-10-credit",
        title: "API Claude 10$ Max (10$ Credit)",
        price: 18000,
        originalPrice: 22500,
        description:
          "Hạn mức 10$ Credit API Anthropic Claude chính hãng tốc độ cao. Cấp phát key tự động 24/7, tương thích hoàn toàn Cursor IDE, Claude Code CLI, Cline, Roo Code và SDK.",
        supplierCode: "CLA-0036",
        supplierPrice: 15000,
        supplierStock: 25,
      },
      {
        slug: "cla-0042-api-claude-30-max-30-credit",
        title: "API Claude 30$ Max (30$ Credit)",
        price: 54000,
        originalPrice: 67500,
        description:
          "Hạn mức 30$ Credit API Anthropic Claude chính hãng tốc độ cao. Cấp phát key tự động 24/7, tối ưu cho lập trình viên và dự án cá nhân.",
        supplierCode: "CLA-0042",
        supplierPrice: 45000,
        supplierStock: 20,
      },
      {
        slug: "cla-0044-api-claude-50-max-50-credit",
        title: "API Claude 50$ Max (50$ Credit)",
        price: 90000,
        originalPrice: 112500,
        description:
          "Hạn mức 50$ Credit API Anthropic Claude chính hãng tốc độ cao. Gói phổ biến nhất cho lập trình viên chuyên nghiệp, hỗ trợ Claude 3.5 Sonnet & Claude 3 Opus.",
        supplierCode: "CLA-0044",
        supplierPrice: 75000,
        supplierStock: 15,
      },
      {
        slug: "cla-0037-api-claude-100-max-100-credit",
        title: "API Claude 100$ Max (100$ Credit)",
        price: 180000,
        originalPrice: 225000,
        description:
          "Hạn mức 100$ Credit API Anthropic Claude chính hãng tốc độ cao. Dành cho lập trình viên làm việc liên tục và team dự án.",
        supplierCode: "CLA-0037",
        supplierPrice: 150000,
        supplierStock: 15,
      },
      {
        slug: "cla-0083-api-claude-1-thang-max-5000-credit",
        title: "API Claude 1 tháng Max (5000$ Credit)",
        price: 3000000,
        originalPrice: 3750000,
        description:
          "Hạn mức 5.000$ Credit API Anthropic Claude Max chính hãng tốc độ cao. Tự động cấp key tức thì sau khi thanh toán, dùng cho hệ thống Production tải lớn.",
        supplierCode: "CLA-0083",
        supplierPrice: 2500000,
        supplierStock: 10,
      },
    ];

    // Find GenzShop supplier
    const genzSupplier = await prisma.supplier.findFirst({
      where: { code: "GENZSHOP" },
    });

    for (const pkg of packagesToActivate) {
      let product = await prisma.product.findUnique({
        where: { slug: pkg.slug },
      });

      if (product) {
        product = await prisma.product.update({
          where: { id: product.id },
          data: {
            title: pkg.title,
            price: pkg.price,
            originalPrice: pkg.originalPrice,
            description: pkg.description,
            categoryId: cat.id,
            isActive: true,
            fulfillmentType: "LOCAL_STOCK",
            type: "LICENSE_KEY",
            thumbnailUrl: "/images/brands/claude.svg",
          },
        });
        console.log(`✓ Updated & Activated: ${product.title} (${product.slug})`);
      } else {
        product = await prisma.product.create({
          data: {
            title: pkg.title,
            slug: pkg.slug,
            price: pkg.price,
            originalPrice: pkg.originalPrice,
            description: pkg.description,
            categoryId: cat.id,
            isActive: true,
            fulfillmentType: "LOCAL_STOCK",
            type: "LICENSE_KEY",
            thumbnailUrl: "/images/brands/claude.svg",
          },
        });
        console.log(`✓ Created & Activated: ${product.title} (${product.slug})`);
      }

      // Option 1: Claude API products use LOCAL_STOCK (warehouse inventory).
      // Remove any upstream supplier mapping so it sells from locally imported warehouse keys.
      await prisma.supplierProductMapping.deleteMany({
        where: { productId: product.id },
      });
      console.log(`  └─ Configured as LOCAL_STOCK (Kho hàng nội bộ sẵn có)`);
    }

    // 3. Deactivate old duplicate Codex products if present
    const oldCodexSlugs = [
      "cdx-0055-api-codex-ai-toc-o-nhanh",
      "cdx-0056-api-codex-ai-toc-o-nhanh",
      "cdx-0057-api-codex-ai-toc-o-nhanh",
      "cdx-0058-api-codex-ai-toc-o-nhanh",
      "cdx-0060-api-codex-ai-toc-o-nhanh",
    ];
    const deactRes = await prisma.product.updateMany({
      where: { slug: { in: oldCodexSlugs } },
      data: { isActive: false },
    });
    if (deactRes.count > 0) {
      console.log(`✓ Deactivated ${deactRes.count} legacy duplicate Codex products`);
    }

    console.log(`=== Done activating in ${dbUrl || "default DB"} ===`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // If running in Docker production on Fly (/data/dev.db)
  if (fs.existsSync("/data/dev.db")) {
    await activateInDb("file:/data/dev.db");
    return;
  }

  // Local development
  const rootDb = path.resolve(__dirname, "../dev.db");
  const prismaDb = path.resolve(__dirname, "../prisma/dev.db");

  if (fs.existsSync(rootDb)) {
    await activateInDb(`file:${rootDb}`);
  }
  if (fs.existsSync(prismaDb)) {
    await activateInDb(`file:${prismaDb}`);
  }
}

main().catch(console.error);

module.exports = { activateInDb };
