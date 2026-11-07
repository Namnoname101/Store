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
  console.log("Connected.");
  const botUsername = "shopxoainon_bot";
  const bot = await client.getEntity(botUsername);

  console.log("Sending /buy...");
  await client.sendMessage(bot, { message: "/buy" });
  await sleep(2000);

  let msgs = await client.getMessages(bot, { limit: 1 });
  let msg = msgs[0];
  console.log(`Catalog Message ID: ${msg.id}`);

  // Find button 49 (CapCut Pro 7 ngày 500 Credit)
  let targetBtn = null;
  for (const row of msg.replyMarkup.rows) {
    for (const btn of row.buttons) {
      const dataStr = btn.data ? btn.data.toString("utf-8") : "";
      if (dataStr === "product:view:49") {
        targetBtn = btn;
        break;
      }
    }
    if (targetBtn) break;
  }

  if (!targetBtn) {
    console.error("Button product:view:49 not found!");
    return;
  }

  console.log(`Found target button: [${targetBtn.text} | ${targetBtn.data.toString("utf-8")}]`);
  console.log("Clicking button via msg.click({ data: targetBtn.data })...");
  await msg.click({ data: targetBtn.data });
  await sleep(2000);

  // Fetch updated message
  msgs = await client.getMessages(bot, { limit: 1 });
  let detailMsg = msgs[0];
  console.log(`\n--- DETAIL SCREEN (Msg ID: ${detailMsg.id}) ---`);
  console.log(detailMsg.message);
  console.log("\nButtons on detail screen:");
  let backBtn = null;
  for (const row of detailMsg.replyMarkup.rows) {
    for (const btn of row.buttons) {
      const d = btn.data ? btn.data.toString("utf-8") : (btn.url || "");
      console.log(`  [${btn.text} | data: ${d}]`);
      if (d === "menu:buy" || d === "menu:home" || btn.text.includes("Quay lại")) {
        backBtn = btn;
      }
    }
  }

  // Click back button to return to catalog safely!
  if (backBtn) {
    console.log(`\nClicking back button: [${backBtn.text} | ${backBtn.data.toString("utf-8")}]...`);
    await detailMsg.click({ data: backBtn.data });
    await sleep(2000);

    msgs = await client.getMessages(bot, { limit: 1 });
    let backMsg = msgs[0];
    console.log(`Back at message ID: ${backMsg.id}`);
    console.log(`First 100 chars: ${backMsg.message.slice(0, 100)}...`);
  }

  console.log("\n✅ SAFELY TESTED PRODUCT 49 WITHOUT PURCHASING!");
}

main().catch(console.error).finally(() => process.exit(0));
