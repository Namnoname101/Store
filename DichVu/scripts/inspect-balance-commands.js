/**
 * Deep inspection: tìm lệnh check balance cho từng bot NCC
 * Thử /start, /wallet, /me, /account, /balance cho mỗi bot
 */
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

// Bot cần kiểm tra sâu hơn
const BOTS = [
  { username: "KhoMMO_Market_bot",   cmds: ["/start", "/wallet", "/me", "/taikhoan"] },
  { username: "mmo_dshop_bot",       cmds: ["/start", "/wallet", "/me"] },
  { username: "dkeyshop_bot",        cmds: ["/wallet"] },
  { username: "toki_shopmmo_bot",    cmds: ["/start", "/wallet", "/me"] },
  { username: "ShopHXN_bot",         cmds: ["/wallet"] },
  { username: "chodaumoi_bot",       cmds: ["/start", "/wallet"] },
  { username: "timecloudorderbot",   cmds: ["/start", "/wallet", "/me"] },
];

async function tryCommand(client, botEntity, cmd) {
  console.log(`  -> Gửi: ${cmd}`);
  await client.sendMessage(botEntity, { message: cmd });
  await new Promise(r => setTimeout(r, 3000));
  const msgs = await client.getMessages(botEntity, { limit: 2 });
  const reply = msgs.find(m => !m.out);
  if (!reply) {
    console.log(`  [NO REPLY]`);
    return null;
  }
  console.log(`  [REPLY] ${reply.message?.slice(0, 300)}`);
  if (reply.replyMarkup?.rows) {
    console.log(`  Buttons:`);
    for (const row of reply.replyMarkup.rows) {
      const btns = row.buttons.map(b => `[${b.text} | ${b.data ? b.data.toString("utf-8") : b.url}]`).join("  ");
      console.log(`    ${btns}`);
    }
  }
  return reply;
}

async function inspectBot(client, bot) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔍 @${bot.username}`);
  console.log("=".repeat(50));
  try {
    const entity = await client.getEntity(bot.username);
    for (const cmd of bot.cmds) {
      const reply = await tryCommand(client, entity, cmd);
      // Nếu tìm thấy balance thì dừng lại
      if (reply?.message && (
        reply.message.includes("Số dư") ||
        reply.message.includes("số dư") ||
        reply.message.includes("balance") ||
        reply.message.includes("Balance") ||
        reply.message.includes("VNĐ") ||
        reply.message.includes("₫") ||
        reply.message.match(/\d[\d,.]+\s*(đ|vnd|vnđ)/i)
      )) {
        console.log(`  ✅ FOUND BALANCE INFO in reply to ${cmd}!`);
        break;
      }
    }
  } catch (err) {
    console.error(`Lỗi @${bot.username}:`, err.message);
  }
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });
  await client.connect();
  console.log("Connected!");

  for (const bot of BOTS) {
    await inspectBot(client, bot);
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log("\n\nDONE!");
}

main().catch(console.error).finally(() => process.exit(0));
