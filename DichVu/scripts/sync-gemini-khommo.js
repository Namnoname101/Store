const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== SYNCING GEMINI PRODUCTS DIRECTLY FROM TELEGRAM @KhoMMO_Market_bot ===");

  // Exact data crawled live from Telegram @KhoMMO_Market_bot:
  // 1. "Tài khoản Gemini Pro, 5TB, Argon, Neon 4, Opus 5.5 (Antigravity) Hạn 3 Tháng - BH 1 Tuần"
  //    Giá: 99.000 VND | Tồn kho: 11 tài khoản | Callback: a:pv:2qs
  // 2. "[Slot] Gemini Pro , GG 5TB Hạn 1 Năm, Bảo hành 3 tháng"
  //    Giá: 70.000 VND | Tồn kho: 397 tài khoản | Callback: a:pv:2dr

  const liveData = {
    account3M: {
      name: "Tài khoản Gemini Pro, 5TB, Argon, Neon 4, Opus 5.5 (Antigravity) Hạn 3 Tháng - BH 1 Tuần",
      telePrice: 99000,
      teleStock: 11,
      teleCallback: "a:pv:2qs",
      apiCode: "3556"
    },
    slot1Y: {
      name: "[Slot] Gemini Pro , GG 5TB Hạn 1 Năm, Bảo hành 3 tháng",
      telePrice: 70000,
      teleStock: 397,
      teleCallback: "a:pv:2dr",
      apiCode: "3087"
    }
  };

  // 1. Find supplier
  const supplier = await prisma.supplier.findFirst({
    where: { type: 'KHOMMO_API' }
  });
  if (!supplier) {
    throw new Error("KHOMMO_API supplier not found in DB!");
  }
  console.log(`Found KhoMMO supplier: ${supplier.name} (${supplier.id})`);

  // 2. Find category
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'ai-tool' },
        { slug: 'tai-khoan-ai' }
      ]
    }
  });
  if (!category) {
    throw new Error("Category ai-tool not found in DB!");
  }
  console.log(`Found category: ${category.name} (${category.id})`);

  // 3. Product 1: Slot Gemini Pro 5TB 1 Năm (Nâng Mail Chính Chủ)
  // Giá Telegram: 70.000 VND -> Giá bán niêm yết: 129.000 VND (Lời 59.000đ - Margin 84% bảo toàn lãi Shop > CTV)
  const slotDescription = `Gói nâng cấp bản quyền Google Gemini Pro & Google One 5TB thời hạn 1 năm trực tiếp vào tài khoản Gmail chính chủ của bạn (Dạng tham gia Family Google).

📋 ĐẶC QUYỀN GÓI PRO & GOOGLE ONE 5TB:
• Mở khóa mô hình AI tiên tiến: Gemini 4 Argon & Gemini 3.8 Flash trong Google Antigravity & AI Studio.
• Dung lượng lưu trữ: Tặng kèm 5.000GB (5TB) dung lượng Google One dùng chung cho Google Drive, Gmail, Google Photos.
• Bộ công cụ độc quyền: Mở khóa đầy đủ NotebookLM và 1.000 Credit tạo video Google Veo 3.
• Nâng mail chính chủ: Kích hoạt trực tiếp trên Gmail của bạn, không đổi tài khoản, bảo mật dữ liệu tuyệt đối.

🚀 QUY TRÌNH KÍCH HOẠT & NHẬN HÀNG:
• Hình thức: Sau khi thanh toán, hệ thống tự động cấp link kích hoạt tức thì 24/7.
• Thao tác: Quý khách chỉ cần mở link và nhập địa chỉ Gmail chính chủ cần nâng cấp.
• Thời gian hoàn thành: Đơn hàng hoàn tất và lời mời gia nhập Family gửi về hộp thư trong khoảng 15 - 60 phút.
• Chính sách bảo hành: Bảo hành 3 tháng 1 đổi 1 chu đáo trong suốt quá trình sử dụng.`;

  const accountDescription = `Tài khoản Google Gemini Pro bản quyền (Chủ Family) sở hữu 5TB lưu trữ Google One, kích hoạt sẵn mô hình Gemini 4 Argon và Gemini 3.8 Flash trong Google Antigravity & AI Studio.

📋 THÔNG TIN & ĐỊNH DẠNG BÀN GIAO:
• Định dạng cấp sẵn: Gmail | Pass | 2FA | MKP (Mật khẩu phụ / mail khôi phục)
• Vai trò tài khoản: Tài khoản của shop cấp. Là chủ Family có thể tùy chọn add thêm tối đa 5 người dùng chung 5TB dung lượng và các quyền lợi AI cao cấp.
• Khả năng tương thích AI: Sử dụng mượt mà Gemini 4 Argon, Gemini 3.8 Flash, Neon 4, Claude Opus 5.5, Sonnet 5.5, Hydrogen trong Google Antigravity & Google AI Studio.
• Đầy đủ đặc quyền: Trọn vẹn tính năng gói Gemini Pro & 5.000GB Google One.

⚠️ LƯU Ý KỸ THUẬT QUAN TRỌNG:
• Gmail bị hạn chế không đọc được thư bên ngoài. Tài khoản chuyên dụng đăng nhập và vận hành các dịch vụ Google (Gemini, Drive, AI Studio, Antigravity, NotebookLM). Khuyến cáo không dùng để nhận mã OTP dịch vụ ngoài.
• Chính sách bảo hành: Bảo hành 1 Tuần (7 ngày) 1 đổi 1 chu đáo nếu phát sinh lỗi đăng nhập hoặc mất quyền lợi gói Pro.`;

  const product1 = await prisma.product.upsert({
    where: { slug: 'gemini-pro-5tb-1-nam-slot-chinh-chu' },
    update: {
      title: 'Slot Gemini Pro & Google One 5TB Hạn 1 Năm (Nâng Mail Chính Chủ) - BH 3 Tháng',
      price: 129000,
      originalPrice: 320000,
      description: slotDescription,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-pro.svg',
      isActive: true,
    },
    create: {
      title: 'Slot Gemini Pro & Google One 5TB Hạn 1 Năm (Nâng Mail Chính Chủ) - BH 3 Tháng',
      slug: 'gemini-pro-5tb-1-nam-slot-chinh-chu',
      price: 129000,
      originalPrice: 320000,
      description: slotDescription,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-pro.svg',
      isActive: true,
    }
  });
  console.log(`Upserted Product 1: ${product1.title}`);

  await prisma.supplierProductMapping.upsert({
    where: { productId: product1.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: liveData.slot1Y.apiCode,
      supplierPrice: liveData.slot1Y.telePrice,
      supplierStock: liveData.slot1Y.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 59000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.slot1Y.teleCallback,
        source: "@KhoMMO_Market_bot",
        alternativeSuppliers: [
          { supplierCode: 'DKEY_API', supplierProductCode: '6ae8666b5edeecad99c77919', supplierPrice: 80000 }
        ]
      })
    },
    create: {
      productId: product1.id,
      supplierId: supplier.id,
      supplierProductCode: liveData.slot1Y.apiCode,
      supplierPrice: liveData.slot1Y.telePrice,
      supplierStock: liveData.slot1Y.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 59000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.slot1Y.teleCallback,
        source: "@KhoMMO_Market_bot",
        alternativeSuppliers: [
          { supplierCode: 'DKEY_API', supplierProductCode: '6ae8666b5edeecad99c77919', supplierPrice: 80000 }
        ]
      })
    }
  });
  console.log(`✓ Mapped Slot 1Y -> Vốn Tele: ${liveData.slot1Y.telePrice}đ | Giá bán: 129.000đ | Lời: 59.000đ | Kho: ${liveData.slot1Y.teleStock}`);

  // 4. Product 2: Tài Khoản Gemini Pro 5TB Argon 4 (Chủ Family Mời 5 Gmail) 3 Tháng
  // Giá Telegram: 99.000 VND -> Giá bán niêm yết: 169.000 VND (Lời 70.000đ - Margin 71% bảo toàn lãi Shop > CTV)
  const product2 = await prisma.product.upsert({
    where: { slug: 'tai-khoan-gemini-pro-argon-4-chu-family-3-thang' },
    update: {
      title: 'Tài Khoản Gemini Pro 5TB, Argon 4 (Chủ Family Mời 5 Gmail) 3 Tháng - BH 1 Tuần',
      price: 169000,
      originalPrice: 390000,
      description: accountDescription,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-argon-family.svg',
      isActive: true,
    },
    create: {
      title: 'Tài Khoản Gemini Pro 5TB, Argon 4 (Chủ Family Mời 5 Gmail) 3 Tháng - BH 1 Tuần',
      slug: 'tai-khoan-gemini-pro-argon-4-chu-family-3-thang',
      price: 169000,
      originalPrice: 390000,
      description: accountDescription,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      thumbnailUrl: '/images/products/gemini-argon-family.svg',
      isActive: true,
    }
  });
  console.log(`Upserted Product 2: ${product2.title}`);

  await prisma.supplierProductMapping.upsert({
    where: { productId: product2.id },
    update: {
      supplierId: supplier.id,
      supplierProductCode: liveData.account3M.apiCode,
      supplierPrice: liveData.account3M.telePrice,
      supplierStock: liveData.account3M.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 70000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.account3M.teleCallback,
        source: "@KhoMMO_Market_bot"
      })
    },
    create: {
      productId: product2.id,
      supplierId: supplier.id,
      supplierProductCode: liveData.account3M.apiCode,
      supplierPrice: liveData.account3M.telePrice,
      supplierStock: liveData.account3M.teleStock,
      markupType: 'FIXED_AMOUNT',
      markupValue: 70000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        teleCallback: liveData.account3M.teleCallback,
        source: "@KhoMMO_Market_bot"
      })
    }
  });
  console.log(`✓ Mapped Account 3M -> Vốn Tele: ${liveData.account3M.telePrice}đ | Giá bán: 169.000đ | Lời: 70.000đ | Kho: ${liveData.account3M.teleStock}`);

  console.log("=== SYNC COMPLETED SUCCESSFULLY ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
