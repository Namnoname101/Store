const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function finishDShop(client) {
  console.log("\n=================================");
  console.log("👉 HOÀN TẤT: @mmo_dshop_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("mmo_dshop_bot");
  console.log("Gửi số tiền '20000'...");
  await client.sendMessage(botEntity, { message: "20000" });
  await new Promise(r => setTimeout(r, 4000));
  
  const msgs = await client.getMessages(botEntity, { limit: 2 });
  const reply = msgs.find(m => !m.out);
  console.log(`[DSHOP RESULT]:\n${reply?.message}`);
  if (reply?.media) console.log("[DSHOP GỬI MEDIA/QR]");
}

async function finishDKeyShop(client) {
  console.log("\n=================================");
  console.log("👉 HOÀN TẤT: @dkeyshop_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("dkeyshop_bot");
  console.log("Gửi số tiền '20000'...");
  await client.sendMessage(botEntity, { message: "20000" });
  await new Promise(r => setTimeout(r, 4000));
  
  const msgs = await client.getMessages(botEntity, { limit: 2 });
  const reply = msgs.find(m => !m.out);
  console.log(`[DKEYSHOP RESULT]:\n${reply?.message}`);
  if (reply?.media) console.log("[DKEYSHOP GỬI MEDIA/QR]");
}

async function inspectChoDauMoiQR(client) {
  console.log("\n=================================");
  console.log("👉 KIỂM TRA MEDIA: @chodaumoi_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("chodaumoi_bot");
  const msgs = await client.getMessages(botEntity, { limit: 2 });
  const reply = msgs.find(m => !m.out);
  console.log(`[CHODAUMOI TEXT]:\n${reply?.message}`);
  if (reply?.media) {
    console.log("[CHODAUMOI CÓ MEDIA QR]");
  }
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram!");

  await finishDShop(client);
  await finishDKeyShop(client);
  await inspectChoDauMoiQR(client);
}

main().catch(console.error).finally(() => process.exit(0));
