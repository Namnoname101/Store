const { execSync } = require('child_process');

console.log('=== PROCESSES ON FLY ===');
try {
  console.log(execSync('ps aux', { encoding: 'utf8' }));
} catch (e) {
  console.error(e.message);
}

console.log('=== TELEGRAM ENV VARS ON FLY ===');
console.log('TELEGRAM_ASSISTANT_BOT_TOKEN:', process.env.TELEGRAM_ASSISTANT_BOT_TOKEN ? 'SET (length: ' + process.env.TELEGRAM_ASSISTANT_BOT_TOKEN.length + ')' : 'MISSING');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'SET (length: ' + process.env.TELEGRAM_BOT_TOKEN.length + ')' : 'MISSING');
console.log('TELEGRAM_ADMIN_CHAT_ID:', process.env.TELEGRAM_ADMIN_CHAT_ID ? process.env.TELEGRAM_ADMIN_CHAT_ID : 'MISSING');
console.log('ADMIN_TELEGRAM_BOT_TOKEN:', process.env.ADMIN_TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING');
console.log('ADMIN_TELEGRAM_CHAT_ID:', process.env.ADMIN_TELEGRAM_CHAT_ID ? process.env.ADMIN_TELEGRAM_CHAT_ID : 'MISSING');
console.log('TELEGRAM_USER_SESSION:', process.env.TELEGRAM_USER_SESSION ? 'SET' : 'MISSING');
