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
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: { product: true }
      },
      deliveredItems: true
    },
    orderBy: { createdAt: 'desc' },
    take: 15
  });

  console.log('---RECENT_ORDERS---');
  for (const o of orders) {
    const isCapcut = o.orderItems.some(it => it.product?.title?.toLowerCase().includes('capcut'));
    console.log('ID:', o.id, 'Code:', o.orderCode, 'Status:', o.status, 'Created:', o.createdAt, 'isCapcut:', isCapcut);
    console.log('  Upstream:', o.upstreamOrderId, o.upstreamStatus, o.upstreamError);
    for (const it of o.orderItems) {
      console.log('  Item:', it.product?.title, 'Qty:', it.quantity);
    }
    for (const d of o.deliveredItems) {
      console.log('  Delivered ID:', d.id, 'Data/Content:');
      console.log(JSON.stringify(d, null, 2));
    }
  }
  console.log('---END---');
  await prisma.$disconnect();
}

run().catch(e => console.error(e));
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
