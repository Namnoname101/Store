const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();

  const dkey = await client.getEntity("dkeyshop_bot");
  await client.sendMessage(dkey, { message: "/start" });
  await sleep(1500);

  let msgs = await client.getMessages(dkey, { limit: 1 });
  let msg = msgs[0];
  await msg.click({ data: Buffer.from("menu::buy") });
  await sleep(1500);

  msgs = await client.getMessages(dkey, { limit: 1 });
  msg = msgs[0];
  await msg.click({ data: Buffer.from("products_category::6839ac01fff70f6f") }); // Netflix
  await sleep(1500);

  msgs = await client.getMessages(dkey, { limit: 1 });
  msg = msgs[0];
  await msg.click({ data: Buffer.from("product_id::6acf7db4452526529250f06e") });
  await sleep(1500);

  // Send "1"
  await client.sendMessage(dkey, { message: "1" });
  await sleep(2000);

  msgs = await client.getMessages(dkey, { limit: 1 });
  console.log("Confirmation message text:");
  console.log(msgs[0]?.message);
  console.log("Buttons on confirmation:");
  if (msgs[0]?.replyMarkup?.rows) {
    for (const row of msgs[0].replyMarkup.rows) {
      for (const btn of row.buttons) {
        const d = btn.data ? btn.data.toString("utf-8") : "";
        console.log(`  Button [${btn.text}] -> data: "${d}"`);
      }
    }
  }

  // Send /start to cancel and reset
  await sleep(1000);
  await client.sendMessage(dkey, { message: "/start" });
}

main().catch(console.error).finally(() => process.exit(0));
