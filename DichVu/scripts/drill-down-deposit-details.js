const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function drillDShop(client) {
  console.log("\n=================================");
  console.log("👉 DRILL-DOWN: @mmo_dshop_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("mmo_dshop_bot");
  const msgs = await client.getMessages(botEntity, { limit: 3 });
  const lastBotMsg = msgs.find(m => !m.out && m.replyMarkup);
  if (lastBotMsg) {
    console.log("Bấm nút [➕ Top up VND QR]...");
    await lastBotMsg.click({ data: Buffer.from("wallet:topup:VND") });
    await new Promise(r => setTimeout(r, 4000));
    const newMsgs = await client.getMessages(botEntity, { limit: 3 });
    const reply = newMsgs.find(m => !m.out);
    console.log(`[DSHOP TOPUP VND REPLY]:\n${reply?.message}`);
    if (reply?.replyMarkup) {
      for (const row of reply.replyMarkup.rows) {
        console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
      }
    }
  }
}

async function drillDKeyShop(client) {
  console.log("\n=================================");
  console.log("👉 DRILL-DOWN: @dkeyshop_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("dkeyshop_bot");
  const msgs = await client.getMessages(botEntity, { limit: 3 });
  const lastBotMsg = msgs.find(m => !m.out && m.replyMarkup);
  if (lastBotMsg) {
    console.log("Bấm nút [Nạp vào ví] (wallet::topup)...");
    await lastBotMsg.click({ data: Buffer.from("wallet::topup") });
    await new Promise(r => setTimeout(r, 4000));
    const newMsgs = await client.getMessages(botEntity, { limit: 3 });
    const reply = newMsgs.find(m => !m.out);
    console.log(`[DKEYSHOP TOPUP REPLY]:\n${reply?.message}`);
    if (reply?.replyMarkup) {
      for (const row of reply.replyMarkup.rows) {
        console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
      }
    }
  }
}

async function drillShopHXN(client) {
  console.log("\n=================================");
  console.log("👉 DRILL-DOWN: @ShopHXN_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("ShopHXN_bot");
  const msgs = await client.getMessages(botEntity, { limit: 3 });
  const lastBotMsg = msgs.find(m => !m.out && m.replyMarkup);
  if (lastBotMsg) {
    console.log("Bấm nút [Nạp vào ví] (wallet::topup)...");
    await lastBotMsg.click({ data: Buffer.from("wallet::topup") });
    await new Promise(r => setTimeout(r, 4000));
    const newMsgs = await client.getMessages(botEntity, { limit: 3 });
    const reply = newMsgs.find(m => !m.out);
    console.log(`[SHOPHXN TOPUP REPLY]:\n${reply?.message}`);
    if (reply?.replyMarkup) {
      for (const row of reply.replyMarkup.rows) {
        console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
      }
    }
  }
}

async function drillChoDauMoi(client) {
  console.log("\n=================================");
  console.log("👉 DRILL-DOWN: @chodaumoi_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("chodaumoi_bot");
  const msgs = await client.getMessages(botEntity, { limit: 3 });
  const lastBotMsg = msgs.find(m => !m.out && m.replyMarkup);
  if (lastBotMsg) {
    console.log("Bấm nút [20,000đ] (topup_amt|20000)...");
    await lastBotMsg.click({ data: Buffer.from("topup_amt|20000") });
    await new Promise(r => setTimeout(r, 4000));
    const newMsgs = await client.getMessages(botEntity, { limit: 3 });
    const reply = newMsgs.find(m => !m.out);
    console.log(`[CHODAUMOI TOPUP 20K REPLY]:\n${reply?.message}`);
    if (reply?.replyMarkup) {
      for (const row of reply.replyMarkup.rows) {
        console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
      }
    }
  }
}

async function drillHiHiStore(client) {
  console.log("\n=================================");
  console.log("👉 DRILL-DOWN: @hihistorebot");
  console.log("=================================");
  const botEntity = await client.getEntity("hihistorebot");
  const msgs = await client.getMessages(botEntity, { limit: 3 });
  const lastBotMsg = msgs.find(m => !m.out && m.replyMarkup);
  if (lastBotMsg) {
    console.log("Bấm nút [20.000 ₫] (nap_amt_20000)...");
    await lastBotMsg.click({ data: Buffer.from("nap_amt_20000") });
    await new Promise(r => setTimeout(r, 4000));
    const newMsgs = await client.getMessages(botEntity, { limit: 3 });
    const reply = newMsgs.find(m => !m.out);
    console.log(`[HIHISTORE TOPUP 20K REPLY]:\n${reply?.message}`);
    if (reply?.replyMarkup) {
      for (const row of reply.replyMarkup.rows) {
        console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
      }
    }
  }
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram!");

  await drillDShop(client);
  await drillDKeyShop(client);
  await drillShopHXN(client);
  await drillChoDauMoi(client);
  await drillHiHiStore(client);
}

main().catch(console.error).finally(() => process.exit(0));
