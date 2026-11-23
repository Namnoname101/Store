const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== THÊM & CẬP NHẬT DỊCH VỤ YOUTUBE PREMIUM CHÍNH CHỦ ===");

  // Find or create 'giai-tri' category
  let category = await prisma.category.findUnique({
    where: { slug: 'giai-tri' },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Giải Trí & Phim Ảnh',
        slug: 'giai-tri',
        description: 'Tài khoản Netflix, Spotify, YouTube Premium chất lượng cao',
      },
    });
    console.log("Created category: Giải Trí & Phim Ảnh");
  }

  const desc1Year = `Gói gia hạn YouTube Premium thời hạn 1 Năm (12 Tháng) kích hoạt trực tiếp trên địa chỉ Gmail chính chủ của bạn thông qua lời mời nhóm Google Family.

✨ ĐẶC QUYỀN VƯỢT TRỘI CỦA YOUTUBE PREMIUM:
• Xem video 100% không quảng cáo: Loại bỏ hoàn toàn mọi quảng cáo phiền toái trên YouTube, giúp xem video mượt mà và liền mạch nhất.
• Chạy nền khi tắt màn hình: Vừa nghe video, nghe podcast vừa lướt ứng dụng khác hoặc tắt màn hình điện thoại mà âm thanh vẫn phát bình thường.
• Tải video xem ngoại tuyến (Offline): Tải các video và danh sách phát yêu thích về thiết bị để xem mọi lúc mọi nơi kể cả khi không có mạng internet.
• Trọn gói YouTube Music Premium: Tận hưởng kho nhạc bản quyền khổng lồ hàng triệu bài hát chất lượng cao nhất (256kbps), chuyển đổi mượt mà giữa video và âm thanh.
• Hỗ trợ đa nền tảng: Xem mượt mà trên iPhone, iPad, Android, máy tính (Mac/Windows), và Smart TV (Samsung, LG, Sony, Android TV...).

🔒 BẢO MẬT & AN TÂM TUYỆT ĐỐI:
• Shop KHÔNG yêu cầu mật khẩu Gmail hay bất kỳ thông tin riêng tư nào.
• Bạn chỉ cần cung cấp địa chỉ Gmail chính chủ của bạn để Admin gửi thư mời vào nhóm gia đình Google.
• Sau khi thanh toán, Admin gửi lời mời. Bạn chỉ cần mở hộp thư Gmail bấm "Chấp nhận lời mời" (Accept Invitation) là kích hoạt thành công ngay lập tức!

🛡️ CHÍNH SÁCH BẢO HÀNH & CAM KẾT:
• Cam kết bảo hành 1-đổi-1 trọn vẹn suốt 12 tháng sử dụng.
• Nếu nhóm gia đình gặp bất kỳ trục trặc kỹ thuật nào, shop hỗ trợ add lại nhóm mới hoặc hoàn tiền theo tỷ lệ thời gian còn lại nhanh chóng trong 15-30 phút.
• Lưu ý: Trong vòng 12 tháng qua, Gmail của quý khách chưa chuyển đổi nhóm gia đình Google quá 1 lần (theo quy định chung của Google).`;

  const desc6Months = `Gói gia hạn YouTube Premium thời hạn 6 Tháng kích hoạt trực tiếp trên địa chỉ Gmail chính chủ của bạn thông qua lời mời nhóm Google Family.

✨ ĐẶC QUYỀN VƯỢT TRỘI CỦA YOUTUBE PREMIUM:
• Xem video 100% không quảng cáo: Loại bỏ hoàn toàn mọi quảng cáo phiền toái trên YouTube, giúp xem video mượt mà và liền mạch nhất.
• Chạy nền khi tắt màn hình: Vừa nghe video, nghe podcast vừa lướt ứng dụng khác hoặc tắt màn hình điện thoại mà âm thanh vẫn phát bình thường.
• Tải video xem ngoại tuyến (Offline): Tải các video và danh sách phát yêu thích về thiết bị để xem mọi lúc mọi nơi kể cả khi không có mạng internet.
• Trọn gói YouTube Music Premium: Tận hưởng kho nhạc bản quyền khổng lồ hàng triệu bài hát chất lượng cao nhất (256kbps), chuyển đổi mượt mà giữa video và âm thanh.
• Hỗ trợ đa nền tảng: Xem mượt mà trên iPhone, iPad, Android, máy tính (Mac/Windows), và Smart TV (Samsung, LG, Sony, Android TV...).

🔒 BẢO MẬT & AN TÂM TUYỆT ĐỐI:
• Shop KHÔNG yêu cầu mật khẩu Gmail hay bất kỳ thông tin riêng tư nào.
• Bạn chỉ cần cung cấp địa chỉ Gmail chính chủ của bạn để Admin gửi thư mời vào nhóm gia đình Google.
• Sau khi thanh toán, Admin gửi lời mời. Bạn chỉ cần mở hộp thư Gmail bấm "Chấp nhận lời mời" (Accept Invitation) là kích hoạt thành công ngay lập tức!

🛡️ CHÍNH SÁCH BẢO HÀNH & CAM KẾT:
• Cam kết bảo hành 1-đổi-1 trọn vẹn suốt 6 tháng sử dụng.
• Nếu nhóm gia đình gặp bất kỳ trục trặc kỹ thuật nào, shop hỗ trợ add lại nhóm mới hoặc hoàn tiền theo tỷ lệ thời gian còn lại nhanh chóng trong 15-30 phút.
• Lưu ý: Trong vòng 12 tháng qua, Gmail của quý khách chưa chuyển đổi nhóm gia đình Google quá 1 lần (theo quy định chung của Google).`;

  // 1. Gói 1 Năm
  const p1Year = await prisma.product.upsert({
    where: { slug: 'youtube-premium-1-nam' },
    update: {
      title: 'Gói Gia Hạn YouTube Premium 1 Năm (Email Chính Chủ)',
      price: 280000,
      originalPrice: 390000,
      description: desc1Year,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/brands/youtube.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    },
    create: {
      title: 'Gói Gia Hạn YouTube Premium 1 Năm (Email Chính Chủ)',
      slug: 'youtube-premium-1-nam',
      price: 280000,
      originalPrice: 390000,
      description: desc1Year,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/brands/youtube.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    },
  });

  console.log("✅ Upserted YouTube Premium 1 Năm:", {
    id: p1Year.id,
    title: p1Year.title,
    slug: p1Year.slug,
    price: p1Year.price,
    isActive: p1Year.isActive,
  });

  // 2. Gói 6 Tháng
  const p6Months = await prisma.product.upsert({
    where: { slug: 'youtube-premium-6-thang' },
    update: {
      title: 'Gói Gia Hạn YouTube Premium 6 Tháng (Email Chính Chủ)',
      price: 159000,
      originalPrice: 220000,
      description: desc6Months,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/brands/youtube.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    },
    create: {
      title: 'Gói Gia Hạn YouTube Premium 6 Tháng (Email Chính Chủ)',
      slug: 'youtube-premium-6-thang',
      price: 159000,
      originalPrice: 220000,
      description: desc6Months,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/brands/youtube.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    },
  });

  console.log("✅ Upserted YouTube Premium 6 Tháng:", {
    id: p6Months.id,
    title: p6Months.title,
    slug: p6Months.slug,
    price: p6Months.price,
    isActive: p6Months.isActive,
  });
}

main()
  .catch((e) => {
    console.error("Error seeding YouTube Premium:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
