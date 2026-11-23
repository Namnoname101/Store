const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/lib/product-guides.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace duplicate resolvers
const regex = /(\s*\/\/\s*2\.14\s*YouTube[\s\S]*?PRODUCT_GUIDES\["youtube-premium-6-thang"\];\s*\})+/g;

content = content.replace(
  regex,
  `  // 2.14 YouTube\r\n  if (cleanSlug.includes("youtube") || cleanTitle.includes("youtube")) {\r\n    return PRODUCT_GUIDES["youtube-premium-1-thang"] || PRODUCT_GUIDES["youtube-premium-1-nam"];\r\n  }`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Cleaned up YouTube guide resolver');
