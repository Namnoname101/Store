const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file === 'route.ts' || file === 'route.js') {
      results.push(full);
    }
  }
  return results;
}

const apiDir = path.join(__dirname, '../src/app/api');
const routes = walk(apiDir);

let count = 0;
for (const file of routes) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('dynamic = "force-dynamic"') && !content.includes("dynamic = 'force-dynamic'")) {
    content = `export const dynamic = "force-dynamic";\n` + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added force-dynamic to: ${path.relative(apiDir, file)}`);
    count++;
  }
}

console.log(`Updated ${count} API routes to force-dynamic.`);
