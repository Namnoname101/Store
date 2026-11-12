const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: 'ChatGPT' } },
        { title: { contains: 'GPT' } },
        { title: { contains: 'OpenAI' } },
        { slug: { contains: 'chatgpt' } },
        { slug: { contains: 'gpt' } }
      ]
    },
    include: {
      supplierMapping: {
        include: { supplier: true }
      },
      category: true,
      items: {
        where: { status: 'AVAILABLE' }
      }
    },
    orderBy: { price: 'asc' }
  });

  console.log('---CHATGPT_PRODUCTS---');
  for (const p of products) {
    console.log(JSON.stringify({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice,
      type: p.type,
      fulfillmentType: p.fulfillmentType,
      isActive: p.isActive,
      category: p.category?.name,
      localStock: p.items?.length || 0,
      supplier: p.supplierMapping?.supplier ? {
        name: p.supplierMapping.supplier.name,
        code: p.supplierMapping.supplier.code,
        type: p.supplierMapping.supplier.type,
        supplierPrice: p.supplierMapping.supplierPrice,
        supplierStock: p.supplierMapping.supplierStock,
        supplierProductCode: p.supplierMapping.supplierProductCode,
      } : null,
      customConfig: p.supplierMapping?.customConfig
    }, null, 2));
  }
  console.log('---END---');
  await prisma.$disconnect();
}
run();
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
if (res.stderr) console.error('STDERR:', res.stderr);
