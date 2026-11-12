const fs = require('fs');
const { spawnSync } = require('child_process');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const recentOrders = await prisma.order.findMany({
    where: {
      orderItems: {
        some: {
          product: {
            slug: { contains: 'codex' }
          }
        }
      }
    },
    include: {
      orderItems: {
        include: { product: true }
      },
      creditTopupOrder: {
        include: { binding: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('---RECENT_CODEX_ORDERS---' + JSON.stringify(recentOrders, null, 2) + '---END---');
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024
});

console.log(res.stdout);
if (res.stderr && !res.stderr.includes('Connecting')) {
  console.error(res.stderr);
}
