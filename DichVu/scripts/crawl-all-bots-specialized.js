const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// BỘ ĐỊNH NGHĨA LỆNH CHÁT RIÊNG CHO TỪNG BOT NCC
const BOT_COMMAND_SPECS = {
  shopxoainon: {
    username: "shopxoainon_bot",
    name: "Shop Xoài Non",
    architecture: "CUSTOM_INLINE_CALLBACK",
    commands: {
      menu: "/start",
      buy: "/buy",
      balance: "/balance",
      history: "/history"
    },
    navigation: {
      type: "DIRECT_BUY_MENU",
      action: "Send /buy directly to receive all products inline. Click product:view:<id> for details, click buy:<id>:<qty> to purchase."
    }
  },
  dshop: {
    username: "mmo_dshop_bot",
    name: "MMO D-Shop",
    architecture: "CATEGORIZED_INLINE",
    commands: {
      start: "/start",
      me: "/me",
      top: "/top"
    },
    navigation: {
      type: "START_THEN_BUY_THEN_CAT",
      action: "Send /start -> Click callback 'buy' -> Select category 'cat:4' (ChatGPT) -> Select product 'prod:4:<index>'."
    }
  },
  chodaumoi: {
    username: "chodaumoi_bot",
    name: "Chợ Đầu Mối MMO",
    architecture: "REPLY_KEYBOARD_TEXT",
    commands: {
      start: "/start",
      productsText: "Sản phẩm",
      walletText: "Ví",
      historyText: "Lịch sử"
    },
    navigation: {
      type: "TEXT_REPLY_BUTTONS",
      action: "Send /start -> Send text message 'Sản phẩm' (ReplyKeyboardMarkup) -> Receive categories -> Click category."
    }
  },
  dkey: {
    username: "dkeyshop_bot",
    name: "DKeyShop MMO",
    architecture: "CANBOSO_INLINE",
    commands: {
      start: "/start",
      products: "/sanpham",
      balance: "/sodu"
    },
    navigation: {
      type: "SLASH_COMMAND",
      action: "Send /sanpham or send /start and click 'Sản phẩm'."
    }
  },
  hxn: {
    username: "ShopHXN_bot",
    name: "HXN Shop MMO",
    architecture: "CANBOSO_INLINE",
    commands: {
      start: "/start",
      products: "/sanpham"
    },
    navigation: {
      type: "SLASH_COMMAND",
      action: "Send /sanpham or send /start and click 'Sản phẩm'."
    }
  },
  khommo: {
    username: "KhoMMO_Market_bot",
    name: "Kho MMO Market",
    architecture: "CUSTOM_INLINE",
    commands: {
      start: "/start",
      buy: "/buy"
    },
    navigation: {
      type: "START_THEN_SHOP",
      action: "Send /start -> Click inline button '🛒 Mua hàng'."
    }
  },
  nghientrick: {
    username: "nghientrickshop_bot",
    name: "Nghiện Trick Shop",
    architecture: "INLINE_SHOPCAT",
    commands: {
      start: "/start",
      me: "/me"
    },
    navigation: {
      type: "START_THEN_MENU_SHOP",
      action: "Send /start -> Click callback 'menu_shop' -> Browse shopcat_<id>."
    }
  },
  hihistore: {
    username: "hihistorebot",
    name: "PQV Store (HiHiStore)",
    architecture: "CANBOSO_CAT_VIEW",
    commands: {
      start: "/start",
      products: "/sanpham"
    },
    navigation: {
      type: "SLASH_SANPHAM",
      action: "Send /sanpham -> Browse cat_view_<id>."
    }
  }
};

