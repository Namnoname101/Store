const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/catalog-grouping.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target = `  // Creative & design software accounts are legitimate tools, not short-term API keys
  if (
    text.includes("meitu") ||
    text.includes("capcut") ||
    text.includes("wink") ||
    text.includes("photoroom") ||
    text.includes("xingtu")
  ) {
    return false;
  }`;

const replacement = `  // Non-API products (consumer software, creative accounts, VPN, entertainment) are legitimate tools
  if (
    text.includes("suno") ||
    text.includes("hma") ||
    text.includes("adobe") ||
    text.includes("chatgpt") ||
    text.includes("meitu") ||
    text.includes("capcut") ||
    text.includes("wink") ||
    text.includes("photoroom") ||
    text.includes("xingtu") ||
    text.includes("kling") ||
    text.includes("muse") ||
    text.includes("netflix") ||
    text.includes("spotify") ||
    text.includes("vpn") ||
    text.includes("zoom")
  ) {
    return false;
  }`;

const normalize = s => s.replace(/\r\n/g, '\n');
content = normalize(content);
if (content.includes(normalize(target))) {
  content = content.replace(normalize(target), normalize(replacement));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated catalog-grouping.ts');
} else {
  console.error('Target not found in catalog-grouping.ts');
}
