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
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      supplierMapping: {
        include: { supplier: true }
      },
      category: true
    },
    orderBy: { category: { name: 'asc' } }
  });

  const report = products.map(p => ({
    slug: p.slug,
    title: p.title,
    category: p.category?.name,
    price: p.price,
    supplierName: p.supplierMapping?.supplier?.name || 'LOCAL_STOCK',
    supplierCode: p.supplierMapping?.supplier?.code || 'LOCAL',
    supplierProductCode: p.supplierMapping?.supplierProductCode || '',
    supplierPrice: p.supplierMapping?.supplierPrice || 0,
    description: p.description
  }));

  console.log("===ACTIVE_PRODUCTS_COUNT: " + report.length + "===");
  console.log(JSON.stringify(report, null, 2));
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

fs.writeFileSync(path.join(__dirname, 'all-active-products-warranty.json'), res.stdout, 'utf8');
console.log('Saved to DichVu/scripts/all-active-products-warranty.json');
