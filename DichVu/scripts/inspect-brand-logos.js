const fs = require('fs');
const content = fs.readFileSync('DichVu/src/components/BrandLogo.tsx', 'utf8');
const cases = [...content.matchAll(/case "([^"]+)":/g)].map(m => m[1]);
console.log('All cases in BrandLogo:', cases);
