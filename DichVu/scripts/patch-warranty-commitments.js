const fs = require('fs');
const path = require('path');

// 1. Patch ProductDetailTabs.tsx
const pdtPath = path.join(__dirname, '..', 'src', 'components', 'ProductDetailTabs.tsx');
let pdtContent = fs.readFileSync(pdtPath, 'utf8');

// Insert warrantyCommitment logic after activeSnippetLang
const targetPdtState = `  const [activeSnippetLang, setActiveSnippetLang] = useState<"curl" | "python" | "typescript">("curl");`;
const replacementPdtState = `  const [activeSnippetLang, setActiveSnippetLang] = useState<"curl" | "python" | "typescript">("curl");

  // Dynamic warranty commitment based on supplier policy
  const slugLower = (product.slug || "").toLowerCase();
  const catSlugLower = (product.category?.slug || "").toLowerCase();
  const titleLower = (product.title || "").toLowerCase();

  const warrantyCommitment = isChatGPTBHF
    ? {
        title: "1-Đổi-1 trọn 30 ngày (Gói BHF)",
        desc: "Bảo hành 1 đổi 1 hoặc cấp lại Plus trong suốt 30 ngày sử dụng nếu phát sinh lỗi kỹ thuật từ hệ thống.",
      }
    : isChatGPT
    ? {
        title: "Bảo hành đăng nhập 24H (Chuẩn NCC)",
        desc: "Đổi mới tức thì trong 24 giờ đầu nếu sai mật khẩu hoặc tài khoản chưa kích hoạt Plus từ nhà cung cấp.",
      }
    : isApiKeyProduct || isCodex || isClaude
    ? {
        title: "Bảo lưu Quota & Kết nối API",
        desc: "Cam kết số dư credit khả dụng chuẩn xác và đường truyền API ổn định theo thông số niêm yết.",
      }
    : slugLower.includes("suno") || titleLower.includes("suno")
    ? {
        title: "Bảo hành login 24H & 2.500 Credits",
        desc: "Bảo hành đăng nhập thành công và chuẩn xác số dư 2.500 credits ban đầu trong 24 giờ đầu theo chính sách NCC.",
      }
    : slugLower.includes("hma") || titleLower.includes("hma")
    ? {
        title: "Bảo hành kích hoạt bản quyền 5 thiết bị",
        desc: "Bảo hành 1 đổi 1 trong suốt thời hạn sử dụng nếu key phát sinh lỗi kích hoạt trên ứng dụng HMA.",
      }
    : catSlugLower.includes("smm") || product.type === "CUSTOM"
    ? {
        title: "Bảo hành duy trì số lượng",
        desc: "Cam kết xử lý và bù tụt số lượng tương tác theo đúng chính sách và thời hạn của từng server.",
      }
    : {
        title: "Bảo hành 1-Đổi-1 theo cam kết gói",
        desc: "Mọi trục trặc kỹ thuật được xử lý đổi mới hoặc hoàn lại tương ứng theo đúng chính sách niêm yết của nhà cung cấp.",
      };`;

if (!pdtContent.includes('const warrantyCommitment =')) {
  pdtContent = pdtContent.replace(targetPdtState, replacementPdtState);
}

// Update Step 3 text
pdtContent = pdtContent.replace(
  'Bảo hành 1 đổi 1 trong suốt thời hạn gói. Hỗ trợ kỹ thuật viên Zalo &amp; Telegram 24/7.',
  'Bảo hành 1 đổi 1 theo đúng chính sách niêm yết của gói. Kỹ thuật viên hỗ trợ Zalo &amp; Telegram 24/7.'
);

// Update 4 Cam ket block
pdtContent = pdtContent.replace(
  `<span>4 Cam kết dịch vụ &amp; Bảo hành chuẩn mực KhoDEE</span>`,
  `<span>4 Cam kết dịch vụ &amp; Trách nhiệm chuẩn mực KhoDEE</span>`
);

pdtContent = pdtContent.replace(
  `<h4 className="text-xs sm:text-sm font-bold text-foreground">1-Đổi-1 trọn thời hạn gói</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mọi trục trặc kỹ thuật được xử lý đổi mới hoặc hoàn lại tương ứng mà không phụ thu.
                  </p>`,
  `<h4 className="text-xs sm:text-sm font-bold text-foreground">{warrantyCommitment.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {warrantyCommitment.desc}
                  </p>`
);

fs.writeFileSync(pdtPath, pdtContent, 'utf8');
console.log('✓ Patched ProductDetailTabs.tsx');

