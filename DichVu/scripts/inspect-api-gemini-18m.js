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
  const p = await prisma.product.findUnique({
    where: { slug: 'gem-0105-api-gemini-pro-18-thang-chinh-hang' },
    include: {
      orderItems: true,
      supplierMapping: true
    }
  });
  console.log('PRODUCT INFO:');
  console.log({
    id: p?.id,
    title: p?.title,
    slug: p?.slug,
    orderCount: p?.orderItems?.length,
    mappingId: p?.supplierMapping?.id
  });
  await prisma.$disconnect();
}

run().catch(console.error);
`;

const b64 = Buffer.from(code).toString('base64');
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', `node -e "eval(Buffer.from('${b64}', 'base64').toString())"`], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8',
  timeout: 10000
});

console.log(res.stdout);
if (res.stderr) console.error('STDERR:', res.stderr);
