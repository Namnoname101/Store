const { spawnSync } = require('child_process');

const remoteScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const softwareCat = await prisma.category.findFirst({
    where: { slug: 'software' }
  });
  if (!softwareCat) {
    console.error('software category not found');
    return;
  }
  console.log('Found software category:', softwareCat.id, softwareCat.name);

  const updated = await prisma.product.updateMany({
    where: {
      OR: [
        { slug: 'capcut-pro-30-ngay' },
        { title: { contains: 'CapCut' } }
      ]
    },
    data: {
      categoryId: softwareCat.id
    }
  });
  console.log('Updated CapCut products count:', updated.count);

  const check = await prisma.product.findMany({
    where: { title: { contains: 'CapCut' } },
    include: { category: true }
  });
  console.log('Verified CapCut in DB:', JSON.stringify(check.map(p => ({ title: p.title, category: p.category.name, slug: p.category.slug })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const b64 = Buffer.from(remoteScript).toString('base64');
const cmd = `sh -c "echo ${b64} | base64 -d | node"`;

const res = spawnSync('fly.exe', ['ssh', 'console', '-C', cmd], {
  encoding: 'utf8',
  timeout: 30000,
});

console.log(res.stdout);
