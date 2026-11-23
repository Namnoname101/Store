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
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      orderItems: { include: { product: true } },
      deliveredItems: true
    }
  });

  console.log('--- LATEST 15 ORDERS ON PRODUCTION ---');
  for (const o of orders) {
    console.log(JSON.stringify({
      id: o.id,
      code: o.orderCode,
      status: o.status,
      upstreamStatus: o.upstreamStatus,
      upstreamOrderId: o.upstreamOrderId,
      createdAt: o.createdAt,
      items: o.orderItems?.map(i => ({ title: i.product?.title, slug: i.product?.slug })),
      delivered: o.deliveredItems?.map(d => ({ content: d.content, secret: d.secret }))
    }, null, 2));
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
if (res.stderr) console.error('STDERR:', res.stderr);
