const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function testXoaiNon() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram successfully!");

  const me = await client.getMe();
  console.log("Logged in as:", me.firstName, me.phone, me.id);

  console.log("Sending /balance to @shopxoainon_bot...");
  await client.sendMessage("shopxoainon_bot", { message: "/balance" });
  await new Promise(r => setTimeout(r, 2500));

  let msgs = await client.getMessages("shopxoainon_bot", { limit: 3 });
  for (const m of msgs) {
    console.log(`[${m.out ? 'ME' : 'BOT'}]: ${m.message}`);
  }

  console.log("\nSending /start to @shopxoainon_bot...");
  await client.sendMessage("shopxoainon_bot", { message: "/start" });
  await new Promise(r => setTimeout(r, 2000));

  msgs = await client.getMessages("shopxoainon_bot", { limit: 1 });
  let msg = msgs[0];
  console.log("Start reply:", msg.message);
  if (msg?.replyMarkup?.rows) {
    for (const row of msg.replyMarkup.rows) {
      for (const btn of row.buttons) {
        const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
        console.log(`Btn: "${btn.text}" -> data: "${dataStr}"`);
        if (dataStr === "menu:account" || btn.text.includes("Tài khoản")) {
          console.log("Clicking account button...");
          await msg.click({ data: btn.data });
          await new Promise(r => setTimeout(r, 2000));
          const accMsgs = await client.getMessages("shopxoainon_bot", { limit: 1 });
          console.log("Account reply:", accMsgs[0]?.message);
        }
      }
    }
  }
}

testXoaiNon().catch(console.error).finally(() => process.exit(0));
