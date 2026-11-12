const fs = require('fs');
const { spawnSync } = require('child_process');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.supplierProductMapping.findMany({
  include: { product: true }
}).then(res => {
  console.log('MAPPINGS_PROD:', JSON.stringify(res.map(m => ({
    slug: m.product.slug,
    productPrice: m.product.price,
    supplierPrice: m.supplierPrice,
    markupType: m.markupType,
    markupValue: m.markupValue,
    isAutoSync: m.isAutoSync
  }))));
  return p.$disconnect();
});
`;
const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});
console.log(res.stdout);