// 2. Patch products/[slug]/page.tsx
const pagePath = path.join(__dirname, '..', 'src', 'app', 'products', '[slug]', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const targetPageWarranty = `  const warrantyLabel = isSMM
    ? "Bảo hành duy trì số lượng trong 30 ngày"
    : isApiKeyProduct
    ? "Bảo đảm kết nối ổn định & bảo lưu hạn mức trọn vẹn"
    : isChatGPTBHF
    ? "1 Đổi 1 Trọn Vẹn 30 Ngày (Gói BHF Cao Cấp)"
    : isChatGPT
    ? "Bảo hành đăng nhập 24H (Gói Tiết Kiệm - Chuẩn NCC)"
    : titleLower.includes("gemini") || titleLower.includes("duolingo")
    ? "1 đổi 1 trong 24h kích hoạt & hỗ trợ suốt 18 tháng"
    : "Bảo hành 1 đổi 1 trong suốt thời hạn sử dụng gói";`;

const replacementPageWarranty = `  const isSuno = slug.includes("suno") || titleLower.includes("suno");
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

pageContent = pageContent.replace(targetPageWarranty, replacementPageWarranty);
fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('✓ Patched products/[slug]/page.tsx');

// 3. Patch LiveOrderTicker.tsx
const tickerPath = path.join(__dirname, '..', 'src', 'components', 'LiveOrderTicker.tsx');
let tickerContent = fs.readFileSync(tickerPath, 'utf8');
tickerContent = tickerContent.replace(
  'text: "Bảo hành 1 đổi 1 toàn thời gian",',
  'text: "Bảo hành 1 đổi 1 chuẩn chính sách từng gói",'
);
fs.writeFileSync(tickerPath, tickerContent, 'utf8');
console.log('✓ Patched LiveOrderTicker.tsx');

// 4. Patch Footer.tsx
const footerPath = path.join(__dirname, '..', 'src', 'components', 'Footer.tsx');
let footerContent = fs.readFileSync(footerPath, 'utf8');
footerContent = footerContent.replace(
  `<div className="font-bold text-slate-900 dark:text-white text-sm">Bảo Hành 1 Đổi 1 Chuẩn Chỉ</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đổi mới ngay lập tức nếu phát sinh lỗi</p>`,
  `<div className="font-bold text-slate-900 dark:text-white text-sm">Bảo Hành Minh Bạch</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đúng cam kết theo từng nhà cung cấp</p>`
);
fs.writeFileSync(footerPath, footerContent, 'utf8');
console.log('✓ Patched Footer.tsx');

// 5. Patch QuickViewModal.tsx
const qvmPath = path.join(__dirname, '..', 'src', 'components', 'QuickViewModal.tsx');
let qvmContent = fs.readFileSync(qvmPath, 'utf8');
qvmContent = qvmContent.replace(
  `<span className="font-semibold block text-foreground">Bảo hành 1:1</span>
                <span className="text-muted-foreground text-[11px]">Trọn thời hạn gói</span>`,
  `<span className="font-semibold block text-foreground">Bảo hành 1:1</span>
                <span className="text-muted-foreground text-[11px]">Theo cam kết gói</span>`
);
fs.writeFileSync(qvmPath, qvmContent, 'utf8');
console.log('✓ Patched QuickViewModal.tsx');

// 6. Patch FloatingSupport.tsx
const fsPath = path.join(__dirname, '..', 'src', 'components', 'FloatingSupport.tsx');
let fsContent = fs.readFileSync(fsPath, 'utf8');
fsContent = fsContent.replace(
  '<span>Cam kết hoàn tiền & bảo hành 100% nếu có lỗi</span>',
  '<span>Cam kết hỗ trợ & bảo hành đúng chính sách từng gói</span>'
);
fs.writeFileSync(fsPath, fsContent, 'utf8');
console.log('✓ Patched FloatingSupport.tsx');

// 7. Patch SecretDisplay.tsx
const sdPath = path.join(__dirname, '..', 'src', 'components', 'SecretDisplay.tsx');
let sdContent = fs.readFileSync(sdPath, 'utf8');
sdContent = sdContent.replace(
  'content += "- Bảo hành 1-đổi-1 trọn thời gian sử dụng theo cam kết từng gói sản phẩm.\\n";',
  'content += "- Bảo hành 1-đổi-1 theo đúng chính sách và thời hạn của từng gói sản phẩm.\\n";'
);
fs.writeFileSync(sdPath, sdContent, 'utf8');
console.log('✓ Patched SecretDisplay.tsx');

console.log('All files patched successfully.');
