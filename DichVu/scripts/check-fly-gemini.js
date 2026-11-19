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
  const prods = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: 'Gemini' } },
        { slug: { contains: 'gemini' } }
      ]
    },
    include: {
      supplierMapping: true
    }
  });

  console.log('--- GEMINI PRODUCTS ON PRODUCTION DB (' + prods.length + ') ---');
  for (const p of prods) {
    console.log({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      isActive: p.isActive,
      supplierMapping: p.supplierMapping ? {
        supplierId: p.supplierMapping.supplierId,
        supplierProductCode: p.supplierMapping.supplierProductCode,
        supplierPrice: p.supplierMapping.supplierPrice,
        supplierStock: p.supplierMapping.supplierStock,
        isAutoSync: p.supplierMapping.isAutoSync
      } : null
    });
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
if (res.stderr) console.error(res.stderr);
