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
  const msgs = await client.getMessages(bot, { search: "luisalfredomadelein", limit: 10 });
  
  console.log(`Found ${msgs.length} messages matching luisalfredomadelein:`);
  for (const m of msgs) {
    const d = new Date(m.date * 1000);
    const time = d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    console.log(`[${time}] ID:${m.id}:`);
    console.log(m.message);
  }
}

main().catch(console.error).finally(() => process.exit(0));
