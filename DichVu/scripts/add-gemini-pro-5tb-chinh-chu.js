const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== THÊM DỊCH VỤ UP PRO 5TB 12 THÁNG CHÍNH CHỦ KBH ===");

  const category = await prisma.category.findFirst({
    where: {
      OR: [{ slug: 'ai-tool' }, { slug: 'tai-khoan-ai' }]
    }
  });

  if (!category) {
    throw new Error("Không tìm thấy category ai-tool trong cơ sở dữ liệu!");
  }

  const description = `Gói nâng cấp trực tiếp bản quyền Google Gemini Pro & Google One 5TB thời hạn 12 tháng (1 năm) vào tài khoản Gmail của bạn.

✨ ĐẶC QUYỀN GÓI PRO & 5TB GOOGLE ONE:
• Dung lượng lưu trữ khổng lồ: 5.000GB (5TB) dùng chung cho Google Drive, Gmail, Google Photos tốc độ cao nhất.
• Mở khóa mô hình AI Frontier: Toàn quyền sử dụng Gemini 4 Argon & Gemini 3.8 Flash (2M Context Tokens) trong Google Antigravity & AI Studio.
• Công cụ nâng cao: Mở khóa NotebookLM và đầy đủ các tiện ích trí tuệ nhân tạo của Google Workspace.
• Tính năng Family: Tài khoản nâng cấp có quyền tạo nhóm gia đình (Google Family) để mời thêm tối đa 5 Gmail khác cùng dùng chung kho 5TB.

💡 MẸO BẢO MẬT AN TÂM TUYỆT ĐỐI (KHUYÊN DÙNG):
• Quý khách có thể đưa một Gmail phụ (Gmail clone) để shop nâng cấp gói 5TB.
• Sau khi shop hoàn tất, bạn chỉ cần dùng tài khoản đó tạo nhóm Family và mời Gmail chính của mình vào nhóm để cùng hưởng trọn vẹn 5TB và Gemini Pro mà không cần đưa tài khoản chính!

🚀 QUY TRÌNH KÍCH HOẠT:
1. Quý khách nhập thông tin tài khoản (Gmail + Mật khẩu + Mã sao lưu nếu có) khi đặt đơn.
2. Quản trị viên tiếp nhận và tiến hành nâng cấp trực tiếp 5TB cho tài khoản.
3. Khi hoàn tất, web lập tức hiển thị giao diện bàn giao thành công kèm liên kết kiểm tra dung lượng 5TB.

⚠️ ĐIỀU KHOẢN GÓI KBH (KHÔNG BẢO HÀNH):
• Đây là gói dịch vụ ưu đãi xả kho siêu rẻ 19.000đ, không bảo hành trong quá trình sử dụng sau khi shop đã nâng cấp thành công và quý khách đã nghiệm thu.
• Không áp dụng mã giảm giá CTV cho gói này.
• Quý khách vui lòng đổi lại mật khẩu Gmail ngay sau khi shop bàn giao để đảm bảo quyền riêng tư tuyệt đối.`;

  const product = await prisma.product.upsert({
    where: { slug: 'up-gemini-pro-5tb-12-thang-chinh-chu-kbh' },
    update: {
      title: 'Nâng Cấp Gemini Pro & Google One 5TB 12 Tháng Chính Chủ (Gói KBH)',
      price: 19000,
      originalPrice: 99000,
      description: description,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/products/gemini-pro-5tb-chinh-chu.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    },
    create: {
      title: 'Nâng Cấp Gemini Pro & Google One 5TB 12 Tháng Chính Chủ (Gói KBH)',
      slug: 'up-gemini-pro-5tb-12-thang-chinh-chu-kbh',
      price: 19000,
      originalPrice: 99000,
      description: description,
      categoryId: category.id,
      type: 'ACCOUNT',
      fulfillmentType: 'LOCAL_STOCK',
      thumbnailUrl: '/images/products/gemini-pro-5tb-chinh-chu.svg',
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
    }
  });

  console.log("Upserted product successfully:", {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    isActive: product.isActive
  });
}

main()
  .catch((e) => {
    console.error("Error adding product:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
