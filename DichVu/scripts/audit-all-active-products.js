const fs = require('fs');

const products = require('./prod-products-price.json');

console.log(`Analyzing ${products.length} active products...`);

const report = products.map(p => {
  const price = p.sellingPrice;
  const cost = p.costPrice;
  const hasCost = cost !== null && cost !== undefined;
  const grossProfit = hasCost ? price - cost : null;
  const currentCtvComm = p.ctvCommissionVnd;
  const currentShopNet = p.profitAfterCtv;

  const isViolating = hasCost && (currentCtvComm >= currentShopNet);

  return {
    category: p.category,
    title: p.title,
    slug: p.slug,
    type: p.type,
    supplier: p.supplierName,
    cost: cost,
    price: price,
    grossProfit: grossProfit,
    ctvPercent: p.ctvPercent,
    currentCtvComm: currentCtvComm,
    currentShopNet: currentShopNet,
    isViolating: isViolating,
  };
});

const violating = report.filter(r => r.isViolating);
console.log(`Violating products count: ${violating.length} / ${report.filter(r => r.cost !== null).length}`);

fs.writeFileSync('scripts/active-audit-report.json', JSON.stringify(report, null, 2), 'utf8');
