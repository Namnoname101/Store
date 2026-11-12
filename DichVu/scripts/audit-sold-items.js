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
  const items = await prisma.productItem.findMany({
    where: {
      status: 'SOLD',
    },
    include: {
      order: true,
      product: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  console.log('---SOLD_ITEMS_AUDIT---');
  for (const it of items) {
    const content = it.secretContent || '';
    const hasRaw = content.includes('Mã đơn') || content.includes('Thanh toán') || content.includes('Số dư') || content.includes('━━━');
    console.log('ID: ' + it.id + ' | Order: ' + (it.order ? it.order.orderCode : 'null') + ' | Product: ' + (it.product ? it.product.title : 'null') + ' | hasRaw: ' + hasRaw);
    if (hasRaw) {
      console.log('  -> RAW SNIPPET: ' + content.slice(0, 100).replace(/\\n/g, ' '));
    }
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
