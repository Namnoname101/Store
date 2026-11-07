const fs = require('fs');
const path = require('path');

const daemonPath = path.resolve(__dirname, 'telegram-assistant-daemon.js');
let content = fs.readFileSync(daemonPath, 'utf8');

const target = `    text += \`• Ngân hàng nạp: <b>\${escapeHtml(s.depositBankId || "MB")}</b> | STK: <code>\${escapeHtml(s.depositAccountNo || "0388888888")}</code>\\n\`;
    text += \`• Chủ TK: <b>\${escapeHtml(s.depositAccountName || "Chưa cập nhật")}</b>\\n\`;
    text += \`• Cú pháp: <code>\${escapeHtml(s.depositSyntax || "NAP " + ADMIN_CHAT_ID)}</code>\\n\`;`;

const replacement = `    if (s.depositAccountNo && s.depositAccountNo !== "0388888888") {
      text += \`• Ngân hàng nạp: <b>\${escapeHtml(s.depositBankId || "MB")}</b> | STK: <code>\${escapeHtml(s.depositAccountNo)}</code>\\n\`;
      text += \`• Chủ TK: <b>\${escapeHtml(s.depositAccountName || s.name)}</b>\\n\`;
      text += \`• Cú pháp: <code>\${escapeHtml(s.depositSyntax || "NAP " + ADMIN_CHAT_ID)}</code>\\n\`;
    } else {
      text += \`• Nạp tiền: <i>\${s.type && s.type.includes("API") ? "Nạp qua cổng API hoặc Bot đối tác" : "Xem chi tiết tại web NCC"}</i>\\n\`;
    }`;

// normalize \r\n to \n for replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const newContent = normalizedContent.replace(normalizedTarget, replacement);
  fs.writeFileSync(daemonPath, newContent, 'utf8');
  console.log('Successfully patched telegram-assistant-daemon.js!');
} else {
  console.error('Target not found!');
}
