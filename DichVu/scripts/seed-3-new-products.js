const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- START SEEDING 3 NEW HOT PRODUCTS ---');

  // 1. Get suppliers
  const khommo = await prisma.supplier.findFirst({
    where: { type: 'KHOMMO_API' }
  });
  if (!khommo) throw new Error('Kho MMO supplier not found!');

  const hxn = await prisma.supplier.findFirst({
    where: { name: { contains: 'HXN' }, type: 'CANBOSO_BUYER' }
  });
  if (!hxn) throw new Error('Shop HXN supplier not found!');

  // 2. Get categories
  const softwareCategory = await prisma.category.findFirst({
    where: { slug: 'software' }
  });
  const aiCategory = await prisma.category.findFirst({
    where: { slug: 'ai-cong-nghe' }
  });

  const catSoftwareId = softwareCategory ? softwareCategory.id : (await prisma.category.findFirst()).id;
  const catAiId = aiCategory ? aiCategory.id : (await prisma.category.findFirst()).id;

  // ----------------------------------------------------
  // PRODUCT 1: Key HMA VPN Bản Quyền 1 Tháng (5 Thiết Bị)
  // ----------------------------------------------------
  const hmaDesc = `🛡️ **Key HMA VPN Bản Quyền 1 Tháng (5 Thiết Bị - Đổi IP Siêu Tốc)**
• **Định dạng bàn giao (Giao ngay 100%):** \`License Key Bản Quyền\`.
• HMA VPN (HideMyAss) là mạng riêng ảo sở hữu hạ tầng máy chủ lớn nhất hành tinh, có mặt tại hơn **190+ quốc gia và 290+ địa điểm**.
• Sử dụng đồng thời trên **5 thiết bị** (Windows, macOS, Android, Linux).
• Tốc độ kết nối cực nhanh **20 Gbps**, không bóp băng thông, hỗ trợ đổi IP ngẫu nhiên định kỳ tự động (IP Shuffle) rất thích hợp cho dân MMO, seeding, cày game, làm khảo sát và duyệt web bảo mật.

📌 **Hướng dẫn kích hoạt:**
1. Tải ứng dụng chính thức tại: \`https://www.hidemyass.com/installation-files\`
2. Mở app HMA > Vào Cài đặt / Tài khoản > Chọn **"Enter License Key"**.
3. Dán mã Key được bàn giao vào ô kích hoạt và bấm **Activate**.

🛡️ **Chính sách bảo hành:**
• **Bảo hành 1 ĐỔI 1:** Bảo hành trong suốt 30 ngày sử dụng nếu Key phát sinh lỗi không kích hoạt được.
• Mã Key sử dụng cho tối đa 5 thiết bị đồng thời theo đúng quy định của nhà sản xuất.`;

  const hmaProduct = await prisma.product.upsert({
    where: { slug: 'key-hma-vpn-1-thang' },
    update: {
      title: 'Key HMA VPN Bản Quyền 1 Tháng (5 Thiết Bị)',
      description: hmaDesc,
      price: 29000,
      originalPrice: 79000,
      type: 'LICENSE_KEY',
      thumbnailUrl: '/images/products/hma-vpn.svg',
      isActive: true,
      categoryId: catSoftwareId,
      fulfillmentType: 'API_DROPSHIP',
      minQuantity: 1
    },
    create: {
      title: 'Key HMA VPN Bản Quyền 1 Tháng (5 Thiết Bị)',
      slug: 'key-hma-vpn-1-thang',
      description: hmaDesc,
      price: 29000,
      originalPrice: 79000,
      type: 'LICENSE_KEY',
      thumbnailUrl: '/images/products/hma-vpn.svg',
      isActive: true,
      categoryId: catSoftwareId,
      fulfillmentType: 'API_DROPSHIP',
      minQuantity: 1
    }
  });

  await prisma.supplierProductMapping.upsert({
    where: {
      productId: hmaProduct.id
    },
    update: {
      supplierId: khommo.id,
      supplierProductCode: '1636',
      supplierPrice: 5320,
      supplierStock: 690,
      markupType: 'FIXED_AMOUNT',
      markupValue: 23680,
      isAutoSync: true
    },
    create: {
      productId: hmaProduct.id,
      supplierId: khommo.id,
      supplierProductCode: '1636',
      supplierPrice: 5320,
      supplierStock: 690,
      markupType: 'FIXED_AMOUNT',
      markupValue: 23680,
      isAutoSync: true
    }
  });
  console.log(`✓ Product 1: Key HMA VPN seeded (ID: ${hmaProduct.id})`);

  // ----------------------------------------------------
  // PRODUCT 2: Adobe Express Premium 12 Tháng
  // ----------------------------------------------------
  const adobeDesc = `🎨 **Adobe Express Premium Bản Quyền 12 Tháng (Chính Chủ)**
• **Định dạng bàn giao (Giao ngay 100%):** \`Redeem Link / Code Kích Hoạt Chính Chủ\`.
• Nâng cấp chính chủ tài khoản Adobe cá nhân, không cần thẻ tín dụng, sử dụng trọn vẹn **12 tháng**.
• Đầy đủ tính năng cao cấp của Adobe Express:
  - Tích hợp công nghệ trí tuệ nhân tạo **Adobe Firefly AI** tạo ảnh, mở rộng ảnh, đổi chi tiết từ văn bản.
  - Xóa phông hình ảnh & video chỉ với 1 click đạt chuẩn sắc nét 4K.
  - Truy cập kho tài nguyên khổng lồ: Hơn **200 triệu hình ảnh stock Adobe**, 20.000+ phông chữ bản quyền Adobe Fonts, hàng nghìn template thiết kế chuyên nghiệp.
• Sử dụng đa nền tảng: Trình duyệt Web máy tính, điện thoại iOS và Android.

📌 **Hướng dẫn kích hoạt:**
1. Truy cập \`https://new.express.adobe.com/\` và đăng nhập tài khoản Adobe của bạn.
2. Mở liên kết kích hoạt được cung cấp sau khi thanh toán để nhận ngay 12 tháng Premium.
3. *Lưu ý:* Nếu gặp thông báo hạn chế quốc gia khi nhận, chỉ cần bật VPN sang Ấn Độ (India) và bấm nhận ưu đãi. Sau khi kích hoạt thành công, tắt VPN và sử dụng bình thường tại Việt Nam.

🛡️ **Chính sách bảo hành:**
• **Bảo hành kích hoạt 1 ĐỔI 1:** Đảm bảo kích hoạt thành công trọn vẹn gói 12 tháng Premium vào tài khoản Adobe của bạn.`;

  const adobeProduct = await prisma.product.upsert({
    where: { slug: 'adobe-express-12-thang' },
    update: {
      title: 'Adobe Express Premium Bản Quyền 12 Tháng (Chính Chủ)',
      description: adobeDesc,
      price: 89000,
      originalPrice: 199000,
      type: 'ACCOUNT',
      thumbnailUrl: '/images/products/adobe-express.svg',
      isActive: true,
      categoryId: catSoftwareId,
      fulfillmentType: 'API_DROPSHIP',
      minQuantity: 1
    },
    create: {
      title: 'Adobe Express Premium Bản Quyền 12 Tháng (Chính Chủ)',
      slug: 'adobe-express-12-thang',
      description: adobeDesc,
      price: 89000,
      originalPrice: 199000,
      type: 'ACCOUNT',
      thumbnailUrl: '/images/products/adobe-express.svg',
      isActive: true,
      categoryId: catSoftwareId,
      fulfillmentType: 'API_DROPSHIP',
      minQuantity: 1
    }
  });

  await prisma.supplierProductMapping.upsert({
    where: {
      productId: adobeProduct.id
    },
    update: {
      supplierId: khommo.id,
      supplierProductCode: '2789',
      supplierPrice: 33250,
      supplierStock: 4149,
      markupType: 'FIXED_AMOUNT',
      markupValue: 55750,
      isAutoSync: true
    },
    create: {
      productId: adobeProduct.id,
      supplierId: khommo.id,
      supplierProductCode: '2789',
      supplierPrice: 33250,
      supplierStock: 4149,
      markupType: 'FIXED_AMOUNT',
      markupValue: 55750,
      isAutoSync: true
    }
  });
  console.log(`✓ Product 2: Adobe Express seeded (ID: ${adobeProduct.id})`);

  // ----------------------------------------------------
  // PRODUCT 3: Tài Khoản Suno AI Pro 1 Tháng (2.500 Credits Tạo Nhạc)
  // ----------------------------------------------------
  const sunoDesc = `🎵 **Tài Khoản Suno AI Pro 1 Tháng (2.500 Credits Tạo Nhạc Chuyên Nghiệp)**
• **Định dạng bàn giao (Giao ngay 100%):** \`Email | Mật khẩu | Mail khôi phục\`.
• Nền tảng tạo nhạc bằng trí tuệ nhân tạo số 1 thế giới: Biến bất kỳ ý tưởng, cảm xúc, lời thơ nào thành bài hát hoàn chỉnh (hát mộc, phối khí, ca sĩ AI đỉnh cao).
• **Quyền lợi gói Suno Pro:**
  - Nhận ngay **2.500 Credits** (tạo được tới ~500 bài hát chất lượng phòng thu).
  - **Quyền sở hữu thương mại (Commercial rights):** Bạn toàn quyền phát hành nhạc lên Spotify, YouTube Music, Apple Music, TikTok và kiếm tiền bản quyền hợp pháp.
  - Hàng đợi tạo nhạc ưu tiên cao (Priority generation queue), không phải chờ đợi.
  - Cho phép mở rộng bài hát lên tới 4 phút và tạo cùng lúc 10 bài hát song song.

📌 **Hướng dẫn đăng nhập:**
1. Truy cập \`https://suno.com\` và bấm nút **Sign In**.
2. Đăng nhập bằng Email và Mật khẩu được bàn giao.
3. Kiểm tra số dư 2.500 Credits ở góc dưới bên trái và bắt đầu sáng tác nhạc.

🛡️ **Chính sách bảo hành:**
• **Bảo hành đăng nhập & số dư:** Bảo hành 1 ĐỔI 1 ngay lập tức trong 24 giờ đầu kể từ khi nhận tài khoản (đảm bảo đúng mật khẩu và đủ 2.500 credits).
• Vui lòng không thay đổi email gốc của tài khoản để duy trì quyền lợi bảo hành.`;

  const sunoProduct = await prisma.product.upsert({
    where: { slug: 'suno-ai-pro-1-thang' },
    update: {
      title: 'Tài Khoản Suno AI Pro 1 Tháng (2.500 Credits Tạo Nhạc)',
      description: sunoDesc,
      price: 219000,
      originalPrice: 350000,
      type: 'ACCOUNT',
      thumbnailUrl: '/images/products/suno-ai.svg',
      isActive: true,
      categoryId: catAiId,
      fulfillmentType: 'API_DROPSHIP',
      minQuantity: 1
    },
    create: {
      title: 'Tài Khoản Suno AI Pro 1 Tháng (2.500 Credits Tạo Nhạc)',
      slug: 'suno-ai-pro-1-thang',
      description: sunoDesc,
      price: 219000,
      originalPrice: 350000,
      type: 'ACCOUNT',
      thumbnailUrl: '/images/products/suno-ai.svg',
      isActive: true,
      categoryId: catAiId,
      fulfillmentType: 'API_DROPSHIP',
      minQuantity: 1
    }
  });

  await prisma.supplierProductMapping.upsert({
    where: {
      productId: sunoProduct.id
    },
    update: {
      supplierId: hxn.id,
      supplierProductCode: '6af2c974fe16327c209e1818',
      supplierPrice: 150000,
      supplierStock: 13,
      markupType: 'FIXED_AMOUNT',
      markupValue: 69000,
      isAutoSync: true
    },
    create: {
      productId: sunoProduct.id,
      supplierId: hxn.id,
      supplierProductCode: '6af2c974fe16327c209e1818',
      supplierPrice: 150000,
      supplierStock: 13,
      markupType: 'FIXED_AMOUNT',
      markupValue: 69000,
      isAutoSync: true
    }
  });
  console.log(`✓ Product 3: Suno AI Pro seeded (ID: ${sunoProduct.id})`);

  console.log('--- ALL 3 PRODUCTS SUCCESSFULLY SEEDED & MAPPED! ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
