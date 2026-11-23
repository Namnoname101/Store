const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDescription() {
  const cleanDesc = `Gói nâng cấp trực tiếp Google One 5TB & Gemini Pro 12 tháng vào tài khoản Gmail của bạn.

• Dung lượng lưu trữ: 5.000GB (5TB) tốc độ cao dùng chung Drive, Gmail, Photos.
• AI Frontier: Toàn quyền truy cập Gemini 4 Argon & Gemini 3.8 Flash (2M context).
• Tính năng Family: Tự tạo nhóm Google Family mời thêm tối đa 5 Gmail khác cùng dùng.
• Tiết kiệm tối đa: Gói KBH xả kho siêu rẻ 19.000đ/tài khoản. Khuyên dùng Gmail clone để nâng cấp rồi mời Gmail chính vào nhóm.`;

  await prisma.product.update({
    where: { slug: 'up-gemini-pro-5tb-12-thang-chinh-chu-kbh' },
    data: { description: cleanDesc }
  });

  console.log("Updated product description in DB to concise version!");
}

cleanDescription()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
