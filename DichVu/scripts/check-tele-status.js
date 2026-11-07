const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const tokenMatch = env.match(/TELEGRAM_ASSISTANT_BOT_TOKEN=([^\r\n]+)/);
const token = tokenMatch ? tokenMatch[1].trim().replace(/['"]/g, '') : '';

async function check() {
  const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const me = await meRes.json();
  console.log('getMe:', me);

  const hookRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const hook = await hookRes.json();
  console.log('getWebhookInfo:', hook);

  // Check recent updates
  const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-5`);
  const updates = await updatesRes.json();
  console.log('recent updates:', JSON.stringify(updates, null, 2));
}

check().catch(console.error);
