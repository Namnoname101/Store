const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/lib/product-guides.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target = `  // ==========================================
  // 9. CÁC GÓI ADOBE CREATIVE CLOUD ALL APPS
  // ==========================================`;

const newGuides = `  // ==========================================
  // 10. XINGTU (TỈNH TÚ) VIP
  // ==========================================
  "xingtu-vip-30-ngay": {
    title: "Hướng dẫn đăng nhập & kích hoạt Xingtu (醒图) VIP",
    steps: [
      "Tải ứng dụng Xingtu (醒图) trên App Store (cần chuyển vùng Trung Quốc nếu dùng iOS) hoặc cài file APK / CH Play trên Android.",
      "Mở app Xingtu > Chọn màn hình đăng nhập > Chạm vào mã vùng +86 rồi đổi sang +1 (Hoa Kỳ / US).",
      "Mở link OTP nhận được tại đơn hàng > Bấm sao chép số điện thoại (+1...) rồi dán vào ô đăng nhập của app.",
      "Tích chọn đồng ý điều khoản dịch vụ > Bấm 'Gửi mã xác minh' (Get Code).",
      "Quay lại trang link OTP, bấm làm mới (F5) trình duyệt để lấy mã 4-6 số > Nhập mã vào app để đăng nhập thành công VIP.",
    ],
    note: "Tài khoản bảo hành Full thời hạn (1 đổi 1 nếu mất VIP). QUY ĐỊNH BẮT BUỘC: Chỉ dùng trên 1 máy duy nhất. Tuyệt đối không đăng nhập máy thứ 2, không đăng xuất, không xóa app để duy trì quyền lợi bảo hành.",
  },

  // ==========================================
  // 11. QUIZLET PLUS TEACHER
  // ==========================================
  "quizlet-plus-1-thang": {
    title: "Hướng dẫn đăng nhập & sử dụng Quizlet Plus (Gói Teacher)",
    steps: [
      "Truy cập website chính thức https://quizlet.com/ hoặc mở ứng dụng Quizlet trên iOS / Android.",
      "Đăng nhập bằng thông tin Email và Mật khẩu được cung cấp ở trên.",
      "Kiểm tra huy hiệu Plus/Teacher: Tận hưởng học tập 100% không quảng cáo, mở khóa toàn bộ chế độ Learn, Test thông minh.",
      "Thoải mái tạo bộ thẻ ghi nhớ (Flashcard) không giới hạn, tạo lớp học và giao bài ôn tập cho học viên.",
    ],
    note: "Bảo hành Full 30 ngày 1 đổi 1. Vui lòng không chia sẻ tài khoản cho người khác để tránh checkpoint bảo mật.",
  },

  // ==========================================
  // 12. PHOTOROOM MAX 7 NGÀY
  // ==========================================
  "photoroom-max-7-ngay": {
    title: "Hướng dẫn đăng nhập & kích hoạt Photoroom Max",
    steps: [
      "Truy cập https://www.photoroom.com/ hoặc tải ứng dụng Photoroom trên điện thoại.",
      "Đăng nhập bằng Email và Mật khẩu được cung cấp ở trên.",
      "Trải nghiệm full tính năng gói Max: Tự động xóa phông nền AI siêu nét chuẩn từng sợi tóc, tạo nền studio sản phẩm chuyên nghiệp cho Shopee, TikTok Shop, Lazada.",
      "Xuất ảnh chất lượng cao 4K không dính watermark (logo).",
    ],
    note: "Bảo hành Full 7 ngày 1 đổi 1 nếu phát sinh lỗi trong quá trình sử dụng.",
  },

  // ==========================================
  // 9. CÁC GÓI ADOBE CREATIVE CLOUD ALL APPS
  // ==========================================`;

const resolveTarget = `  // 2.10 Adobe
  if (cleanSlug.includes("adobe") || cleanTitle.includes("adobe")) {
    return PRODUCT_GUIDES["adobe-full-apps-1-thang"];
  }`;

const resolveNew = `  // 2.10 Adobe
  if (cleanSlug.includes("adobe") || cleanTitle.includes("adobe")) {
    return PRODUCT_GUIDES["adobe-full-apps-1-thang"];
  }

  // 2.11 Xingtu
  if (cleanSlug.includes("xingtu") || cleanTitle.includes("xingtu") || cleanTitle.includes("tinh tu")) {
    return PRODUCT_GUIDES["xingtu-vip-30-ngay"];
  }

  // 2.12 Quizlet
  if (cleanSlug.includes("quizlet") || cleanTitle.includes("quizlet")) {
    return PRODUCT_GUIDES["quizlet-plus-1-thang"];
  }

  // 2.13 Photoroom
  if (cleanSlug.includes("photoroom") || cleanTitle.includes("photoroom")) {
    return PRODUCT_GUIDES["photoroom-max-7-ngay"];
  }`;

// normalize CRLF
const normalized = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');
const normResolveTarget = resolveTarget.replace(/\r\n/g, '\n');

if (normalized.includes(normTarget) && normalized.includes(normResolveTarget)) {
  let updated = normalized.replace(normTarget, newGuides);
  updated = updated.replace(normResolveTarget, resolveNew);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('Successfully added Group 2 guides to product-guides.ts!');
} else {
  console.error('Target not found in product-guides.ts!');
}
