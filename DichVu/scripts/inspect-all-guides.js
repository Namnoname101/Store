const fs = require('fs');
const content = fs.readFileSync(__dirname + '/../src/lib/product-guides.ts', 'utf8');

const regex = /["']([a-z0-9\-]+)["']:\s*\{/g;
let match;
const keys = [];
while ((match = regex.exec(content)) !== null) {
  keys.push(match[1]);
}
console.log('Defined guide keys in product-guides.ts (' + keys.length + '):');
console.log(keys);

const activeProds = JSON.parse(fs.readFileSync(__dirname + '/all-active-products-warranty.json', 'utf8').match(/\[\s*\{[\s\S]*\}\s*\]/)[0]);

console.log('\n--- CHECKING MISSING GUIDES FOR ACTIVE PRODUCTS ---');
activeProds.forEach(p => {
  const hasKey = keys.includes(p.slug);
  console.log((hasKey ? '✅' : '❌') + ' [' + p.slug + '] -> ' + p.supplierCode + ' (' + p.title + ')');
});
