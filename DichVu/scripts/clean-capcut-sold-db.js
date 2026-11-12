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
  const r1 = await prisma.productItem.update({
    where: { id: 'd288ce6a-f0c1-490a-8f05-826866ec0104' },
    data: { secretContent: 'ObergVillagran786@outlook.com|1234567' }
  });
  console.log('Cleaned ORD834602 item:', r1.id, r1.secretContent);

  const r2 = await prisma.productItem.update({
    where: { id: '503e08af-dd06-4485-a4b0-dc8368d8928d' },
    data: { secretContent: 'RoyaleLegere981@outlook.com|1234567' }
  });
  console.log('Cleaned ORD531837 item:', r2.id, r2.secretContent);

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
