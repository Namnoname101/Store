const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

async function checkChoDauMoiAdobe() {
  const credsPath = path.join(__dirname, "../tele-session.json");
  const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, { connectionRetries: 3 });
  await client.connect();

  console.log("Checking @chodaumoi_bot for Adobe...");
  await client.sendMessage("chodaumoi_bot", { message: "/menu" });
  await new Promise(r => setTimeout(r, 2000));

  let msgs = await client.getMessages("chodaumoi_bot", { limit: 2 });
  let msg = msgs.find(m => !m.out);
  if (msg?.replyMarkup?.rows) {
    for (const row of msg.replyMarkup.rows) {
      for (const btn of row.buttons) {
        if (/adobe/i.test(btn.text)) {
          console.log(`Clicking category: ${btn.text}`);
          await msg.click({ data: btn.data });
          await new Promise(r => setTimeout(r, 2000));
          const subMsgs = await client.getMessages("chodaumoi_bot", { limit: 2 });
          console.log("Adobe sub-items:\n" + subMsgs.find(m => !m.out)?.message);
        }
      }
    }
  }
}

checkChoDauMoiAdobe().catch(console.error).finally(() => process.exit(0));
