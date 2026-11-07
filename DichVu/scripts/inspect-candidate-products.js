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

  // Inspect D-Shop YouTube (cat:12) & Elevenlabs (cat:5) & Zoom (cat:13)
  console.log("\n--- Checking MMO D-Shop categories ---");
  const dshop = await client.getEntity("mmo_dshop_bot");
  const testCats = ["cat:12", "cat:5", "cat:13"];
  const dshopDetails = [];

  for (const cat of testCats) {
    try {
      await client.sendMessage(dshop, { message: "/start" });
      await sleep(1500);
      let msgs = await client.getMessages(dshop, { limit: 1 });
      let msg = msgs[0];
      await msg.click({ data: Buffer.from("buy") });
      await sleep(1500);

      msgs = await client.getMessages(dshop, { limit: 1 });
      msg = msgs[0];
      await msg.click({ data: Buffer.from(cat) });
      await sleep(1500);

      msgs = await client.getMessages(dshop, { limit: 1 });
      const catMsg = msgs[0];
      console.log(`[D-Shop ${cat}]:`);
      console.log(catMsg?.message?.slice(0, 300));
      if (catMsg?.replyMarkup?.rows) {
        for (const row of catMsg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : "";
            console.log(`  [${btn.text} | data: ${d}]`);
            dshopDetails.push({ cat, text: btn.text, data: d });
          }
        }
      }
    } catch (e) {
      console.warn(`Error on D-Shop ${cat}:`, e.message);
    }
  }

  // Inspect Nghien Trick Netflix (shopcat_65db894f0b) & Spotify (shopcat_d50addf719) & Locket (shopcat_2bc95ece0a)
  console.log("\n--- Checking Nghien Trick categories ---");
  const trick = await client.getEntity("nghientrickshop_bot");
  const trickCats = [
    { code: "shopcat_65db894f0b", name: "Netflix" },
    { code: "shopcat_d50addf719", name: "Spotify" },
    { code: "shopcat_2bc95ece0a", name: "Locket Gold" },
  ];
  const trickDetails = [];

  for (const tc of trickCats) {
    try {
      await client.sendMessage(trick, { message: "/start" });
      await sleep(1500);
      let msgs = await client.getMessages(trick, { limit: 1 });
      let msg = msgs[0];
      await msg.click({ data: Buffer.from("menu_shop") });
      await sleep(1500);

      msgs = await client.getMessages(trick, { limit: 1 });
      msg = msgs[0];
      await msg.click({ data: Buffer.from(tc.code) });
      await sleep(1500);

      msgs = await client.getMessages(trick, { limit: 1 });
      const subMsg = msgs[0];
      console.log(`[Nghien Trick ${tc.name}]:`);
      console.log(subMsg?.message?.slice(0, 300));
      if (subMsg?.replyMarkup?.rows) {
        for (const row of subMsg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : "";
            console.log(`  [${btn.text} | data: ${d}]`);
            trickDetails.push({ cat: tc.name, text: btn.text, data: d });
          }
        }
      }
    } catch (e) {
      console.warn(`Error on Nghien Trick ${tc.name}:`, e.message);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "candidate-products-details.json"),
    JSON.stringify({ dshopDetails, trickDetails }, null, 2),
    "utf-8"
  );
  console.log("\nSaved details to scripts/candidate-products-details.json");
}

main().catch(console.error).finally(() => process.exit(0));