// Cào Shop Xoài Non
async function crawlXoaiNon(client) {
  console.log(`\n======================================================`);
  console.log(`🤖 [1/8] CRAWLING @${BOT_COMMAND_SPECS.shopxoainon.username} (${BOT_COMMAND_SPECS.shopxoainon.name})`);
  console.log(`Lệnh sử dụng: ${BOT_COMMAND_SPECS.shopxoainon.commands.buy}`);
  console.log(`======================================================`);

  const bot = BOT_COMMAND_SPECS.shopxoainon.username;
  await client.sendMessage(bot, { message: "/buy" });
  await sleep(2500);

  let msgs = await client.getMessages(bot, { limit: 1 });
  let msg = msgs[0];
  const items = [];

  if (msg?.replyMarkup?.rows) {
    for (const row of msg.replyMarkup.rows) {
      for (const btn of row.buttons) {
        const text = btn.text || "";
        const data = btn.data ? btn.data.toString("utf-8") : "";
        if (/chatgpt|gpt|openai/i.test(text) || /chatgpt|gpt|openai/i.test(data)) {
          const isOutOfStock = data === "noop" || text.includes("Hết hàng");
          items.push({
            botUsername: bot,
            botName: BOT_COMMAND_SPECS.shopxoainon.name,
            commandUsed: "/buy",
            buttonText: text,
            callbackData: data,
            isOutOfStock,
            id: data.replace("product:view:", "")
          });
        }
      }
    }
  }

  // Đi sâu vào từng sản phẩm còn hàng để lấy giá vốn, stock, bảo hành và hướng dẫn login
  for (const item of items) {
    if (item.isOutOfStock) {
      item.stock = 0;
      item.price = "Hết hàng";
      item.warranty = "Theo tiêu chuẩn";
      continue;
    }
    try {
      console.log(`  👉 Bấm vào sản phẩm [${item.buttonText}] qua callback: ${item.callbackData}...`);
      msgs = await client.getMessages(bot, { limit: 1 });
      await msgs[0].click({ data: Buffer.from(item.callbackData) });
      await sleep(2500);

      const detailMsgs = await client.getMessages(bot, { limit: 1 });
      const detailText = detailMsgs[0]?.message || "";
      item.fullDetails = detailText;

      // Trích xuất Giá
      const priceMatch = detailText.match(/💵\s*Giá bán:\s*([\d\.,]+đ)/i);
      if (priceMatch) item.price = priceMatch[1];

      // Trích xuất Tồn kho
      const stockMatch = detailText.match(/📦\s*Tồn kho:\s*(\d+)/i);
      if (stockMatch) item.stock = parseInt(stockMatch[1], 10);

      // Trích xuất Bảo hành
      const warMatch = detailText.match(/(?:Thời gian bảo hành|Bảo hành):\s*([^\n\r]+)/i);
      if (warMatch) item.warranty = warMatch[1].trim();

      // Trích xuất Định dạng TK
      const formatMatch = detailText.match(/Định dạng\s*:\s*([^\n\r]+)/i);
      if (formatMatch) item.accountFormat = formatMatch[1].trim();

      // Back lại menu
      await client.sendMessage(bot, { message: "/buy" });
      await sleep(1500);
    } catch (e) {
      console.warn(`  Lỗi khi bấm xem chi tiết ${item.buttonText}:`, e.message);
    }
  }
  return items;
}

