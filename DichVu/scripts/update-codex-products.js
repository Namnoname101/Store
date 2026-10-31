const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const thumbnails = {
  'cdx-0055-api-codex-ai-toc-o-nhanh-10-credit': '/images/products/product_1787638230_52272f23.png',
  'cdx-0056-api-codex-ai-toc-o-nhanh-50-credit': '/images/products/product_1787638234_863b284a.png',
  'cdx-0057-api-codex-ai-toc-o-nhanh-100-credit': '/images/products/product_1787638249_4d06fb88.png',
  'cdx-0058-api-codex-ai-toc-o-nhanh-200-credit': '/images/products/product_1787638239_4581ea3c.png',
  'cdx-0060-api-codex-ai-toc-o-nhanh-500-credit': '/images/products/product_1787638243_e841fb78.png',
};

const codexData = [
  {
    slug: 'cdx-0055-api-codex-ai-toc-o-nhanh-10-credit',
    title: 'API Codex AI - tốc độ nhanh (10$ Credit)',
    creditUsd: 10,
    quota: '5.000.000',
    vndHeader: '10.000 VNĐ = 10$ Credit',
  },
  {
    slug: 'cdx-0056-api-codex-ai-toc-o-nhanh-50-credit',
    title: 'API Codex AI - tốc độ nhanh (50$ Credit)',
    creditUsd: 50,
    quota: '25.000.000',
    vndHeader: '50.000 VNĐ = 50$ Credit',
  },
  {
    slug: 'cdx-0057-api-codex-ai-toc-o-nhanh-100-credit',
    title: 'API Codex AI - tốc độ nhanh (100$ Credit)',
    creditUsd: 100,
    quota: '50.000.000',
    vndHeader: '100.000 VNĐ = 100$ Credit',
  },
  {
    slug: 'cdx-0058-api-codex-ai-toc-o-nhanh-200-credit',
    title: 'API Codex AI - tốc độ nhanh (200$ Credit)',
    creditUsd: 200,
    quota: '100.000.000',
    vndHeader: '200.000 VNĐ = 200$ Credit',
  },
  {
    slug: 'cdx-0060-api-codex-ai-toc-o-nhanh-500-credit',
    title: 'API Codex AI - tốc độ nhanh (500$ Credit)',
    creditUsd: 500,
    quota: '250.000.000',
    vndHeader: '450.000 VNĐ = 500$ Credit',
  },
];

function buildDescription(item) {
  return `${item.vndHeader}

• Hạn mức: ${item.creditUsd}$ Credit (${item.quota} Quota Points)
• Thời hạn: Bảo lưu vĩnh viễn, không giới hạn thời gian sử dụng
• Chuẩn API: Tương thích 100% chuẩn OpenAI Compatible (Cursor IDE, VS Code, Cline, ChatGPT App)
• Mô hình AI: Hỗ trợ đầy đủ Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, DeepSeek...
• Bàn giao: Tự động nạp vào Key có sẵn hoặc cấp Key mới tức thì 24/7`;
}

async function run() {
  const cat = await prisma.category.findFirst({
    where: { slug: { in: ['ai-api', 'codex-credit'] } }
  });
  if (!cat) throw new Error("No AI category found");

  console.log('Updating 5 canonical Codex products...');
  for (const item of codexData) {
    const desc = buildDescription(item);
    const thumb = thumbnails[item.slug];
    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: desc,
        thumbnailUrl: thumb,
        isActive: true,
      },
      create: {
        slug: item.slug,
        title: item.title,
        description: desc,
        thumbnailUrl: thumb,
        price: item.creditUsd === 10 ? 22000 : item.creditUsd === 50 ? 110000 : item.creditUsd === 100 ? 220000 : item.creditUsd === 200 ? 440000 : 990000,
        originalPrice: item.creditUsd === 10 ? 45000 : item.creditUsd === 50 ? 190000 : item.creditUsd === 100 ? 360000 : item.creditUsd === 200 ? 750000 : 1490000,
        type: "LICENSE_KEY",
        fulfillmentType: "API_DROPSHIP",
        categoryId: cat.id,
        isActive: true,
      }
    });
    console.log(`✓ Updated: ${item.title}`);
  }

  // Deactivate old duplicate products
  const oldSlugs = [
    'cdx-0055-api-codex-ai-toc-o-nhanh',
    'cdx-0056-api-codex-ai-toc-o-nhanh',
    'cdx-0057-api-codex-ai-toc-o-nhanh',
    'cdx-0058-api-codex-ai-toc-o-nhanh',
    'cdx-0060-api-codex-ai-toc-o-nhanh',
  ];

  console.log('Deactivating old duplicates...');
  for (const s of oldSlugs) {
    await prisma.product.updateMany({
      where: { slug: s },
      data: { isActive: false },
    });
  }
  console.log('Done!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
