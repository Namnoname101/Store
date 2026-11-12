const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      supplierMapping: {
        include: { supplier: true }
      }
    },
    orderBy: [
      { category: { name: 'asc' } },
      { price: 'asc' }
    ]
  });

  console.log(`=== TỔNG CỘNG ${products.length} SẢN PHẨM TRONG DATABASE ===\n`);

  const list = products.map((p) => {
    const cost = p.supplierMapping ? p.supplierMapping.supplierPrice : null;
    const price = p.price;
    const profit = cost != null ? price - cost : null;
    const profitMargin = cost != null && price > 0 ? ((profit / price) * 100).toFixed(1) : null;
    
    return {
      title: p.title,
      slug: p.slug,
      category: p.category ? p.category.name : 'Chưa phân loại',
      isActive: p.isActive,
      fulfillmentType: p.fulfillmentType,
      supplierName: p.supplierMapping && p.supplierMapping.supplier ? p.supplierMapping.supplier.name : 'Nội bộ / KhoDEE',
      supplierCode: p.supplierMapping ? p.supplierMapping.supplierProductCode : 'N/A',
      costPrice: cost,
      sellingPrice: price,
      originalPrice: p.originalPrice,
      profit: profit,
      marginPercent: profitMargin,
      customConfig: p.supplierMapping?.customConfig || null,
    };
  });

  console.log(JSON.stringify(list, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
