/**
 * Ẩn (isActive=false) tất cả sản phẩm API không phải Codex / Claude.
 * Không xoá để giữ lịch sử đơn hàng; bật lại được trong Admin.
 * Usage: node scripts/hide-non-codex-claude-api.js [--dry]
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const DRY = process.argv.includes('--dry');

const KEEP = /codex|cdx-|claude|cla-/i;
// Chỉ nhắm sản phẩm API (slug có "-api-" hoặc Kiro router), tránh đụng tài khoản thường
const IS_API = /(^|-)api-|kiro-ai/i;

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true, category: { name: { contains: 'API' } } },
    select: { id: true, slug: true, title: true, price: true },
  });
  const targets = products.filter((p) => IS_API.test(p.slug) && !KEEP.test(p.slug));
  console.log(`${DRY ? '[DRY] ' : ''}Ẩn ${targets.length} sản phẩm:`);
  targets.forEach((p) => console.log(`  - ${p.slug} (${p.price})`));
  if (!DRY && targets.length) {
    const r = await prisma.product.updateMany({
      where: { id: { in: targets.map((p) => p.id) } },
      data: { isActive: false },
    });
    console.log(`Đã ẩn ${r.count} sản phẩm.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
