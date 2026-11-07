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

  // Check 1: DKey Netflix ([Slot] Netflix 4K Premium 1 tháng BHF - 6acf7db4452526529250f06e)
  console.log("\n--- Checking DKey Netflix ---");
  const dkey = await client.getEntity("dkeyshop_bot");
  try {
    await client.sendMessage(dkey, { message: "/start" });
    await sleep(1000);
    let msgs = await client.getMessages(dkey, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("menu::buy") });
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("products_category::6839ac01fff70f6f") }); // Netflix
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    // Click on product to see description (NOT confirm buy!)
    await msgs[0].click({ data: Buffer.from("product_id::6acf7db4452526529250f06e") });
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    console.log("Netflix product view message:");
    console.log(msgs[0]?.message);
  } catch (e) {
    console.warn("Error DKey Netflix:", e.message);
  }

  // Check 2: DKey Kling AI (6a3f1008cc06fe4bc3ab8e27)
  console.log("\n--- Checking DKey Kling AI ---");
  try {
    await client.sendMessage(dkey, { message: "/start" });
    await sleep(1000);
    let msgs = await client.getMessages(dkey, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("menu::buy") });
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("products_category::5c7d32ac2d24c7f9") }); // Kling
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("product_id::6a3f1008cc06fe4bc3ab8e27") });
    await sleep(1000);

    msgs = await client.getMessages(dkey, { limit: 1 });
    console.log("Kling AI product view message:");
    console.log(msgs[0]?.message);
  } catch (e) {
    console.warn("Error DKey Kling:", e.message);
  }

  // Check 3: D-Shop ElevenLabs (prod:5:0)
  console.log("\n--- Checking D-Shop ElevenLabs ---");
  const dshop = await client.getEntity("mmo_dshop_bot");
  try {
    await client.sendMessage(dshop, { message: "/start" });
    await sleep(1000);
    let msgs = await client.getMessages(dshop, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("buy") });
    await sleep(1000);

    msgs = await client.getMessages(dshop, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("cat:5") }); // Elevenlabs
    await sleep(1000);

    msgs = await client.getMessages(dshop, { limit: 1 });
    await msgs[0].click({ data: Buffer.from("prod:5:0") });
    await sleep(1000);

    msgs = await client.getMessages(dshop, { limit: 1 });
    console.log("ElevenLabs product view message:");
    console.log(msgs[0]?.message);
  } catch (e) {
    console.warn("Error D-Shop ElevenLabs:", e.message);
  }
}

main().catch(console.error).finally(() => process.exit(0));
