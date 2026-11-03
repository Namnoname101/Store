const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const creds = JSON.parse(fs.readFileSync("tele-session.json", "utf-8"));

async function main() {
  const client = new TelegramClient(new StringSession(creds.sessionString), creds.apiId, creds.apiHash, {});
  await client.connect();
  const bot = await client.getEntity("shopxoainon_bot");
  const msgs = await client.getMessages(bot, { limit: 12, offsetId: 30650 });
  for (const m of msgs.reverse()) {
    const time = new Date(m.date * 1000).toLocaleTimeString("vi-VN");
    console.log(`ID:${m.id} [${time}] [${m.out ? "USER" : "BOT"}]: ${m.message?.slice(0, 100)}`);
    if (m.replyMarkup && m.replyMarkup.rows) {
      for (const row of m.replyMarkup.rows) {
        console.log("  " + row.buttons.map(b => b.text + " -> " + (b.data?.toString("utf-8") || b.url)).join(" | "));
      }
    }
  }
}

main().finally(() => process.exit(0));
