const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

async function main() {
  const credsPath = path.join(__dirname, "../tele-session.json");
  const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log("Connected to Telegram with persistent session!");

  const me = await client.getMe();
  console.log(`Logged in as: ${me.firstName} (${me.username || me.phone})`);

  const botUsername = "nghientrickshop_bot";
  console.log(`Sending /start to @${botUsername}...`);

  await client.sendMessage(botUsername, { message: "/start" });

  // Wait 3 seconds for bot reply
  await new Promise((r) => setTimeout(r, 3000));

  const messages = await client.getMessages(botUsername, { limit: 3 });
  console.log("--- RECENT MESSAGES FROM BOT ---");

  for (const m of messages) {
    console.log(`[ID ${m.id}] Text: ${m.text}`);
    if (m.replyMarkup) {
      console.log("ReplyMarkup Type:", m.replyMarkup.className);
      if (m.replyMarkup.rows) {
        console.log("Buttons:");
        for (const row of m.replyMarkup.rows) {
          const rowText = row.buttons.map((b) => `[${b.text}]`).join(" ");
          console.log("  Row:", rowText);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
