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

  const dshop = await client.getEntity("mmo_dshop_bot");
  await client.sendMessage(dshop, { message: "/start" });
  await sleep(1500);

  let msgs = await client.getMessages(dshop, { limit: 1 });
  await msgs[0].click({ data: Buffer.from("buy") });
  await sleep(1500);

  msgs = await client.getMessages(dshop, { limit: 1 });
  await msgs[0].click({ data: Buffer.from("cat:13") });
  await sleep(1500);

  msgs = await client.getMessages(dshop, { limit: 1 });
  await msgs[0].click({ data: Buffer.from("prod:13:2") });
  await sleep(1500);

  msgs = await client.getMessages(dshop, { limit: 1 });
  // Find qty button
  let qtyBtnData = null;
  if (msgs[0]?.replyMarkup?.rows) {
    for (const row of msgs[0].replyMarkup.rows) {
      for (const btn of row.buttons) {
        const d = btn.data ? btn.data.toString("utf-8") : "";
        if (d.startsWith("qty:") && d.endsWith(":1")) {
          qtyBtnData = d;
          break;
        }
      }
      if (qtyBtnData) break;
    }
  }

  if (qtyBtnData) {
    console.log(`Clicking qty button: ${qtyBtnData}`);
    await msgs[0].click({ data: Buffer.from(qtyBtnData) });
    await sleep(2000);

    msgs = await client.getMessages(dshop, { limit: 1 });
    console.log("D-Shop payment selection message:");
    console.log(msgs[0]?.message);
    if (msgs[0]?.replyMarkup?.rows) {
      for (const row of msgs[0].replyMarkup.rows) {
        for (const btn of row.buttons) {
          const d = btn.data ? btn.data.toString("utf-8") : "";
          console.log(`  Button [${btn.text}] -> data: "${d}"`);
        }
      }
    }
  }

  await sleep(1000);
  await client.sendMessage(dshop, { message: "/start" });
}

main().catch(console.error).finally(() => process.exit(0));
