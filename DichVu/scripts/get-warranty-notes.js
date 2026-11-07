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
  console.log("Connected to Telegram.");

  const notes = {};

  // 1. Xoài Non: #56 (Wink), #72 (Figma), #76 (Muse AI)
  console.log("\n--- Checking Xoài Non descriptions ---");
  const xoainon = await client.getEntity("shopxoainon_bot");
  const xnIds = [
    { key: "wink", id: "56" },
    { key: "figma", id: "72" },
    { key: "muse", id: "76" }
  ];

  for (const item of xnIds) {
    try {
      await client.sendMessage(xoainon, { message: "/start" });
      await sleep(1200);
      let msgs = await client.getMessages(xoainon, { limit: 1 });
      await msgs[0].click({ data: Buffer.from("menu_shop") });
      await sleep(1200);

      msgs = await client.getMessages(xoainon, { limit: 1 });
      // Click product by id
      await msgs[0].click({ data: Buffer.from(`item_${item.id}`) });
      await sleep(1200);

      msgs = await client.getMessages(xoainon, { limit: 1 });
      console.log(`[Xoài Non #${item.id} (${item.key})]:`);
      console.log(msgs[0]?.message);
      notes[item.key] = msgs[0]?.message;
    } catch (e) {
      console.warn(`Error on Xoài Non #${item.id}:`, e.message);
    }
  }

  // 2. D-Shop: Zoom (cat:13 -> prod:13:2)
  console.log("\n--- Checking D-Shop Zoom description ---");
  const dshop = await client.getEntity("mmo_dshop_bot");
  try {
    await client.sendMessage(dshop, { message: "/start" });
    await sleep(1200);
    let msgs = await client.getMessages(dshop, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("buy") });
    await sleep(1200);

    msgs = await client.getMessages(dshop, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("cat:13") });
    await sleep(1200);

    msgs = await client.getMessages(dshop, { limit: 1 });
    // Find button for prod:13:2
    await msgs[0].click({ data: Buffer.from("prod:13:2") });
    await sleep(1200);

    msgs = await client.getMessages(dshop, { limit: 1 });
    console.log("[D-Shop Zoom Pro]:");
    console.log(msgs[0]?.message);
    notes["zoom"] = msgs[0]?.message;
  } catch (e) {
    console.warn("Error D-Shop Zoom:", e.message);
  }

  fs.writeFileSync(
    path.join(__dirname, "supplier-warranty-notes.json"),
    JSON.stringify(notes, null, 2),
    "utf-8"
  );
  console.log("\nSaved notes to scripts/supplier-warranty-notes.json");
}

main().catch(console.error).finally(() => process.exit(0));
