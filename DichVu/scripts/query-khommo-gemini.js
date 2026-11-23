const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.supplier.findFirst({ where: { type: 'KHOMMO_API' } });
  if (!s) {
    console.error("KhoMMO supplier not found in DB!");
    return;
  }
  console.log(`Checking KhoMMO with API Key: ${s.apiKey?.slice(0, 8)}... BaseUrl: ${s.baseUrl}`);

  const baseUrl = (s.baseUrl || 'https://api.khommo.vn/api/partner/v1').replace(/\/+$/, '');
  const url = `${baseUrl}/products?limit=500`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${s.apiKey}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    console.error(`HTTP error ${res.status}: ${await res.text()}`);
    return;
  }

  const json = await res.json();
  const products = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  console.log(`Total products returned from KhoMMO: ${products.length}`);

  const geminiProds = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    return name.includes('gemini') || name.includes('gem_') || name.includes('gem ');
  });

  console.log(`\n=== ALL GEMINI PRODUCTS ON KHOMMO (${geminiProds.length}) ===`);
  for (const p of geminiProds) {
    console.log(JSON.stringify({
      id: p.id,
      code: p.code || p.sku,
      name: p.name,
      priceVnd: p.priceVnd || p.price,
      stock: p.stock,
      category: p.categoryName || p.category,
      status: p.status
    }, null, 2));
  }

  // Also check existing Gemini products in our DB
  const ourProducts = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: 'Gemini' } },
        { slug: { contains: 'gemini' } }
      ]
    },
    include: {
      supplierMapping: true
    }
  });

  console.log(`\n=== CURRENT GEMINI PRODUCTS IN OUR DB (${ourProducts.length}) ===`);
  for (const op of ourProducts) {
    console.log({
      id: op.id,
      slug: op.slug,
      title: op.title,
      price: op.price,
      isActive: op.isActive,
      supplierMapping: op.supplierMapping ? {
        supplierId: op.supplierMapping.supplierId,
        supplierProductCode: op.supplierMapping.supplierProductCode,
        supplierPrice: op.supplierMapping.supplierPrice,
        supplierStock: op.supplierMapping.supplierStock,
        isAutoSync: op.supplierMapping.isAutoSync
      } : null
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
