const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const tokenMatch = env.match(/TELEGRAM_ASSISTANT_BOT_TOKEN=([^\r\n]+)/);
const token = tokenMatch ? tokenMatch[1].trim().replace(/['"]/g, '') : '';
const chatMatch = env.match(/TELEGRAM_ADMIN_CHAT_ID=([^\r\n]+)/);
const chatId = chatMatch ? chatMatch[1].trim().replace(/['"]/g, '') : '1853328773';

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSupplierIcon(name, code) {
  if (code.includes("XOAI") || name.includes("Xoài")) return "🥭";
  if (code.includes("KHOMMO") || name.includes("Kho MMO")) return "📦";
  if (code.includes("DSHOP") || name.includes("D-Shop") || name.includes("DShop")) return "🛍";
  if (code.includes("TOKI") || name.includes("Toki")) return "⚡";
  if (code.includes("DKEY") || name.includes("DKey")) return "🔑";
  if (code.includes("HXN") || name.includes("HXN")) return "✂️";
  if (code.includes("CHODAUMOI") || name.includes("Chợ Đầu Mối")) return "🏪";
  if (code.includes("HIHI") || name.includes("PQV")) return "🎁";
  if (code.includes("NGHIENTRICK") || name.includes("Nghiện")) return "𝔑";
  if (code.includes("GENZ") || name.includes("Genz")) return "⚡";
  return "🏢";
}

async function run() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    include: { mappings: { include: { product: true } } },
  });

  let text = "🏢 <b>DANH SÁCH & SỐ DƯ NHÀ CUNG CẤP:</b>\n\n";
  for (const s of suppliers) {
    text += `${getSupplierIcon(s.name, s.code)} <b>${escapeHtml(s.name)}</b> (<code>${escapeHtml(s.code)}</code>)\n`;
    text += `• Số dư ví: <b>${(s.currentBalance || 0).toLocaleString("vi-VN")}đ</b>\n`;
    text += `• Ngân hàng nạp: <b>${escapeHtml(s.depositBankId || "MB")}</b> | STK: <code>${escapeHtml(s.depositAccountNo || "0388888888")}</code>\n`;
    text += `• Chủ TK: <b>${escapeHtml(s.depositAccountName || "Chưa cập nhật")}</b>\n`;
    text += `• Cú pháp: <code>${escapeHtml(s.depositSyntax || "NAP " + chatId)}</code>\n`;
    text += `• Sản phẩm: <b>${s.mappings.length}</b> sản phẩm\n\n`;
  }
  text += "👉 <i>Bấm nút bên dưới để tạo mã VietQR nạp tiền vào ví bot nguồn.</i>";

  console.log('Sending escaped text to Telegram...');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💳 Nạp tiền NCC", callback_data: "cmd:topup_menu" },
            { text: "🔙 Về Menu", callback_data: "cmd:main_menu" },
          ],
        ],
      }
    })
  });
  const data = await res.json();
  console.log('Send result:', data);
}

run().catch(console.error).finally(() => prisma.$disconnect());
