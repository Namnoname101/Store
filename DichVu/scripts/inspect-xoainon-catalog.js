const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function main() {
  const client = new TelegramClient(new StringSession(creds.session), creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram Userbot.");

  // Check Shop Xoai Non
  const botUsername = "shopxoainon_bot";
  console.log(`Sending /buy to @${botUsername}...`);
  await client.sendMessage(botUsername, { message: "/buy" });
  await new Promise((r) => setTimeout(r, 3000));

  const msgs = await client.getMessages(botUsername, { limit: 2 });
  const msg = msgs.find((m) => !m.out);

  if (msg) {
    console.log("=== SHOP XOAI NON BUY MENU ===");
    console.log("Message:\n", msg.message);
    if (msg.replyMarkup && msg.replyMarkup.rows) {
      console.log("\n--- BUTTONS / PRODUCTS ---");
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : (btn.url || "");
          console.log(`[${btn.text}] -> data: "${dataStr}"`);
        }
      }
    }
  } else {
    console.log("No response from bot.");
  }

  await client.disconnect();
}

main().catch(console.error);
