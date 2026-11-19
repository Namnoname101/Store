const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function removeLocal() {
  const prisma = new PrismaClient();
  try {
    const prod = await prisma.product.findUnique({
      where: { slug: 'gem-0105-api-gemini-pro-18-thang-chinh-hang' },
      include: { supplierMapping: true }
    });

    if (prod) {
      if (prod.supplierMapping) {
        await prisma.supplierProductMapping.delete({
          where: { id: prod.supplierMapping.id }
        });
        console.log('Local supplierMapping deleted.');
      }
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          isActive: false,
          title: `[NGỪNG BÁN] ${prod.title.replace(/^\[NGỪNG BÁN\]\s*/, '')}`
        }
      });
      console.log('Local product updated to [NGỪNG BÁN] and isActive: false.');
    } else {
      console.log('Local product not found or already removed.');
    }
  } catch (err) {
    console.error('Local error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

async function removeFly() {
  const envPath = path.resolve(__dirname, '../.env');
  const env = fs.readFileSync(envPath, 'utf8');
  const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

  const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const prod = await prisma.product.findUnique({
    where: { slug: 'gem-0105-api-gemini-pro-18-thang-chinh-hang' },
    include: { supplierMapping: true }
  });

  if (prod) {
    if (prod.supplierMapping) {
      await prisma.supplierProductMapping.delete({
        where: { id: prod.supplierMapping.id }
      });
      console.log('Fly supplierMapping deleted.');
    }
    const updated = await prisma.product.update({
      where: { id: prod.id },
      data: {
        isActive: false,
        title: '[NGỪNG BÁN] ' + prod.title.replace(/^\\[NGỪNG BÁN\\]\\s*/, '')
      }
    });
    console.log('Fly product deactivated successfully:', {
      id: updated.id,
      title: updated.title,
      isActive: updated.isActive,
      isPaused: updated.isPaused
    });
  } else {
    console.log('Fly product not found.');
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

  const b64 = Buffer.from(code).toString('base64');
  const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', `node -e "eval(Buffer.from('${b64}', 'base64').toString())"`], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
    encoding: 'utf8',
    timeout: 15000
  });

  console.log('FLY RESULT:\n', res.stdout);
  if (res.stderr) console.error('FLY STDERR:\n', res.stderr);
}

async function main() {
  console.log('--- Removing API Gemini 18 thang Locally ---');
  await removeLocal();
  console.log('--- Removing API Gemini 18 thang on Fly.io Production ---');
  await removeFly();
}

main().catch(console.error);