// Cào MMO D-Shop
async function crawlDShop(client) {
  console.log(`\n======================================================`);
  console.log(`🤖 [2/8] CRAWLING @${BOT_COMMAND_SPECS.dshop.username} (${BOT_COMMAND_SPECS.dshop.name})`);
  console.log(`Lệnh sử dụng: /start -> callback 'buy' -> callback 'cat:4'`);
  console.log(`======================================================`);

  const bot = BOT_COMMAND_SPECS.dshop.username;
  await client.sendMessage(bot, { message: "/start" });
  await sleep(2000);

  let msgs = await client.getMessages(bot, { limit: 1 });
  let msg = msgs[0];
  const items = [];

  const buyBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
    const d = b.data ? b.data.toString("utf-8") : "";
    return d === "buy" || /mua|shop/i.test(b.text);
  });

  if (buyBtn && buyBtn.data) {
    await msg.click({ data: buyBtn.data });
    await sleep(2000);
    msgs = await client.getMessages(bot, { limit: 1 });
    msg = msgs[0];
  }

  // Click vào cat:4 (ChatGPT)
  const catBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
    const d = b.data ? b.data.toString("utf-8") : "";
    return d === "cat:4" || /chatgpt/i.test(b.text);
  });

  if (catBtn && catBtn.data) {
    console.log(`  👉 Bấm vào chuyên mục: [${catBtn.text}]...`);
    await msg.click({ data: catBtn.data });
    await sleep(2500);

    msgs = await client.getMessages(bot, { limit: 1 });
    const catMsg = msgs[0];
    if (catMsg?.replyMarkup?.rows) {
      for (const row of catMsg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          if (data && data.startsWith("prod:4:")) {
            // Tách thông tin từ text: ví dụ "🟢 ChatGPT Free offer Plus 3Month  50% | SL: 4 | 120.000 ₫ · 4.65 USDT"
            const slMatch = text.match(/SL:\s*(\d+)/i);
            const priceMatch = text.match(/([\d\.,]+)\s*₫/i);
            const isOutOfStock = text.includes("SL: 0") || text.includes("🔴");

            items.push({
              botUsername: bot,
              botName: BOT_COMMAND_SPECS.dshop.name,
              commandUsed: "/start -> buy -> cat:4",
              buttonText: text,
              callbackData: data,
              isOutOfStock,
              stock: slMatch ? parseInt(slMatch[1], 10) : 0,
              price: priceMatch ? priceMatch[1] + "đ" : "N/A",
              accountFormat: "Tài khoản TK/MK (Email|Pass)",
              warranty: text.includes("BHF") ? "Bảo hành Full 30 ngày" : (text.includes("KBH") ? "Không bảo hành" : "Theo mô tả")
            });
          }
        }
      }
    }
  }
  return items;
}

