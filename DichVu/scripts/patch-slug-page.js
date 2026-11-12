const fs = require('fs');

let pageCode = fs.readFileSync('DichVu/src/app/products/[slug]/page.tsx', 'utf8');

const oldLogic = `  const titleLower = product.title.toLowerCase();
  const isChatGPT =
    product.slug.toLowerCase().includes("chatgpt") ||
    titleLower.includes("chatgpt") ||
    titleLower.includes("openai") ||
    titleLower.includes("gpt-4");

  const isChatGPTBHF =
    product.slug.toLowerCase().includes("bhf") ||
    titleLower.includes("bhf") ||
    titleLower.includes("bảo hành full");

  const isCodex =
    product.slug.toLowerCase().includes("codex") ||
    product.slug.toLowerCase().includes("cdx") ||
    titleLower.includes("codex");

  const isClaude =
    product.slug.toLowerCase().includes("claude") ||
    titleLower.includes("claude");

  const isApiKeyProduct =
    isClaude ||
    isCodex ||
    product.slug.toLowerCase().includes("api") ||
    titleLower.includes("api") ||
    product.category?.slug === "ai-api";

  const deliveryFormat = isSMM
    ? "Hệ thống tự động khởi tạo theo link mục tiêu"
    : isCodex
    ? "Nạp vào Key có sẵn hoặc cấp Key mới tức thì 24/7"
    : isChatGPT
    ? "Tài khoản (Email | Mật khẩu) bàn giao tức thì 24/7"
    : product.type === "LICENSE_KEY"
    ? "Mã bản quyền / API Key cấp tức thì sau thanh toán"
    : product.type === "ACCOUNT"
    ? "Tài khoản riêng tư / Link kích hoạt chính chủ"
    : "Bàn giao tự động qua hệ thống 24/7";

  const isSuno = slug.includes("suno") || titleLower.includes("suno");
  const isHMA = slug.includes("hma") || titleLower.includes("hma");
  const isGeminiKBH = slug.includes("gemini") && (slug.includes("family") || slug.includes("kbh") || titleLower.includes("kbh") || titleLower.includes("2 năm"));

  const durationLabel = isSMM
    ? "Hoàn thành theo số lượng đặt mua"
    : isCodex
    ? "Bảo lưu vĩnh viễn (Dùng đến khi hết Quota)"
    : isClaude
    ? "Bảo lưu theo hạn mức Credit / Request đã chọn"
    : isChatGPTBHF
    ? "30 ngày bảo hành Full Date (BHF)"
    : isChatGPT
    ? "30 ngày sử dụng (BH đăng nhập 24H)"
    : isGeminiKBH || titleLower.includes("2 năm") || slug.includes("2-nam")
    ? "24 tháng (Hạn 2 năm) - Gói KBH"
    : isSuno
    ? "30 ngày sử dụng (2.500 Credits)"
    : titleLower.includes("18 tháng")
    ? "18 tháng đầy đủ (Full date)"
    : titleLower.includes("12 tháng") || titleLower.includes("1 năm")
    ? "12 tháng (1 năm) bản quyền"
    : titleLower.includes("30 ngày") || titleLower.includes("1 tháng")
    ? "30 ngày đầy đủ"
    : titleLower.includes("3 tháng")
    ? "90 ngày (3 tháng)"
    : "Theo gói dịch vụ đã chọn";

  const warrantyLabel = isSMM
    ? "Bảo hành duy trì số lượng theo server"
    : isApiKeyProduct
    ? "Bảo đảm kết nối ổn định & bảo lưu hạn mức trọn vẹn"
    : isChatGPTBHF
    ? "1 Đổi 1 Trọn Vẹn 30 Ngày (Gói BHF Cao Cấp)"
    : isChatGPT
    ? "Bảo hành đăng nhập 24H (Gói Tiết Kiệm - Chuẩn NCC)"
    : isGeminiKBH
    ? "Bảo hành đăng nhập 2H (Gói Trải Nghiệm - KBH)"
    : isSuno
    ? "Bảo hành đăng nhập 24H & 2.500 Credits ban đầu"
    : isHMA
    ? "Bảo hành kích hoạt 5 thiết bị trong suốt thời hạn key"
    : titleLower.includes("gemini") || titleLower.includes("duolingo")
    ? "1 đổi 1 trong 24h kích hoạt & hỗ trợ suốt thời hạn"
    : "Bảo hành 1 đổi 1 theo đúng cam kết từng gói";`;

