const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/lib/product-guides.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const youtubeGuides = `  // ==========================================
  // YOUTUBE PREMIUM
  // ==========================================
  "youtube-premium-1-nam": {
    title: "Hướng dẫn kích hoạt YouTube Premium 1 Năm (Email Chính Chủ)",
    steps: [
      "Mở hộp thư Gmail của bạn (kiểm tra cả hộp thư chính, mục Quảng cáo và Thư rác).",
      "Tìm email từ Google Families hoặc YouTube với tiêu đề 'Lời mời tham gia nhóm gia đình' (Invitation to join family).",
      "Nhấp vào nút 'Chấp nhận lời mời' (Accept Invitation) trong email.",
      "Google sẽ chuyển sang màn hình xác nhận tham gia nhóm gia đình, bạn bấm Tiếp tục để hoàn tất.",
      "Mở YouTube hoặc app YouTube Music, kiểm tra logo YouTube đã chuyển thành Premium. Tận hưởng xem video không quảng cáo và nghe nhạc tắt màn hình!",
    ],
    note: "Bảo hành 1 đổi 1 suốt 12 tháng sử dụng. Quý khách lưu ý trong 12 tháng qua Gmail chưa đổi nhóm gia đình Google quá 1 lần.",
  },

  "youtube-premium-6-thang": {
    title: "Hướng dẫn kích hoạt YouTube Premium 6 Tháng (Email Chính Chủ)",
    steps: [
      "Mở hộp thư Gmail của bạn (kiểm tra cả hộp thư chính, mục Quảng cáo và Thư rác).",
      "Tìm email từ Google Families hoặc YouTube với tiêu đề 'Lời mời tham gia nhóm gia đình' (Invitation to join family).",
      "Nhấp vào nút 'Chấp nhận lời mời' (Accept Invitation) trong email.",
      "Google sẽ chuyển sang màn hình xác nhận tham gia nhóm gia đình, bạn bấm Tiếp tục để hoàn tất.",
      "Mở YouTube hoặc app YouTube Music, kiểm tra logo YouTube đã chuyển thành Premium. Tận hưởng xem video không quảng cáo và nghe nhạc tắt màn hình!",
    ],
    note: "Bảo hành 1 đổi 1 suốt 6 tháng sử dụng. Quý khách lưu ý trong 12 tháng qua Gmail chưa đổi nhóm gia đình Google quá 1 lần.",
  },
`;

if (!content.includes('"youtube-premium-1-nam":')) {
  content = content.replace(
    '  // ==========================================\r\n  // 10. XINGTU (TỈNH TÚ) VIP',
    `${youtubeGuides}\r\n  // ==========================================\r\n  // 10. XINGTU (TỈNH TÚ) VIP`
  );
  content = content.replace(
    '  // ==========================================\n  // 10. XINGTU (TỈNH TÚ) VIP',
    `${youtubeGuides}\n  // ==========================================\n  // 10. XINGTU (TỈNH TÚ) VIP`
  );
}

const youtubeResolver = `  // 2.14 YouTube
  if (cleanSlug.includes("youtube") || cleanTitle.includes("youtube")) {
    return PRODUCT_GUIDES["youtube-premium-1-nam"] || PRODUCT_GUIDES["youtube-premium-6-thang"];
  }
`;

if (!content.includes('// 2.14 YouTube')) {
  content = content.replace(
    '  // 2.13 Photoroom',
    `${youtubeResolver}\r\n  // 2.13 Photoroom`
  );
  content = content.replace(
    '  // 2.13 Photoroom',
    `${youtubeResolver}\n  // 2.13 Photoroom`
  );
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched product-guides.ts');
