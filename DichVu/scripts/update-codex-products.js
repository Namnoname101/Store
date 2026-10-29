const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
🎯 GIÁ TRỊ GÓI NẠP:
• Hạn mức: ${item.creditUsd}$ Credit (${item.quota} Quota Points).
• Thời hạn: Bảo lưu vĩnh viễn, không hết hạn cho đến khi dùng hết hạn mức.

💡 DÙNG ĐƯỢC CHO CÔNG CỤ NÀO?
• Cursor IDE, Claude Code CLI, Cline, Roo Code, VS Code, Continue.dev, Chatbox, NextChat...
• Tương thích 100% chuẩn OpenAI Compatible (Base URL: https://modelapi.vn/v1).
• Sử dụng chung được cho tất cả các mô hình AI: Claude 3.5 Sonnet, Claude Opus, GPT-4o, Gemini 1.5 Pro...

⚡ HÌNH THỨC NHẬN HÀNG:
• ĐÃ CÓ API Key: Hạn mức tự động cộng dồn trực tiếp vào Key của bạn sau khi thanh toán.
• CHƯA CÓ API Key: Hệ thống tự động tạo mới 1 API Key riêng biệt và bàn giao tức thì trên trang đơn hàng kèm hướng dẫn.

📖 Hướng dẫn chi tiết: Mở Cursor > Settings > Models > Bật OpenAI Compatible > Điền Base URL https://modelapi.vn/v1 và dán API Key.`;
}

async function run() {
  console.log('Updating 5 canonical Codex products...');
  for (const item of codexData) {
    const desc = buildDescription(item);
    await prisma.product.update({
      where: { slug: item.slug },
      data: {
        title: item.title,
        description: desc,
        isActive: true,
      },
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

run().catch(console.error);
