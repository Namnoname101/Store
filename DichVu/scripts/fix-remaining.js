const fs = require('fs');
const path = require('path');

// 1. QuickViewModal.tsx
const qvmPath = path.join(__dirname, '..', 'src', 'components', 'QuickViewModal.tsx');
let qvm = fs.readFileSync(qvmPath, 'utf8');
qvm = qvm.replace(
  /<span className="font-semibold block text-foreground">Bảo hành 1:1<\/span>[\r\n\s]*<span className="text-muted-foreground text-\[11px\]">Trọn thời hạn gói<\/span>/,
  `<span className="font-semibold block text-foreground">Bảo hành 1:1</span>\n                <span className="text-muted-foreground text-[11px]">Theo cam kết gói</span>`
);
fs.writeFileSync(qvmPath, qvm, 'utf8');
console.log('QuickViewModal done');

// 2. Footer.tsx
const footerPath = path.join(__dirname, '..', 'src', 'components', 'Footer.tsx');
let footer = fs.readFileSync(footerPath, 'utf8');
footer = footer.replace(
  /<div className="font-bold text-slate-900 dark:text-white text-sm">Bảo Hành 1 Đổi 1 Chuẩn Chỉ<\/div>[\r\n\s]*<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đổi mới ngay lập tức nếu phát sinh lỗi<\/p>/,
  `<div className="font-bold text-slate-900 dark:text-white text-sm">Bảo Hành Minh Bạch</div>\n              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đúng cam kết theo từng nhà cung cấp</p>`
);
fs.writeFileSync(footerPath, footer, 'utf8');
console.log('Footer done');

// 3. products/[slug]/page.tsx
const pagePath = path.join(__dirname, '..', 'src', 'app', 'products', '[slug]', 'page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');

// replace warrantyLabel block
const pageRegex = /const warrantyLabel = isSMM[\s\S]*?: "Bảo hành 1 đổi 1 trong suốt thời hạn sử dụng gói";/;
const pageReplacement = `const isSuno = slug.includes("suno") || titleLower.includes("suno");
  const isHMA = slug.includes("hma") || titleLower.includes("hma");

  const warrantyLabel = isSMM
    ? "Bảo hành duy trì số lượng theo server"
    : isApiKeyProduct
    ? "Bảo đảm kết nối ổn định & bảo lưu hạn mức trọn vẹn"
    : isChatGPTBHF
    ? "1 Đổi 1 Trọn Vẹn 30 Ngày (Gói BHF Cao Cấp)"
    : isChatGPT
    ? "Bảo hành đăng nhập 24H (Gói Tiết Kiệm - Chuẩn NCC)"
    : isSuno
    ? "Bảo hành đăng nhập 24H & 2.500 Credits ban đầu"
    : isHMA
    ? "Bảo hành kích hoạt 5 thiết bị trong suốt thời hạn key"
    : titleLower.includes("gemini") || titleLower.includes("duolingo")
    ? "1 đổi 1 trong 24h kích hoạt & hỗ trợ suốt thời hạn"
    : "Bảo hành 1 đổi 1 theo đúng cam kết từng gói";`;

page = page.replace(pageRegex, pageReplacement);
fs.writeFileSync(pagePath, page, 'utf8');
console.log('Page done');
