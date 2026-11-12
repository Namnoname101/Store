const fs = require('fs');
const { spawnSync } = require('child_process');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const order = await prisma.order.findUnique({
    where: { orderCode: 'ORD334419' },
    include: { creditTopupOrder: true }
  });

  if (order && order.creditTopupOrder) {
    await prisma.creditTopupOrder.update({
      where: { id: order.creditTopupOrder.id },
      data: {
        creditUsd: 20,
        quotaUnits: 10000000,
        status: 'COMPLETED'
      }
    });

    await prisma.customerApiKeyBinding.update({
      where: { id: order.creditTopupOrder.bindingId },
      data: {
        totalCreditUsd: 20,
        lastSyncedAt: new Date()
      }
    });

    console.log('[PROD OK] Đã cập nhật đơn ORD334419 thành công: 20$ (10.000.000 Quota)!');
  } else {
    console.log('Không tìm thấy đơn ORD334419');
  }

  await prisma.$disconnect();
}

run().catch(e => console.error(e));
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