const newLogic = `  const titleLower = product.title.toLowerCase();
  const slugLower = product.slug.toLowerCase();

  const isChatGPT =
    slugLower.includes("chatgpt") ||
    titleLower.includes("chatgpt") ||
    titleLower.includes("openai") ||
    titleLower.includes("gpt-4");

  const isChatGPTFree = slugLower.includes("free-verify-phone") || titleLower.includes("free verify phone");
  const isChatGPTBusiness = slugLower.includes("business") || titleLower.includes("business");
  const isChatGPTPlusBHF = (slugLower.includes("bhf") || titleLower.includes("bhf") || titleLower.includes("bảo hành full")) && !isChatGPTBusiness;
  const isChatGPTPlus24H = isChatGPT && !isChatGPTFree && !isChatGPTBusiness && !isChatGPTPlusBHF;

  const isCapCut = slugLower.includes("capcut") || titleLower.includes("capcut");
  const isCapCut7D = isCapCut && (slugLower.includes("7-ngay") || titleLower.includes("7 ngày"));
  const isCapCut30D = isCapCut && !isCapCut7D;

  const isCodex =
    slugLower.includes("codex") ||
    slugLower.includes("cdx") ||
    titleLower.includes("codex");

  const isClaude =
    slugLower.includes("claude") ||
    titleLower.includes("claude");

  const isApiKeyProduct =
    isClaude ||
    isCodex ||
    slugLower.includes("api") ||
    titleLower.includes("api") ||
    product.category?.slug === "ai-api";

  const isSuno = slugLower.includes("suno") || titleLower.includes("suno");
  const isHMA = slugLower.includes("hma") || titleLower.includes("hma");
  const isGeminiKBH = slugLower.includes("gemini") && (slugLower.includes("family") || slugLower.includes("kbh") || titleLower.includes("kbh") || titleLower.includes("2 năm"));

  const deliveryFormat = isSMM
    ? "Hệ thống tự động khởi tạo theo link mục tiêu"
    : isCodex
    ? "Nạp vào Key có sẵn hoặc cấp Key mới tức thì 24/7"
    : isChatGPTFree
    ? "Tài khoản Free sạch (Email | Pass) đã SMS Verify sẵn 24/7"
    : isChatGPTBusiness
    ? "Tài khoản (Email | Pass) đã vào Workspace Business"
    : isChatGPT
    ? "Tài khoản cấp sẵn (Email | Pass) - Tuyệt đối không xóa 2FA"
    : isCapCut
    ? "Tài khoản cấp sẵn (Chỉ dùng 1 máy duy nhất - Không logout)"
    : product.type === "LICENSE_KEY"
    ? "Mã bản quyền / API Key cấp tức thì sau thanh toán"
    : product.type === "ACCOUNT"
    ? "Tài khoản riêng tư / Link kích hoạt chính chủ"
    : "Bàn giao tự động qua hệ thống 24/7";

  const durationLabel = isSMM
    ? "Hoàn thành theo số lượng đặt mua"
    : isCodex
    ? "Bảo lưu vĩnh viễn (Dùng đến khi hết Quota)"
    : isClaude
    ? "Bảo lưu theo hạn mức Credit / Request đã chọn"
    : isChatGPTFree
    ? "Vĩnh viễn (Tài khoản Free cá nhân đã SMS Verify)"
    : isChatGPTBusiness
    ? "30 ngày trong Workspace Business (BHF 30D)"
    : isChatGPTPlusBHF
    ? "30 ngày bảo hành Full Date (BHF 30D)"
    : isChatGPTPlus24H
    ? "30 ngày sử dụng (BH đăng nhập 24H - Gói Tiết Kiệm)"
    : isCapCut7D
    ? "7 ngày sử dụng Pro (BHF 7 ngày - 1 Máy)"
    : isCapCut30D
    ? "30 ngày sử dụng Pro (BHF 30 ngày - 1 Máy)"
    : isGeminiKBH || titleLower.includes("2 năm") || slugLower.includes("2-nam")
    ? "24 tháng (Hạn 2 năm) - Gói KBH"
    : isSuno
    ? "30 ngày sử dụng (2.500 Credits)"
    : titleLower.includes("18 tháng")
    ? "18 tháng đầy đủ (Full date)"
    : titleLower.includes("12 tháng") || titleLower.includes("1 năm")
    ? "12 tháng (1 năm) bản quyền"
    : titleLower.includes("30 ngày") || titleLower.includes("1 tháng")
    ? "30 ngày đầy đủ"
    : titleLower.includes("3 tháng")
    ? "90 ngày (3 tháng)"
    : "Theo gói dịch vụ đã chọn";

  const warrantyLabel = isSMM
    ? "Bảo hành duy trì số lượng theo server"
    : isApiKeyProduct
    ? "Bảo đảm kết nối ổn định & bảo lưu hạn mức trọn vẹn"
    : isChatGPTFree
    ? "1 Đổi 1 trong 24H nếu sai pass hoặc chưa SMS Verify"
    : isChatGPTBusiness
    ? "1 Đổi 1 trọn vẹn 30 ngày (BHF 30D chuẩn NCC DKey)"
    : isChatGPTPlusBHF
    ? "1 Đổi 1 Trọn Vẹn 30 Ngày (BHF 30D - Giữ nguyên 2FA)"
    : isChatGPTPlus24H
    ? "Bảo hành đăng nhập 24H (Gói Tiết Kiệm - Chuẩn NCC Xoài Non)"
    : isCapCut
    ? "1 Đổi 1 suốt thời hạn (Bắt buộc dùng 1 máy, cấm logout, cấm xóa app)"
    : isGeminiKBH
    ? "Bảo hành đăng nhập 2H (Gói Trải Nghiệm - KBH)"
    : isSuno
    ? "Bảo hành đăng nhập 24H & 2.500 Credits ban đầu"
    : isHMA
    ? "Bảo hành kích hoạt 5 thiết bị trong suốt thời hạn key"
    : titleLower.includes("gemini") || titleLower.includes("duolingo")
    ? "1 đổi 1 trong 24h kích hoạt & hỗ trợ suốt thời hạn"
    : "Bảo hành 1 đổi 1 theo đúng cam kết từng gói";`;

const normalize = s => s.replace(/\r\n/g, '\n');
pageCode = normalize(pageCode);

if (pageCode.includes(normalize(oldLogic))) {
  pageCode = pageCode.replace(normalize(oldLogic), normalize(newLogic));
  fs.writeFileSync('DichVu/src/app/products/[slug]/page.tsx', pageCode);
  console.log('Successfully patched page.tsx!');
} else {
  console.warn('Could not find oldLogic in page.tsx');
}
