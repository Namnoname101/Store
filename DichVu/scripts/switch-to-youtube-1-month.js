const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== THIẾT LẬP DUY NHẤT GÓI YOUTUBE PREMIUM 1 THÁNG ===");

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

  const desc1Month = `Gói gia hạn YouTube Premium thời hạn 1 Tháng (30 Ngày) kích hoạt trực tiếp trên địa chỉ Gmail chính chủ của bạn thông qua lời mời nhóm Google Family.

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
• Cam kết bảo hành 1-đổi-1 trọn vẹn suốt 30 ngày (1 tháng) sử dụng.
• Nếu nhóm gia đình gặp bất kỳ trục trặc kỹ thuật nào, shop hỗ trợ add lại nhóm mới hoặc hoàn tiền theo tỷ lệ thời gian còn lại nhanh chóng trong 15-30 phút.
• Lưu ý: Trong vòng 12 tháng qua, Gmail của quý khách chưa chuyển đổi nhóm gia đình Google quá 1 lần (theo quy định chung của Google).`;

  // 1. Deactivate old 1-year and 6-month packages
  await prisma.product.updateMany({
    where: {
      slug: { in: ['youtube-premium-1-nam', 'youtube-premium-6-thang'] }
    },
    data: {
      isActive: false
    }
  });
  console.log("✅ Deactivated youtube-premium-1-nam and youtube-premium-6-thang");

  // 2. Upsert youtube-premium-1-thang
  const p1Month = await prisma.product.upsert({
    where: { slug: 'youtube-premium-1-thang' },
    update: {
      title: 'Gói Gia Hạn YouTube Premium 1 Tháng (Email Chính Chủ)',
      price: 29000,
      originalPrice: 79000,
      description: desc1Month,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/brands/youtube.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    },
    create: {
      title: 'Gói Gia Hạn YouTube Premium 1 Tháng (Email Chính Chủ)',
      slug: 'youtube-premium-1-thang',
      price: 29000,
      originalPrice: 79000,
      description: desc1Month,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/brands/youtube.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    },
  });

  console.log("✅ Upserted YouTube Premium 1 Tháng:", {
    id: p1Month.id,
    title: p1Month.title,
    slug: p1Month.slug,
    price: p1Month.price,
    isActive: p1Month.isActive,
  });

  // 3. Verify active YouTube products in DB
  const activeProds = await prisma.product.findMany({
    where: {
      slug: { contains: 'youtube' },
      isActive: true,
    },
    select: { id: true, title: true, slug: true, price: true, isActive: true }
  });
  console.log("\n📦 Active YouTube products on storefront:", activeProds);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
