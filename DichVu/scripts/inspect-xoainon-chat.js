const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  const bot = await client.getEntity("shopxoainon_bot");
  const msgs = await client.getMessages(bot, { limit: 20 });
  
  console.log("=== LAST 20 MESSAGES IN @shopxoainon_bot ===");
  for (const m of msgs.reverse()) {
    const time = new Date(m.date * 1000).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const dir = m.out ? "USER -> BOT" : "BOT -> USER";
    console.log(`[${time}] [${dir}] ID:${m.id}: ${m.message}`);
    if (m.replyMarkup && m.replyMarkup.rows) {
      console.log("  Buttons:");
      for (const row of m.replyMarkup.rows) {
        console.log(`    ${row.buttons.map(b => `[${b.text} | data:${b.data ? b.data.toString('utf-8') : b.url}]`).join(" ")}`);
      }
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
