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
  const order = await prisma.order.findUnique({
    where: { orderCode: 'ORD225283' },
    include: {
      orderItems: { include: { product: true } },
      deliveredItems: true
    }
  });

  console.log('--- ORDER ORD225283 DETAILS ---');
  console.log(JSON.stringify(order, null, 2));

  // Also check product supplier mapping for canva-pro-1-thang
  const product = await prisma.product.findUnique({
    where: { slug: 'canva-pro-1-thang' },
    include: { supplier: true }
  });
  console.log('--- PRODUCT & SUPPLIER ---');
  console.log(JSON.stringify(product, null, 2));

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
