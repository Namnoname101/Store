const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

async function main() {
  const sessionString = process.env.TELEGRAM_USER_SESSION || "";
  const apiId = Number(process.env.TELEGRAM_API_ID || 30557242);
  const apiHash = process.env.TELEGRAM_API_HASH || "2ade2dd2c0c5a42e9d3e7b224dac9337";

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 3
  });

  await client.connect();
  console.log("Connected to Telegram MTProto!");

  const bot = "shopxoainon_bot";
  const messages = await client.getMessages(bot, { limit: 6 });

  console.log("--- RECENT MESSAGES FROM @shopxoainon_bot ---");
  for (const m of messages) {
    console.log(`[MSG ID ${m.id}] Text:\n${m.text}`);
    if (m.replyMarkup && m.replyMarkup.rows) {
      console.log("Buttons:");
      for (const row of m.replyMarkup.rows) {
        console.log("  " + row.buttons.map(b => `[${b.text}] -> ${b.data ? Buffer.from(b.data).toString("utf-8") : b.url}`).join(" | "));
      }
    }
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => process.exit(0));
