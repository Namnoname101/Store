const fs = require('fs');
const path = 'DichVu/src/lib/catalog-grouping.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `  // Meitu & CapCut products are editing software accounts, not short-term API keys
  if (text.includes("meitu") || text.includes("capcut")) {
    return false;
  }`;

const replacement = `  // Creative & design software accounts are legitimate tools, not short-term API keys
  if (
    text.includes("meitu") ||
    text.includes("capcut") ||
    text.includes("wink") ||
    text.includes("photoroom") ||
    text.includes("xingtu")
  ) {
    return false;
  }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated catalog-grouping.ts (LF)');
} else if (content.includes(target.replace(/\n/g, '\r\n'))) {
  content = content.replace(target.replace(/\n/g, '\r\n'), replacement.replace(/\n/g, '\r\n'));
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated catalog-grouping.ts (CRLF)');
} else {
  console.error('Target not found!');
  process.exit(1);
}
