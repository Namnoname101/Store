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

  // Try direct click on product_id::6acf7db4452526529250f06e
  try {
    console.log("Testing direct click product_id on DKey...");
    await msg.click({ data: Buffer.from("product_id::6acf7db4452526529250f06e") });
    await sleep(1500);
    msgs = await client.getMessages(dkey, { limit: 1 });
    console.log("Direct click result message:");
    console.log(msgs[0]?.message);
  } catch (e) {
    console.log("Direct click failed as expected:", e.message);
  }

  await client.sendMessage(dkey, { message: "/start" });
}

main().catch(console.error).finally(() => process.exit(0));
