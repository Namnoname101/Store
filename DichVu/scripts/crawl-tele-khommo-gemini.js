const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("✅ Logged in successfully!");

  const bot = "KhoMMO_Market_bot";
  await client.sendMessage(bot, { message: "/start" });
  await sleep(1500);

  let msgs = await client.getMessages(bot, { limit: 1 });
  let msg = msgs[0];

  console.log("Clicking [Cửa hàng] (b:4)...");
  await msg.click({ data: Buffer.from("b:4") });
  await sleep(2000);

  msgs = await client.getMessages(bot, { limit: 1 });
  msg = msgs[0];

  console.log("Clicking [Gemini Pro] (a:sc:2)...");
  await msg.click({ data: Buffer.from("a:sc:2") });
  await sleep(2000);

  msgs = await client.getMessages(bot, { limit: 1 });
  msg = msgs[0];
  console.log("\n================ GEMINI MENU ON TELEGRAM ================");
  console.log(msg?.message);
  console.log("=========================================================");

  if (msg?.replyMarkup?.rows) {
    for (const r of msg.replyMarkup.rows) {
      for (const b of r.buttons) {
        const text = b.text || '';
        const data = b.data ? b.data.toString() : '';
        console.log(`BUTTON: [${text}] -> ${data}`);
      }
    }
  }

  // Click each product button to inspect detail screen!
  const productButtons = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).filter(b => {
    const data = b.data ? b.data.toString() : '';
    return data.startsWith('a:pv:');
  }) || [];

  console.log(`\nFound ${productButtons.length} Gemini product items. Inspecting details...`);

  for (const pb of productButtons) {
    console.log(`\n--- Inspecting: [${pb.text}] (${pb.data.toString()}) ---`);
    await msg.click({ data: pb.data });
    await sleep(2000);

    const detailMsgs = await client.getMessages(bot, { limit: 1 });
    const detailMsg = detailMsgs[0];
    console.log("DETAIL SCREEN:\n", detailMsg?.message);

    // Click back to category menu: [⬅️ Quay lại]
    const backBtn = detailMsg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
      const t = b.text || '';
      return t.includes('Quay lại') || (b.data && b.data.toString().includes('a:sc:2'));
    });
    if (backBtn) {
      await detailMsg.click({ data: backBtn.data });
      await sleep(1500);
      const categoryMsgs = await client.getMessages(bot, { limit: 1 });
      msg = categoryMsgs[0];
    }
  }

  await client.disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
