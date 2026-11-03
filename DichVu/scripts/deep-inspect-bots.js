const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function inspectKhoMMO(client) {
  console.log("\n=================================");
  console.log("👉 ĐANG KIỂM TRA: @KhoMMO_Market_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("KhoMMO_Market_bot");
  // Cú pháp là /nap 20000
  console.log("Gửi /nap 20000...");
  await client.sendMessage(botEntity, { message: "/nap 20000" });
  await new Promise(r => setTimeout(r, 4000));
  
  const msgs = await client.getMessages(botEntity, { limit: 3 });
  for (const m of msgs) {
    if (!m.out) {
      console.log(`[BOT REPLY KhoMMO]:\n${m.message}`);
      if (m.media) {
        console.log(`[CÓ MEDIA / HÌNH ẢNH / QR]`);
      }
      if (m.replyMarkup && m.replyMarkup.rows) {
        for (const row of m.replyMarkup.rows) {
          console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
        }
      }
      break;
    }
  }
}

async function inspectDShop(client) {
  console.log("\n=================================");
  console.log("👉 ĐANG KIỂM TRA: @mmo_dshop_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("mmo_dshop_bot");
  // Gửi /start trước để lấy menu
  await client.sendMessage(botEntity, { message: "/start" });
  await new Promise(r => setTimeout(r, 3000));
  
  let msgs = await client.getMessages(botEntity, { limit: 2 });
  let botReply = msgs.find(m => !m.out);
  if (botReply && botReply.replyMarkup) {
    // Tìm nút wallet
    let walletBtn = null;
    for (const row of botReply.replyMarkup.rows) {
      for (const btn of row.buttons) {
        if (btn.data && btn.data.toString('utf-8') === 'wallet') {
          walletBtn = btn;
        }
      }
    }
    if (walletBtn) {
      console.log("Bấm nút [Wallet]...");
      await botReply.click({ data: walletBtn.data });
      await new Promise(r => setTimeout(r, 3000));
      msgs = await client.getMessages(botEntity, { limit: 3 });
      botReply = msgs.find(m => !m.out);
      console.log(`[BOT REPLY DShop Wallet]:\n${botReply?.message}`);
      if (botReply?.replyMarkup) {
        for (const row of botReply.replyMarkup.rows) {
          console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
        }
      }
    }
  }
}

async function inspectDKeyShop(client) {
  console.log("\n=================================");
  console.log("👉 ĐANG KIỂM TRA: @dkeyshop_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("dkeyshop_bot");
  console.log("Gửi /wallet...");
  await client.sendMessage(botEntity, { message: "/wallet" });
  await new Promise(r => setTimeout(r, 3000));
  
  let msgs = await client.getMessages(botEntity, { limit: 2 });
  let botReply = msgs.find(m => !m.out);
  console.log(`[BOT REPLY DKeyShop /wallet]:\n${botReply?.message}`);
  if (botReply?.replyMarkup) {
    for (const row of botReply.replyMarkup.rows) {
      console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
    }
  }
}

async function inspectShopHXN(client) {
  console.log("\n=================================");
  console.log("👉 ĐANG KIỂM TRA: @ShopHXN_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("ShopHXN_bot");
  console.log("Gửi /wallet...");
  await client.sendMessage(botEntity, { message: "/wallet" });
  await new Promise(r => setTimeout(r, 3000));
  
  let msgs = await client.getMessages(botEntity, { limit: 2 });
  let botReply = msgs.find(m => !m.out);
  console.log(`[BOT REPLY ShopHXN /wallet]:\n${botReply?.message}`);
  if (botReply?.replyMarkup) {
    for (const row of botReply.replyMarkup.rows) {
      console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
    }
  }
}

async function inspectChoDauMoi(client) {
  console.log("\n=================================");
  console.log("👉 ĐANG KIỂM TRA: @chodaumoi_bot");
  console.log("=================================");
  const botEntity = await client.getEntity("chodaumoi_bot");
  console.log("Gửi /nap hoặc kiểm tra nút topup...");
  await client.sendMessage(botEntity, { message: "/nap" });
  await new Promise(r => setTimeout(r, 3000));
  
  let msgs = await client.getMessages(botEntity, { limit: 2 });
  let botReply = msgs.find(m => !m.out);
  console.log(`[BOT REPLY ChoDauMoi /nap]:\n${botReply?.message}`);
  if (botReply?.replyMarkup) {
    for (const row of botReply.replyMarkup.rows) {
      console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
    }
  }
}

async function inspectHiHiStore(client) {
  console.log("\n=================================");
  console.log("👉 ĐANG KIỂM TRA: @hihistorebot");
  console.log("=================================");
  const botEntity = await client.getEntity("hihistorebot");
  console.log("Gửi /nap...");
  await client.sendMessage(botEntity, { message: "/nap" });
  await new Promise(r => setTimeout(r, 3000));
  
  let msgs = await client.getMessages(botEntity, { limit: 2 });
  let botReply = msgs.find(m => !m.out);
  console.log(`[BOT REPLY HiHiStore /nap]:\n${botReply?.message}`);
  if (botReply?.replyMarkup) {
    for (const row of botReply.replyMarkup.rows) {
      console.log(`  Buttons: ${row.buttons.map(b => `[${b.text} | ${b.data?.toString('utf-8') || b.url}]`).join(" ")}`);
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

  await inspectKhoMMO(client);
  await inspectDShop(client);
  await inspectDKeyShop(client);
  await inspectShopHXN(client);
  await inspectChoDauMoi(client);
  await inspectHiHiStore(client);
}

main().catch(console.error).finally(() => process.exit(0));
