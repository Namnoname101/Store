const fs = require('fs');
const path = require('path');

const footerPath = path.join(__dirname, '..', 'src', 'components', 'Footer.tsx');
let footer = fs.readFileSync(footerPath, 'utf8');
footer = footer.replace(
  /<div className="font-bold text-slate-900 dark:text-white text-sm">Bảo Hành 1 Đổi 1 Chuẩn Chỉ<\/div>[\r\n\s]*<div className="text-xs text-slate-500 dark:text-slate-400 mt-0\.5">Đổi mới ngay lập tức nếu phát sinh lỗi<\/div>/,
  `<div className="font-bold text-slate-900 dark:text-white text-sm">Bảo Hành Minh Bạch</div>\n              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Đúng cam kết theo từng nhà cung cấp</div>`
);
fs.writeFileSync(footerPath, footer, 'utf8');
console.log('Footer patched successfully');
