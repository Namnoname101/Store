const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning and normalizing product descriptions & warranties...');

  // 1. Clean conflicting wholesale prices from API descriptions
  const apiProducts = await prisma.product.findMany({
    where: {
      category: { slug: 'ai-api' }
    }
  });

  let apiCleanedCount = 0;
  for (const prod of apiProducts) {
    if (prod.description && prod.description.includes('VNĐ =')) {
      const creditMatch = prod.description.match(/(\d+)\s*\$\s*Credit/i);
      const creditAmount = creditMatch ? creditMatch[1] : null;
      
      let newDesc = prod.description;
      if (creditAmount) {
        newDesc = `Hạn mức: ${creditAmount}$ Credit chính hãng. Tự động cấp key tức thì sau khi thanh toán. Sử dụng trực tiếp trên các công cụ, SDK và ứng dụng hỗ trợ API.`;
      } else {
        newDesc = prod.description.replace(/^\s*[\d\.\,]+\s*VNĐ\s*=\s*/i, 'Hạn mức: ');
      }

      await prisma.product.update({
        where: { id: prod.id },
        data: { description: newDesc }
      });
      apiCleanedCount++;
    }
  }
  console.log(`Cleaned ${apiCleanedCount} API product descriptions.`);

  // 2. Normalize Gemini Pro 18 Tháng description
  const geminiPro = await prisma.product.findFirst({
    where: { slug: 'gemini-advanced-18-thang' }
  });
  if (geminiPro) {
    const geminiDesc = `**GOOGLE ONE AI PRO 18 THÁNG – DUNG LƯỢNG 5TB**

Gói nâng cấp Google One AI Pro với thời hạn sử dụng 18 tháng, kích hoạt trực tiếp vào email chính chủ của bạn. Cung cấp toàn bộ hệ sinh thái công cụ AI cao cấp từ Google.

**Quyền lợi nổi bật:**
- **Gemini Advanced:** Mô hình Gemini 1.5 Pro mạnh mẽ nhất, xử lý ngữ cảnh cực dài lên tới 1 triệu tokens.
- **Google Flow (Veo) & Nano Banana:** Tạo video và sáng tạo hình ảnh bằng AI chất lượng cao.
- **NotebookLM:** Phân tích tài liệu PDF, tóm tắt và nghiên cứu chuyên sâu.
- **Google One 5TB Storage:** Không gian lưu trữ đám mây cho Google Drive, Gmail và Google Photos.
- **Gemini trong Google Workspace:** Trợ lý viết email, soạn thảo văn bản Docs và phân tích Sheets.

**Chính sách bàn giao & Bảo hành minh bạch:**
- **Hình thức nhận hàng:** Đường link kích hoạt chính chủ kèm hướng dẫn thao tác chi tiết.
- **Thời hạn sử dụng gói:** 18 tháng kể từ ngày kích hoạt thành công.
- **Bảo hành kích hoạt:** Bảo hành 1 đổi 1 trong vòng 24 giờ kể từ khi xuất link nếu phát sinh lỗi đường dẫn.
- **Hỗ trợ kỹ thuật:** Hỗ trợ giải đáp và hướng dẫn thao tác 24/7 qua Zalo & Telegram.`;

    await prisma.product.update({
      where: { id: geminiPro.id },
      data: { description: geminiDesc }
    });
    console.log('Updated Gemini Pro 18 Thang description.');
  }

  // 3. Normalize Duolingo Super 12 Tháng description
  const duolingo = await prisma.product.findFirst({
    where: { slug: 'duolingo-super-12-thang' }
  });
  if (duolingo) {
    const duoDesc = `**TÀI KHOẢN DUOLINGO SUPER 12 THÁNG – HỌC NGOẠI NGỮ KHÔNG GIỚI HẠN**

Nâng cấp gói Duolingo Super 1 năm bản quyền học ngoại ngữ thả ga, không giới hạn trái tim, không bị gián đoạn bởi quảng cáo.

**Quyền lợi gói Duolingo Super:**
- Trái tim vô hạn: Làm bài tập không lo hết tim, sửa bài tập thoải mái.
- Không có quảng cáo: Học tập trung, liền mạch và tiết kiệm thời gian.
- Luyện phát âm & Ngữ pháp nâng cao với AI của Duolingo.
- Hỗ trợ kiểm tra cấp độ và theo dõi tiến độ chi tiết.

**Hướng dẫn kích hoạt 3 bước đơn giản:**
- **Bước 1:** Đăng nhập vào tài khoản Duolingo của bạn tại duolingo.com trên trình duyệt.
- **Bước 2:** Bật ứng dụng VPN chuyển vùng sang Ấn Độ (hướng dẫn tải VPN miễn phí được gửi kèm sau thanh toán).
- **Bước 3:** Mở đường link nhận được và bấm "Xác nhận đổi gói" để hoàn tất.

**Chính sách bảo hành:**
- Link kích hoạt được hệ thống tự động kiểm tra trước khi gửi tới bạn.
- Bảo hành 1 đổi 1 trong 24 giờ nếu có sự cố về đường link.
- Hỗ trợ kỹ thuật viên đồng hành 24/7 qua Zalo & Telegram.`;

    await prisma.product.update({
      where: { id: duolingo.id },
      data: { description: duoDesc }
    });
    console.log('Updated Duolingo Super description.');
  }

  // 4. Normalize CapCut Pro description
  const capcut = await prisma.product.findFirst({
    where: { slug: 'capcut-pro-30-ngay' }
  });
  if (capcut) {
    const capcutDesc = `**TÀI KHOẢN CAPCUT PRO 30 NGÀY BẢN QUYỀN FULL DATE**

Mở khóa toàn bộ kho tài nguyên, hiệu ứng, bộ lọc cao cấp và công cụ AI của CapCut trên Máy tính (PC/Mac) và Điện thoại (iOS/Android).

**Tính năng Pro nổi bật:**
- Sử dụng không giới hạn hàng nghìn mẫu hiệu ứng video, chuyển cảnh và text animation Pro.
- Xuất video độ phân giải 4K 60fps cực nét, không logo watermark.
- Xóa phông nền thông minh bằng AI, tự động tạo phụ đề tiếng Việt chuẩn xác.
- Khử tiếng ồn âm thanh bằng AI và nâng cao chất lượng giọng nói.

**Chính sách bàn giao & Bảo hành:**
- **Hình thức nhận hàng:** Thông tin tài khoản đăng nhập (Email | Mật khẩu) cấp phát tự động tức thì.
- **Thời hạn sử dụng:** 30 ngày đầy đủ (Full date).
- **Bảo hành:** Bảo hành 1 đổi 1 trong suốt 30 ngày sử dụng nếu xảy ra sự cố.`;

    await prisma.product.update({
      where: { id: capcut.id },
      data: { description: capcutDesc }
    });
    console.log('Updated CapCut Pro description.');
  }

  // 5. Normalize Canva Pro description
  const canva = await prisma.product.findFirst({
    where: { slug: 'canva-pro-1-thang' }
  });
  if (canva) {
    const canvaDesc = `**NÂNG CẤP CANVA PRO 1 THÁNG CHÍNH CHỦ**

Nâng cấp trực tiếp tài khoản Canva cá nhân của bạn lên gói Canva Pro bản quyền đầy đủ tính năng thiết kế đồ họa cao cấp.

**Quyền lợi Canva Pro:**
- Truy cập không giới hạn hơn 100+ triệu hình ảnh, video, âm thanh và mẫu thiết kế cao cấp.
- Công cụ AI Magic Studio: Xóa vật thể, xóa phông nền 1 chạm, mở rộng ảnh thông minh.
- Đổi kích cỡ thiết kế nhanh chóng theo tỷ lệ Facebook, TikTok, Instagram, YouTube.
- Bộ nhận diện thương hiệu: Lưu font chữ, bảng màu và logo thương hiệu.

**Chính sách bàn giao & Bảo hành:**
- **Hình thức nhận hàng:** Link mời tham gia nhóm Canva Pro kích hoạt vào email cá nhân.
- **Thời hạn sử dụng:** 30 ngày đầy đủ.
- **Bảo hành:** Bảo hành 1 đổi 1 trong suốt thời hạn sử dụng.`;

    await prisma.product.update({
      where: { id: canva.id },
      data: { description: canvaDesc }
    });
    console.log('Updated Canva Pro description.');
  }

  // 6. Normalize Office 365 description
  const office = await prisma.product.findFirst({
    where: { slug: 'office-365-1-nam' }
  });
  if (office) {
    const officeDesc = `**TÀI KHOẢN MICROSOFT OFFICE 365 PLUS 1 NĂM RIÊNG TƯ**

Tài khoản Microsoft 365 bản quyền chính hãng sử dụng trọn bộ ứng dụng văn phòng Word, Excel, PowerPoint, Outlook bản mới nhất và dung lượng lưu trữ đám mây OneDrive 1TB.

**Quyền lợi nổi bật:**
- Cài đặt và kích hoạt bản quyền trực tiếp trên 5 thiết bị (Windows, Mac, iPad, iPhone, Android).
- Luôn được cập nhật các tính năng và bản vá bảo mật mới nhất từ Microsoft.
- Dung lượng lưu trữ OneDrive 1TB tốc độ cao, đồng bộ dữ liệu an toàn.
- Tài khoản cấp riêng tư 100%, có thể đổi mật khẩu cá nhân ngay sau khi nhận.

**Chính sách bàn giao & Bảo hành:**
- **Hình thức nhận hàng:** Tài khoản đăng nhập (Email | Mật khẩu khởi tạo) tự động cấp tức thì.
- **Thời hạn sử dụng:** 12 tháng (1 năm).
- **Bảo hành:** Bảo hành 1 đổi 1 trong suốt 12 tháng sử dụng.`;

    await prisma.product.update({
      where: { id: office.id },
      data: { description: officeDesc }
    });
    console.log('Updated Office 365 description.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
