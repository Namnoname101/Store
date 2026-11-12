const fs = require('fs');
const canvaSvg = fs.readFileSync('DichVu/public/images/raw_logos/canva.svg', 'utf8');
const pathMatch = canvaSvg.match(/<path d="([^"]+)"/);
if (pathMatch) console.log('Canva path length:', pathMatch[1].length);

const msSvg = fs.readFileSync('DichVu/public/images/raw_logos/microsoft_365.svg', 'utf8');
console.log('MS 365 SVG length:', msSvg.length);
