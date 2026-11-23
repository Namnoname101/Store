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

    // 2. Define Claude API packages with clean brand slugs (no supplier SKU prefixes)
    const packagesToActivate = [
      {
        slug: "api-claude-10-max-10-credit",
        oldSlug: "cla-0036-api-claude-10-max-10-credit",
        title: "API Claude 10$ Max (10$ Credit)",
        price: 29000,
        originalPrice: 50000,
        description:
          "• Hạn mức: 10$ Credit API Anthropic Claude tốc độ cao, tính theo đúng lượng token sử dụng thực tế.\n• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.\n• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).\n• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.\n• Bảo hành: Bảo hành trọn vẹn số dư 10$ Credit và đường truyền kết nối ổn định.",
        supplierCode: "CLA-0036",
        supplierPrice: 15000,
        supplierStock: 25,
      },
      {
        slug: "api-claude-30-max-30-credit",
        oldSlug: "cla-0042-api-claude-30-max-30-credit",
        title: "API Claude 30$ Max (30$ Credit)",
        price: 79000,
        originalPrice: 135000,
        description:
          "• Hạn mức: 30$ Credit API Anthropic Claude tốc độ cao, phù hợp cho lập trình viên làm việc hàng ngày.\n• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.\n• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).\n• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.\n• Bảo hành: Bảo hành trọn vẹn số dư 30$ Credit và đường truyền kết nối ổn định.",
        supplierCode: "CLA-0042",
        supplierPrice: 45000,
        supplierStock: 20,
      },
      {
        slug: "api-claude-50-max-50-credit",
        oldSlug: "cla-0044-api-claude-50-max-50-credit",
        title: "API Claude 50$ Max (50$ Credit)",
        price: 129000,
        originalPrice: 220000,
        description:
          "• Hạn mức: 50$ Credit API Anthropic Claude tốc độ cao — gói phổ biến nhất cho kỹ sư phần mềm chuyên nghiệp.\n• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.\n• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).\n• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.\n• Bảo hành: Bảo hành trọn vẹn số dư 50$ Credit và đường truyền kết nối ổn định.",
        supplierCode: "CLA-0044",
        supplierPrice: 75000,
        supplierStock: 15,
      },
      {
        slug: "api-claude-100-max-100-credit",
        oldSlug: "cla-0037-api-claude-100-max-100-credit",
        title: "API Claude 100$ Max (100$ Credit)",
        price: 249000,
        originalPrice: 420000,
        description:
          "• Hạn mức: 100$ Credit API Anthropic Claude tốc độ cao, tối ưu cho dự án lớn và sử dụng Claude Code CLI cường độ cao.\n• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.\n• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).\n• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.\n• Bảo hành: Bảo hành trọn vẹn số dư 100$ Credit và đường truyền kết nối ổn định.",
        supplierCode: "CLA-0037",
        supplierPrice: 150000,
        supplierStock: 15,
      },
      {
        slug: "api-claude-1-thang-max-5000-credit",
        oldSlug: "cla-0083-api-claude-1-thang-max-5000-credit",
        title: "API Claude 1 tháng Max (5000$ Credit)",
        price: 2490000,
        originalPrice: 4200000,
        description:
          "• Hạn mức: 5.000$ Credit API Anthropic Claude Max thời hạn 1 tháng, phục vụ team phát triển hoặc hệ thống Production tải lớn.\n• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.\n• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).\n• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.\n• Bảo hành: Bảo hành kết nối và hạn mức 5.000$ Credit suốt 30 ngày sử dụng.",
        supplierCode: "CLA-0083",
        supplierPrice: 1500000,
        supplierStock: 10,
      },
    ];

    for (const pkg of packagesToActivate) {
      // Find either by clean slug or old supplier slug
      let product = await prisma.product.findFirst({
        where: {
          OR: [{ slug: pkg.slug }, { slug: pkg.oldSlug }],
        },
      });

      if (product) {
        product = await prisma.product.update({
          where: { id: product.id },
          data: {
            slug: pkg.slug,
            title: pkg.title,
            price: pkg.price,
            originalPrice: pkg.originalPrice,
            description: pkg.description,
            categoryId: cat.id,
            isActive: true,
            fulfillmentType: "LOCAL_STOCK",
            type: "LICENSE_KEY",
            thumbnailUrl: "/images/products/claude-api.svg",
          },
        });
        console.log(`✓ Updated & Migrated to clean slug: ${product.title} (${product.slug})`);
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
            thumbnailUrl: "/images/products/claude-api.svg",
          },
        });
        console.log(`✓ Created & Activated: ${product.title} (${product.slug})`);
      }

      // Ensure supplier mapping records accurate cost price & gross markup
      const genzSupplier = await prisma.supplier.findFirst({
        where: { code: "GENZSHOP" },
      });
      if (genzSupplier) {
        await prisma.supplierProductMapping.upsert({
          where: { productId: product.id },
          update: {
            supplierId: genzSupplier.id,
            supplierProductCode: pkg.supplierCode,
            supplierPrice: pkg.supplierPrice,
            markupType: "FIXED_AMOUNT",
            markupValue: pkg.price - pkg.supplierPrice,
            isAutoSync: false,
          },
          create: {
            productId: product.id,
            supplierId: genzSupplier.id,
            supplierProductCode: pkg.supplierCode,
            supplierPrice: pkg.supplierPrice,
            supplierStock: pkg.supplierStock,
            markupType: "FIXED_AMOUNT",
            markupValue: pkg.price - pkg.supplierPrice,
            isAutoSync: false,
          },
        });
      }
      console.log(`  └─ Configured as LOCAL_STOCK with cost=${pkg.supplierPrice.toLocaleString("vi-VN")}đ, markup=+${(pkg.price - pkg.supplierPrice).toLocaleString("vi-VN")}đ`);
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
    console.log(`✓ Deactivated ${deactRes.count} old duplicate Codex products`);

    // Verify Claude count
    const activeClaude = await prisma.product.findMany({
      where: {
        slug: { in: packagesToActivate.map((p) => p.slug) },
        isActive: true,
      },
      select: { slug: true, title: true, price: true },
    });
    console.log(`\nActive Claude API products (${activeClaude.length}):`);
    activeClaude.forEach((p) => console.log(` - ${p.title} (${p.slug}): ${p.price.toLocaleString("vi-VN")}đ`));
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // Check if running on Fly.io production
  if (fs.existsSync("/data/dev.db")) {
    await activateInDb("file:/data/dev.db");
  } else {
    // Run locally
    const devDbPath = path.join(__dirname, "..", "prisma", "dev.db");
    const rootDevDbPath = path.join(__dirname, "..", "dev.db");

    if (fs.existsSync(rootDevDbPath)) {
      await activateInDb(`file:${rootDevDbPath}`);
    }
    if (fs.existsSync(devDbPath)) {
      await activateInDb(`file:${devDbPath}`);
    }
  }
}

main().catch((e) => {
  console.error("Activation failed:", e);
  process.exit(1);
});
