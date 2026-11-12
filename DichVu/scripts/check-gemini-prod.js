const fs = require('fs');
const { spawnSync } = require('child_process');

const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findUnique({
  where: { slug: 'gemini-pro-argon-4-family-5tb' },
  include: {
    category: true,
    supplierMapping: { include: { supplier: true } }
  }
}).then(res => {
  console.log('---GEMINI_PROD---', JSON.stringify(res));
  return prisma.$disconnect();
});
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;

const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
console.log(res.stderr);
