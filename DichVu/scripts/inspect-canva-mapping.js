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
  const mapping = await prisma.supplierProductMapping.findMany({
    where: { product: { slug: 'canva-pro-1-thang' } },
    include: { supplier: true, product: true }
  });
  console.log('--- SUPPLIER MAPPING FOR CANVA ---');
  console.log(JSON.stringify(mapping, null, 2));

  // Also find all canva products
  const canvaProducts = await prisma.product.findMany({
    where: { 
      OR: [
        { slug: { contains: 'canva' } },
        { title: { contains: 'Canva' } }
      ]
    },
    include: { supplierMapping: { include: { supplier: true } } }
  });
  console.log('--- ALL CANVA PRODUCTS ---');
  console.log(JSON.stringify(canvaProducts, null, 2));

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
if (res.stderr) console.error('STDERR:', res.stderr);
