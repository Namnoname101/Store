const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== ENSURING ALL REAL STORE PRODUCTS ARE ACTIVE (OUT OF STOCK SHOWN AS 'HẾT HÀNG') ===");

  // Exclude test / junk slugs
  const junkSlugs = ['tesssttt', 'test'];

  const products = await prisma.product.findMany({
    where: {
      slug: { notIn: junkSlugs },
      type: { not: 'CODEX_CREDIT' },
      category: { slug: { not: 'codex-credit' } }
    },
    select: { id: true, slug: true, title: true, isActive: true }
  });

  let activatedCount = 0;
  for (const prod of products) {
    if (!prod.isActive) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { isActive: true }
      });
      activatedCount++;
      console.log(`[ACTIVATED] ${prod.slug} -> ${prod.title}`);
    }
  }

  console.log(`\nDone! Activated ${activatedCount} products. Total real products: ${products.length}.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
