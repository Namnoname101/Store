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

  const bot = await client.getEntity("hihistorebot");
  const cats = [
    { code: "cat_view_cat_8aa802ff", name: "YouTube Premium" },
    { code: "cat_view_cat_f6d3599b", name: "Netflix" },
    { code: "cat_view_cat_10eba7d2", name: "Spotify" },
    { code: "cat_view_cat_71b4df17", name: "Figma" }
  ];

  const results = [];

  for (const c of cats) {
    try {
      await client.sendMessage(bot, { message: "/start" });
      await sleep(1500);
      let msgs = await client.getMessages(bot, { limit: 1 });
      let msg = msgs[0];
      await msg.click({ data: Buffer.from("btn_buy") });
      await sleep(1500);

      msgs = await client.getMessages(bot, { limit: 1 });
      msg = msgs[0];
      await msg.click({ data: Buffer.from(c.code) });
      await sleep(1500);

      msgs = await client.getMessages(bot, { limit: 1 });
      const subMsg = msgs[0];
      console.log(`\n[PQV Store ${c.name}]:`);
      console.log(subMsg?.message?.slice(0, 300));
      if (subMsg?.replyMarkup?.rows) {
        for (const row of subMsg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : "";
            console.log(`  [${btn.text} | data: ${d}]`);
            results.push({ category: c.name, text: btn.text, data: d });
          }
        }
      }
    } catch (e) {
      console.warn(`Error on PQV Store ${c.name}:`, e.message);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "pqv-details.json"),
    JSON.stringify(results, null, 2),
    "utf-8"
  );
  console.log("\nSaved PQV details to scripts/pqv-details.json");
}

main().catch(console.error).finally(() => process.exit(0));
