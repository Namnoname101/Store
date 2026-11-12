const fs = require('fs');
const content = fs.readFileSync(__dirname + '/all-active-products-warranty.json', 'utf8');
const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
if (jsonMatch) {
  const list = JSON.parse(jsonMatch[0]);
  console.log('Total active products:', list.length);
  list.forEach((p, idx) => {
    console.log((idx + 1) + '. [' + p.slug + '] -> ' + p.supplierCode + ' (Code: ' + p.supplierProductCode + ') | ' + p.title);
  });
} else {
  console.log('Could not parse JSON. Preview:\n', content.slice(0, 500));
}
