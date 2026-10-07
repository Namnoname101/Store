const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const creds = JSON.parse(fs.readFileSync("tele-session.json", "utf8"));

async function executePurchase() {
  const client = new TelegramClient(
    new StringSession(creds.sessionString),
    creds.apiId,
    creds.apiHash,
    {}
  );
  await client.connect();

  const msgs = await client.getMessages("nghientrickshop_bot", { limit: 1 });
  const confirmMsg = msgs[0];
  console.log("Current message ID:", confirmMsg.id);
  console.log("Clicking [pay_wallet] to purchase 1 Gemini link...");

  await confirmMsg.click({ data: Buffer.from("pay_wallet") });

  // Wait 3 seconds for bot to process and respond
  await new Promise((r) => setTimeout(r, 4000));

  const recent = await client.getMessages("nghientrickshop_bot", { limit: 3 });
  console.log("=== KẾT QUẢ TỪ BOT SAU KHI THANH TOÁN VÍ ===");
  for (const m of recent) {
    console.log(`[MSG ID ${m.id}] Date: ${m.date}`);
    console.log("TEXT:\n", m.text);
    console.log("-----------------------------------------");
  }
}

executePurchase().catch(console.error).finally(() => process.exit(0));
