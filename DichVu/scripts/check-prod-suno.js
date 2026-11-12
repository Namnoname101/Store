const fs = require('fs');
const { spawnSync } = require('child_process');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({
  where: { slug: { contains: 'suno' } }
}).then(p => {
  console.log('Suno in prod:', JSON.stringify(p, null, 2));
  return prisma.$disconnect();
});
`;

const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', `node -e "${code.replace(/\n/g, ' ')}"`], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});
console.log('stdout:', res.stdout);
console.log('stderr:', res.stderr);
