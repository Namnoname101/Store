const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function testToki(client) {
  console.log("\n=================================");
  console.log("👉 KIỂM TRA: @toki_shopmmo_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("toki_shopmmo_bot");
  
  await client.sendMessage(botEntity, { message: "/start" });
  await new Promise(r => setTimeout(r, 3000));
  
  let msgs = await client.getMessages(botEntity, { limit: 2 });
  let reply = msgs.find(m => !m.out);
  console.log(`[TOKI /start]:\n${reply?.message}`);
  if (reply?.replyMarkup) {
    for (const row of reply.replyMarkup.rows) {
      console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
    }
  }

  // Also try /help
  await client.sendMessage(botEntity, { message: "/help" });
  await new Promise(r => setTimeout(r, 3000));
  msgs = await client.getMessages(botEntity, { limit: 2 });
  reply = msgs.find(m => !m.out);
  console.log(`[TOKI /help]:\n${reply?.message}`);
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });
  await client.connect();
  await testToki(client);
}

main().catch(console.error).finally(() => process.exit(0));
