const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    include: { mappings: { include: { product: true } } },
  });

  console.log(`Found ${suppliers.length} active suppliers.`);

  let text = "🏢 <b>DANH SÁCH & SỐ DƯ NHÀ CUNG CẤP:</b>\n\n";
  for (const s of suppliers) {
    text += `🏢 <b>${s.name}</b> (<code>${s.code}</code>)\n`;
    text += `• Số dư ví: <b>${(s.currentBalance || 0).toLocaleString("vi-VN")}đ</b>\n`;
    text += `• Ngân hàng nạp: <b>${s.depositBankId || "MB"}</b> | STK: <code>${s.depositAccountNo || "0388888888"}</code>\n`;
    text += `• Chủ TK: <b>${s.depositAccountName || "Chưa cập nhật"}</b>\n`;
    text += `• Cú pháp: <code>${s.depositSyntax || "NAP"}</code>\n`;
    text += `• Sản phẩm: <b>${s.mappings.length}</b> sản phẩm\n\n`;
  }
  text += "👉 <i>Bấm nút bên dưới để tạo mã VietQR nạp tiền vào ví bot nguồn.</i>";
  console.log('Result text length:', text.length);
  console.log('Sample text:\n', text.substring(0, 500));
}

run().catch(console.error).finally(() => prisma.$disconnect());
