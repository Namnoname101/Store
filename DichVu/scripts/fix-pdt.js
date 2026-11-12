const fs = require('fs');
const path = require('path');

const pdtPath = path.join(__dirname, '..', 'src', 'components', 'ProductDetailTabs.tsx');
let s = fs.readFileSync(pdtPath, 'utf8');

// Regex replace with CRLF awareness
s = s.replace(
  /<h4[^>]*>1-Đổi-1 trọn thời hạn gói<\/h4>[\r\n\s]*<p[^>]*>[^<]*<\/p>/,
  `<h4 className="text-xs sm:text-sm font-bold text-foreground">{warrantyCommitment.title}</h4>\n                  <p className="text-xs text-muted-foreground mt-0.5">\n                    {warrantyCommitment.desc}\n                  </p>`
);

fs.writeFileSync(pdtPath, s, 'utf8');
console.log('ProductDetailTabs regex replace done');
