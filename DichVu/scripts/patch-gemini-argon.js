const fs = require('fs');
const path = require('path');

// 1. Update product-guides.ts
const guidePath = path.join(__dirname, '..', 'src', 'lib', 'product-guides.ts');
let guideContent = fs.readFileSync(guidePath, 'utf8');

const geminiGuideEntry = `  // ==========================================
  // 19. TÀI KHOẢN GEMINI PRO 5TB ARGON 4 (CHỦ FAMILY)
  // ==========================================
  "gemini-pro-argon-4-family-5tb": {
    title: "Hướng dẫn đăng nhập & sử dụng Tài khoản Gemini Pro 5TB (Chủ Family)",
    steps: [
      {
        text: "Bước 1: Mở trình duyệt ẩn danh (Incognito) hoặc hồ sơ Chrome mới, truy cập https://accounts.google.com",
        caption: "Bước 1: Mở trang đăng nhập tài khoản Google",
      },
      {
        text: "Bước 2: Nhập thông tin Email và Mật khẩu được cấp ở trên để tiến hành đăng nhập.",
        caption: "Bước 2: Điền Email và Password được bàn giao",
      },
      {
        text: "Bước 3: Tại màn hình xác thực 2 bước (2FA), sao chép chuỗi mã 2FA Secret Key được cấp, dán vào trang web https://2fa.live (hoặc ứng dụng Google Authenticator) để lấy mã số 6 chữ số và xác nhận đăng nhập.",
        caption: "Bước 3: Xác thực 2FA nhanh chóng qua 2fa.live",
      },
      {
        text: "Bước 4: Truy cập https://gemini.google.com để bắt đầu sử dụng Gemini Pro và trải nghiệm mô hình Gemini 4 Argon trong Google Antigravity & AI Studio.",
        caption: "Bước 4: Trải nghiệm Gemini 4 Argon & Gemini 3.8 Flash",
      },
      {
        text: "Bước 5 (Chia sẻ Family): Truy cập https://myaccount.google.com/family/details. Bạn là Chủ nhóm (Family Manager), hãy bấm 'Mời thành viên' và nhập Gmail cá nhân của bạn (tối đa 5 người) để cùng hưởng 5TB lưu trữ Google One.",
        caption: "Bước 5: Mời tối đa 5 tài khoản Gmail vào Family dùng chung 5TB",
      },
    ],
    note: "QUY ĐỊNH BẢO HÀNH (GÓI TRẢI NGHIỆM - KBH): Bảo hành đăng nhập thành công và chuẩn xác thông tin tài khoản trong 2 giờ đầu (1 đổi 1 ngay nếu sai mật khẩu hoặc lỗi 2FA lúc nhận). Sau khi đăng nhập thành công: KHÔNG BẢO HÀNH THỜI GIAN SỬ DỤNG theo đúng chính sách của nhà cung cấp. LƯU Ý: Gmail này bị khóa hộp thư đến (không nhận được email/OTP bên ngoài) và chỉ dùng cho các dịch vụ Google (Gemini, Drive 5TB, Antigravity, NotebookLM). Khuyến cáo không lưu trữ tài liệu kinh doanh quan trọng duy nhất.",
    docsUrl: "https://gemini.google.com",
  },
};`;

if (!guideContent.includes('gemini-pro-argon-4-family-5tb')) {
  guideContent = guideContent.replace(/\n\};\s*\n\/\*\*\s*\n \* Hàm phân giải thông minh/, '\n' + geminiGuideEntry + '\n\n/**\n * Hàm phân giải thông minh');
  fs.writeFileSync(guidePath, guideContent, 'utf8');
  console.log('✓ Added guide to product-guides.ts');
}

// 2. Update ProductDetailTabs.tsx
const pdtPath = path.join(__dirname, '..', 'src', 'components', 'ProductDetailTabs.tsx');
let pdtContent = fs.readFileSync(pdtPath, 'utf8');

const targetPdtGemini = `    : slugLower.includes("suno") || titleLower.includes("suno")
    ? {
        title: "Bảo hành login 24H & 2.500 Credits",
        desc: "Bảo hành đăng nhập thành công và chuẩn xác số dư 2.500 credits ban đầu trong 24 giờ đầu theo chính sách NCC.",
      }`;

const replacementPdtGemini = `    : (slugLower.includes("gemini") && (slugLower.includes("family") || slugLower.includes("kbh") || titleLower.includes("kbh")))
    ? {
        title: "Bảo hành đăng nhập 2H (Gói Trải Nghiệm - KBH)",
        desc: "Bảo hành 1 đổi 1 trong 2 giờ đầu nếu sai mật khẩu hoặc lỗi 2FA lúc nhận. Sau khi đăng nhập thành công: Không bảo hành thời gian sử dụng theo chính sách NCC.",
      }
    : slugLower.includes("suno") || titleLower.includes("suno")
    ? {
        title: "Bảo hành login 24H & 2.500 Credits",
        desc: "Bảo hành đăng nhập thành công và chuẩn xác số dư 2.500 credits ban đầu trong 24 giờ đầu theo chính sách NCC.",
      }`;

if (!pdtContent.includes('Bảo hành đăng nhập 2H (Gói Trải Nghiệm - KBH)')) {
  pdtContent = pdtContent.replace(targetPdtGemini, replacementPdtGemini);
  fs.writeFileSync(pdtPath, pdtContent, 'utf8');
  console.log('✓ Updated ProductDetailTabs.tsx');
}

// 3. Update products/[slug]/page.tsx
const pagePath = path.join(__dirname, '..', 'src', 'app', 'products', '[slug]', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const targetPageFlags = `  const isSuno = slug.includes("suno") || titleLower.includes("suno");
  const isHMA = slug.includes("hma") || titleLower.includes("hma");`;

const replacementPageFlags = `  const isSuno = slug.includes("suno") || titleLower.includes("suno");
  const isHMA = slug.includes("hma") || titleLower.includes("hma");
  const isGeminiKBH = slug.includes("gemini") && (slug.includes("family") || slug.includes("kbh") || titleLower.includes("kbh"));`;

const targetPageWarranty = `    : isSuno
    ? "Bảo hành đăng nhập 24H & 2.500 Credits ban đầu"`;

const replacementPageWarranty = `    : isGeminiKBH
    ? "Bảo hành đăng nhập 2H (Gói Trải Nghiệm - KBH)"
    : isSuno
    ? "Bảo hành đăng nhập 24H & 2.500 Credits ban đầu"`;

const targetPageDuration = `    : isSuno
    ? "30 ngày sử dụng (2.500 Credits)"`;

const replacementPageDuration = `    : isGeminiKBH
    ? "Hạn 2 năm (Gói trải nghiệm KBH)"
    : isSuno
    ? "30 ngày sử dụng (2.500 Credits)"`;

if (!pageContent.includes('isGeminiKBH')) {
  pageContent = pageContent.replace(targetPageFlags, replacementPageFlags);
  pageContent = pageContent.replace(targetPageWarranty, replacementPageWarranty);
  pageContent = pageContent.replace(targetPageDuration, replacementPageDuration);
  fs.writeFileSync(pagePath, pageContent, 'utf8');
  console.log('✓ Updated products/[slug]/page.tsx');
}

console.log('All code updates complete.');
