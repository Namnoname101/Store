const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const tokenMatch = env.match(/TELEGRAM_ASSISTANT_BOT_TOKEN=([^\r\n]+)/);
const token = tokenMatch ? tokenMatch[1].trim().replace(/['"]/g, '') : '';
const chatMatch = env.match(/TELEGRAM_ADMIN_CHAT_ID=([^\r\n]+)/);
const chatId = chatMatch ? chatMatch[1].trim().replace(/['"]/g, '') : '1853328773';

async function send() {
  console.log('Sending test message to chatId:', chatId, 'with bot token prefix:', token.substring(0, 10));
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🤖 <b>Antigravity Test:</b> Bạn có nhận được tin nhắn này từ bot không?',
      parse_mode: 'HTML'
    })
  });
  const data = await res.json();
  console.log('Send result:', data);
}

send().catch(console.error);