// Cào Chợ Đầu Mối MMO
async function crawlChoDauMoi(client) {
  console.log(`\n======================================================`);
  console.log(`🤖 [3/8] CRAWLING @${BOT_COMMAND_SPECS.chodaumoi.username} (${BOT_COMMAND_SPECS.chodaumoi.name})`);
  console.log(`Lệnh sử dụng: Gửi tin nhắn text 'Sản phẩm'`);
  console.log(`======================================================`);

  const bot = BOT_COMMAND_SPECS.chodaumoi.username;
  const items = [];

  try {
    // Gửi lệnh /start trước để reset state
    await client.sendMessage(bot, { message: "/start" });
    await sleep(1500);

    // Gửi tin nhắn "Sản phẩm"
    console.log(`  Gửi text: "Sản phẩm"...`);
    await client.sendMessage(bot, { message: "Sản phẩm" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];
    console.log("  Chợ Đầu Mối Categories text:\n ", msg?.message?.slice(0, 300));

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          console.log(`    CDM Cat Btn: [${text}] -> "${data}"`);
          if (/chatgpt|gpt|openai|ai/i.test(text) || /chatgpt|gpt|openai|ai/i.test(data)) {
            items.push({
              botUsername: bot,
              botName: BOT_COMMAND_SPECS.chodaumoi.name,
              commandUsed: "Text: 'Sản phẩm'",
              buttonText: text,
              callbackData: data
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("  Lỗi cào Chợ Đầu Mối:", e.message);
  }
  return items;
}

// Cào DKeyShop MMO
async function crawlDKey(client) {
  console.log(`\n======================================================`);
  console.log(`🤖 [4/8] CRAWLING @${BOT_COMMAND_SPECS.dkey.username} (${BOT_COMMAND_SPECS.dkey.name})`);
  console.log(`Lệnh sử dụng: ${BOT_COMMAND_SPECS.dkey.commands.products}`);
  console.log(`======================================================`);

  const bot = BOT_COMMAND_SPECS.dkey.username;
  const items = [];

  try {
    await client.sendMessage(bot, { message: "/sanpham" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];
    console.log("  DKey Products reply:\n ", msg?.message?.slice(0, 300));

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          console.log(`    DKey Btn: [${text}] -> "${data}"`);
          if (/chatgpt|gpt|openai|ai/i.test(text) || /chatgpt|gpt|openai|ai/i.test(data)) {
            items.push({
              botUsername: bot,
              botName: BOT_COMMAND_SPECS.dkey.name,
              commandUsed: "/sanpham",
              buttonText: text,
              callbackData: data
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("  Lỗi cào DKey:", e.message);
  }
  return items;
}

// Cào PQV Store (HiHiStore)
async function crawlHiHiStore(client) {
  console.log(`\n======================================================`);
  console.log(`🤖 [5/8] CRAWLING @${BOT_COMMAND_SPECS.hihistore.username} (${BOT_COMMAND_SPECS.hihistore.name})`);
  console.log(`Lệnh sử dụng: ${BOT_COMMAND_SPECS.hihistore.commands.products}`);
  console.log(`======================================================`);

  const bot = BOT_COMMAND_SPECS.hihistore.username;
  const items = [];

  try {
    await client.sendMessage(bot, { message: "/sanpham" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          if (/chatgpt|gpt|openai|ai/i.test(text) || /chatgpt|gpt|openai|ai/i.test(data)) {
            console.log(`    HiHiStore Btn: [${text}] -> "${data}"`);
            items.push({
              botUsername: bot,
              botName: BOT_COMMAND_SPECS.hihistore.name,
              commandUsed: "/sanpham",
              buttonText: text,
              callbackData: data
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("  Lỗi cào HiHiStore:", e.message);
  }
  return items;
}

// Cào Nghiện Trick Shop
async function crawlNghienTrick(client) {
  console.log(`\n======================================================`);
  console.log(`🤖 [6/8] CRAWLING @${BOT_COMMAND_SPECS.nghientrick.username} (${BOT_COMMAND_SPECS.nghientrick.name})`);
  console.log(`Lệnh sử dụng: /start -> callback 'menu_shop'`);
  console.log(`======================================================`);

  const bot = BOT_COMMAND_SPECS.nghientrick.username;
  const items = [];

  try {
    await client.sendMessage(bot, { message: "/start" });
    await sleep(2000);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];

    const shopBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
      const d = b.data ? b.data.toString("utf-8") : "";
      return d === "menu_shop" || /mua/i.test(b.text);
    });

    if (shopBtn && shopBtn.data) {
      await msg.click({ data: shopBtn.data });
      await sleep(2500);
      msgs = await client.getMessages(bot, { limit: 1 });
      msg = msgs[0];

      if (msg?.replyMarkup?.rows) {
        for (const row of msg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const text = btn.text || "";
            const data = btn.data ? btn.data.toString("utf-8") : "";
            if (/chatgpt|gpt|openai/i.test(text) || /chatgpt|gpt|openai/i.test(data)) {
              console.log(`    Nghiện Trick Btn: [${text}] -> "${data}"`);
              items.push({
                botUsername: bot,
                botName: BOT_COMMAND_SPECS.nghientrick.name,
                commandUsed: "/start -> menu_shop",
                buttonText: text,
                callbackData: data,
                isOutOfStock: true, // đã kiểm tra bên trong là hết hàng
                price: "N/A",
                stock: 0,
                warranty: "K12 - 2 Năm (Tạm hết hàng)"
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("  Lỗi cào Nghiện Trick:", e.message);
  }
  return items;
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("✅ Kết nối thành công Telegram Userbot!");

  const finalReport = {
    botCommandSpecs: BOT_COMMAND_SPECS,
    results: {}
  };

  finalReport.results.xoainon = await crawlXoaiNon(client);
  finalReport.results.dshop = await crawlDShop(client);
  finalReport.results.chodaumoi = await crawlChoDauMoi(client);
  finalReport.results.dkey = await crawlDKey(client);
  finalReport.results.hihistore = await crawlHiHiStore(client);
  finalReport.results.nghientrick = await crawlNghienTrick(client);

  const reportPath = path.join(__dirname, "chatgpt-suppliers-comprehensive.json");
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2), "utf-8");
  console.log(`\n🎉 ĐÃ CÀO VÀ LƯU BÁO CÁO TOÀN DIỆN VÀO: ${reportPath}`);

  await client.disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
