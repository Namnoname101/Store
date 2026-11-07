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
  // fetch 100 messages around yesterday night
  const msgs = await client.getMessages(bot, { limit: 60 });
  
  console.log("=== MESSAGES IN @shopxoainon_bot ===");
  for (const m of msgs.reverse()) {
    const d = new Date(m.date * 1000);
    const time = d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const dir = m.out ? "USER -> BOT" : "BOT -> USER";
    console.log(`[${time}] [${dir}] ID:${m.id}: ${m.message ? m.message.replace(/\n/g, " ") : "[media/button]"}`);
    if (m.replyMarkup && m.replyMarkup.rows) {
      const btns = m.replyMarkup.rows.map(r => r.buttons.map(b => `[${b.text}|${b.data ? b.data.toString() : b.url}]`).join(" ")).join(" | ");
      console.log(`   Btns: ${btns}`);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
