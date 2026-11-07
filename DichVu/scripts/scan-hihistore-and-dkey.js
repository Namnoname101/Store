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

  // 1. Check PQV Store (@hihistorebot) via /sanpham
  console.log("\n--- Checking PQV Store /sanpham ---");
  const hihi = await client.getEntity("hihistorebot");
  await client.sendMessage(hihi, { message: "/sanpham" });
  await sleep(2000);
  let hihiMsgs = await client.getMessages(hihi, { limit: 3 });
  console.log("PQV Store message:");
  for (const m of hihiMsgs) {
    if (m.message && m.message.includes("Sản Phẩm")) {
      console.log(m.message.slice(0, 1000));
    }
  }

  // 2. Check dkeyshop_bot categories
  console.log("\n--- Checking dkeyshop_bot categories ---");
  const dkey = await client.getEntity("dkeyshop_bot");
  const dkeyCats = [
    { name: "YouTube", code: "products_category::7bdb4d7adeb2ac95" },
    { name: "Netflix", code: "products_category::6839ac01fff70f6f" },
    { name: "Wink", code: "products_category::675e9bd10c28e5ab" },
    { name: "Kling AI", code: "products_category::5c7d32ac2d24c7f9" },
    { name: "Notion", code: "products_category::dab065c76ba03206" },
    { name: "Lovable", code: "products_category::d93867596ff0b727" }
  ];

  const dkeyResults = [];
  for (const c of dkeyCats) {
    try {
      await client.sendMessage(dkey, { message: "/start" });
      await sleep(1200);
      let msgs = await client.getMessages(dkey, { limit: 1 });
      let msg = msgs[0];
      await msg.click({ data: Buffer.from("menu::buy") });
      await sleep(1200);

      msgs = await client.getMessages(dkey, { limit: 1 });
      msg = msgs[0];
      await msg.click({ data: Buffer.from(c.code) });
      await sleep(1200);

      msgs = await client.getMessages(dkey, { limit: 1 });
      const subMsg = msgs[0];
      console.log(`\n[dkey ${c.name}]:`);
      if (subMsg?.replyMarkup?.rows) {
        for (const row of subMsg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : "";
            if (d.startsWith("product_id::") || btn.text.includes("k") || btn.text.includes("📦")) {
              console.log(`  ${btn.text} -> ${d}`);
              dkeyResults.push({ cat: c.name, text: btn.text, data: d });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Error on dkey ${c.name}:`, e.message);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "dkey-products-found.json"),
    JSON.stringify(dkeyResults, null, 2),
    "utf-8"
  );
  console.log("\nSaved dkey products to scripts/dkey-products-found.json");
}

main().catch(console.error).finally(() => process.exit(0));
