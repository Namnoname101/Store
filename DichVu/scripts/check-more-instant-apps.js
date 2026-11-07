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
  const testCats = [
    { name: "PhotoRoom", code: "products_category::6cf424f4699edabf" },
    { name: "Xingtu", code: "products_category::7eddd6dfc58a7431" }
  ];

  for (const c of testCats) {
    await client.sendMessage(dkey, { message: "/start" });
    await sleep(1000);
    let msgs = await client.getMessages(dkey, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("menu::buy") });
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    await msgs[0].click({ data: Buffer.from(c.code) });
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    console.log(`\n[${c.name}]:`);
    if (msgs[0]?.replyMarkup?.rows) {
      for (const row of msgs[0].replyMarkup.rows) {
        for (const btn of row.buttons) {
          const d = btn.data ? btn.data.toString("utf-8") : "";
          if (d.startsWith("product_id::")) {
            console.log(`  ${btn.text} -> ${d}`);
          }
        }
      }
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
