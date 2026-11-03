const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

const BOTS_TO_INSPECT = [
  "KhoMMO_Market_bot",
  "mmo_dshop_bot",
  "dkeyshop_bot",
  "toki_shopmmo_bot",
  "ShopHXN_bot",
  "chodaumoi_bot",
  "hihistorebot",
  "timecloudorderbot",
];

async function inspectBot(client, botUsername) {
  console.log(`\n========================================`);
  console.log(`🔍 KIỂM TRA BOT: @${botUsername}`);
  console.log(`========================================`);

  try {
    const botEntity = await client.getEntity(botUsername);
    
    // 1. Check last 3 messages to see current state
    const history = await client.getMessages(botEntity, { limit: 3 });
    console.log(`--- Tin nhắn gần nhất từ @${botUsername}:`);
    for (const msg of history) {
      console.log(`[${msg.out ? "USER -> BOT" : "BOT -> USER"}] ${msg.message?.slice(0, 150)}...`);
    }

    // 2. Send /deposit to test deposit command
    console.log(`-> Gửi /deposit tới @${botUsername}...`);
    await client.sendMessage(botEntity, { message: "/deposit" });
    await new Promise(r => setTimeout(r, 3000));

    // Get responses
    let newMsgs = await client.getMessages(botEntity, { limit: 3 });
    let botReply = newMsgs.find(m => !m.out);

    if (botReply) {
      console.log(`\n[PHẢN HỒI /deposit]`);
      console.log(`Nội dung:\n${botReply.message}`);
      if (botReply.replyMarkup && botReply.replyMarkup.rows) {
        console.log(`Nút bấm:`);
        for (const row of botReply.replyMarkup.rows) {
          console.log(`  ${row.buttons.map(b => `[${b.text} | data:${b.data ? b.data.toString('utf-8') : b.url}]`).join("  ")}`);
        }
      }
    } else {
      console.log("Không có phản hồi từ /deposit. Thử gửi /start...");
      await client.sendMessage(botEntity, { message: "/start" });
      await new Promise(r => setTimeout(r, 3000));
      newMsgs = await client.getMessages(botEntity, { limit: 3 });
      botReply = newMsgs.find(m => !m.out);
      if (botReply) {
        console.log(`\n[PHẢN HỒI /start]`);
        console.log(`Nội dung:\n${botReply.message}`);
        if (botReply.replyMarkup && botReply.replyMarkup.rows) {
          console.log(`Nút bấm:`);
          for (const row of botReply.replyMarkup.rows) {
            console.log(`  ${row.buttons.map(b => `[${b.text} | data:${b.data ? b.data.toString('utf-8') : b.url}]`).join("  ")}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Lỗi khi kiểm tra @${botUsername}:`, err.message);
  }
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram!");

  for (const bot of BOTS_TO_INSPECT) {
    await inspectBot(client, bot);
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(console.error).finally(() => process.exit(0));
