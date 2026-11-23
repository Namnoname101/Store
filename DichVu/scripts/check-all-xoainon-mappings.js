const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const xn = await prisma.supplierProductMapping.findMany({
    where: { supplierId: '3dd18991-96df-44ef-a892-7d5982fa4b25' },
    select: {
      productId: true,
      supplierProductCode: true,
      customConfig: true
    }
  });

  for (const m of xn) {
    if (m.customConfig) console.log(m.supplierProductCode, 'config:', m.customConfig);
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});
console.log('STDOUT:\n', res.stdout);
console.log('STDERR:\n', res.stderr);
