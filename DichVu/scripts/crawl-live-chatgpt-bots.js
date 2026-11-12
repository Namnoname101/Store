const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeShopXoaiNon(client) {
  console.log("\n=======================================================");
  console.log("🔍 [1/6] Crawling @shopxoainon_bot (Shop Xoài Non)...");
  console.log("=======================================================");
  const results = [];
  try {
    const bot = "shopxoainon_bot";
    await client.sendMessage(bot, { message: "/buy" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];
    if (!msg || !msg.replyMarkup || !msg.replyMarkup.rows) {
      console.log("No reply markup from @shopxoainon_bot");
      return results;
    }

    const gptButtons = [];
    for (const row of msg.replyMarkup.rows) {
      for (const btn of row.buttons) {
        const text = btn.text || "";
        const data = btn.data ? btn.data.toString("utf-8") : "";
        if (/chatgpt|gpt|openai/i.test(text) || /chatgpt|gpt|openai/i.test(data)) {
          gptButtons.push({ text, data });
        }
      }
    }

    console.log(`Found ${gptButtons.length} ChatGPT items in Shop Xoài Non menu:`);
    for (const b of gptButtons) {
      console.log(`- ${b.text} (data: ${b.data})`);
    }

    for (const b of gptButtons) {
      if (b.data === "noop" || b.text.includes("Hết hàng")) {
        results.push({
          bot: "@shopxoainon_bot",
          name: b.text,
          inStock: false,
          stock: 0,
          price: "Hết hàng",
          details: "Hết hàng trên bot",
        });
        continue;
      }

      console.log(`\n👉 Clicking into product: ${b.text}...`);
      msgs = await client.getMessages(bot, { limit: 1 });
      msg = msgs[0];
      try {
        await msg.click({ data: Buffer.from(b.data) });
        await sleep(2500);
        msgs = await client.getMessages(bot, { limit: 1 });
        const detailMsg = msgs[0];
        console.log("Detail Text:\n", detailMsg?.message);
        results.push({
          bot: "@shopxoainon_bot",
          name: b.text,
          inStock: true,
          details: detailMsg?.message || "",
          buttons: detailMsg?.replyMarkup?.rows?.flatMap(r => r.buttons.map(btn => btn.text)) || []
        });

        // Click back to catalog
        const backBtn = detailMsg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(btn => 
          /quay lại|menu|back|danh mục/i.test(btn.text) || btn.data?.toString().includes("back") || btn.data?.toString().includes("menu")
        );
        if (backBtn && backBtn.data) {
          await detailMsg.click({ data: backBtn.data });
          await sleep(1500);
        } else {
          await client.sendMessage(bot, { message: "/buy" });
          await sleep(2000);
        }
      } catch (err) {
        console.error("Error clicking product:", err.message);
      }
    }
  } catch (err) {
    console.error("Error scraping Shop Xoai Non:", err.message);
  }
  return results;
}

async function scrapeDShop(client) {
  console.log("\n=======================================================");
  console.log("🔍 [2/6] Crawling @mmo_dshop_bot (MMO D-Shop)...");
  console.log("=======================================================");
  const results = [];
  try {
    const bot = "mmo_dshop_bot";
    await client.sendMessage(bot, { message: "/start" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];

    // Find buy/shop button
    let buyBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
      const d = b.data ? b.data.toString("utf-8") : "";
      return d === "buy" || /mua|shop/i.test(b.text);
    });

    if (buyBtn && buyBtn.data) {
      console.log(`Clicking ${buyBtn.text}...`);
      await msg.click({ data: buyBtn.data });
      await sleep(2500);
      msgs = await client.getMessages(bot, { limit: 1 });
      msg = msgs[0];
    }

    // Find category for ChatGPT
    console.log("Categories in D-Shop:");
    const catRows = msg?.replyMarkup?.rows || [];
    let chatGptCatBtn = null;
    for (const row of catRows) {
      for (const btn of row.buttons) {
        const text = btn.text || "";
        const data = btn.data ? btn.data.toString("utf-8") : "";
        console.log(`  Cat: [${text}] -> data: "${data}"`);
        if (/chatgpt|gpt|openai/i.test(text) || /cat:4/i.test(data)) {
          chatGptCatBtn = btn;
        }
      }
    }

    if (chatGptCatBtn && chatGptCatBtn.data) {
      console.log(`\n👉 Clicking into ChatGPT Category: [${chatGptCatBtn.text}]...`);
      await msg.click({ data: chatGptCatBtn.data });
      await sleep(2500);
      msgs = await client.getMessages(bot, { limit: 1 });
      const gptListMsg = msgs[0];
      console.log("ChatGPT Products Screen:\n", gptListMsg?.message);

      if (gptListMsg?.replyMarkup?.rows) {
        for (const row of gptListMsg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const text = btn.text || "";
            const data = btn.data ? btn.data.toString("utf-8") : "";
            console.log(`  Product BTN: [${text}] -> "${data}"`);
            if (data && !data.includes("back") && !data.includes("menu")) {
              results.push({
                bot: "@mmo_dshop_bot",
                name: text,
                data: data,
                screenText: gptListMsg.message
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scraping D-Shop:", err.message);
  }
  return results;
}

async function scrapeDKey(client) {
  console.log("\n=======================================================");
  console.log("🔍 [3/6] Crawling @dkeyshop_bot (DKeyShop MMO)...");
  console.log("=======================================================");
  const results = [];
  try {
    const bot = "dkeyshop_bot";
    await client.sendMessage(bot, { message: "/sanpham" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];
    console.log("DKey Reply:\n", msg?.message?.slice(0, 300));

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          if (/chatgpt|gpt|openai/i.test(text) || /chatgpt|gpt|openai/i.test(data)) {
            console.log(`  Found DKey ChatGPT: [${text}] -> "${data}"`);
            results.push({
              bot: "@dkeyshop_bot",
              name: text,
              data: data,
              message: msg.message
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scraping DKey:", err.message);
  }
  return results;
}

async function scrapeKhoMMO(client) {
  console.log("\n=======================================================");
  console.log("🔍 [4/6] Crawling @KhoMMO_Market_bot (Kho MMO Market)...");
  console.log("=======================================================");
  const results = [];
  try {
    const bot = "KhoMMO_Market_bot";
    await client.sendMessage(bot, { message: "/start" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];
    console.log("Kho MMO Reply:\n", msg?.message?.slice(0, 300));

    let shopBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
      const text = b.text || "";
      const d = b.data ? b.data.toString("utf-8") : "";
      return /mua|sản phẩm|shop|kho/i.test(text) || /shop|buy|catalog/i.test(d);
    });

    if (shopBtn && shopBtn.data) {
      console.log(`Clicking KhoMMO [${shopBtn.text}]...`);
      await msg.click({ data: shopBtn.data });
      await sleep(2500);
      msgs = await client.getMessages(bot, { limit: 1 });
      msg = msgs[0];
      console.log("KhoMMO Catalog:\n", msg?.message?.slice(0, 400));
    }

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          if (/chatgpt|gpt|openai/i.test(text) || /chatgpt|gpt|openai/i.test(data)) {
            console.log(`  Found KhoMMO ChatGPT: [${text}] -> "${data}"`);
            results.push({
              bot: "@KhoMMO_Market_bot",
              name: text,
              data: data
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scraping KhoMMO:", err.message);
  }
  return results;
}

async function scrapeNghienTrick(client) {
  console.log("\n=======================================================");
  console.log("🔍 [5/6] Crawling @nghientrickshop_bot (Nghiện Trick)...");
  console.log("=======================================================");
  const results = [];
  try {
    const bot = "nghientrickshop_bot";
    await client.sendMessage(bot, { message: "/start" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];

    let shopBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
      const d = b.data ? b.data.toString("utf-8") : "";
      return d === "menu_shop" || /mua hàng/i.test(b.text);
    });

    if (shopBtn && shopBtn.data) {
      await msg.click({ data: shopBtn.data });
      await sleep(2500);
      msgs = await client.getMessages(bot, { limit: 1 });
      msg = msgs[0];
    }

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          if (/chatgpt|gpt|openai/i.test(text) || /chatgpt|gpt|openai/i.test(data)) {
            console.log(`  Found Nghiên Trick ChatGPT: [${text}] -> "${data}"`);
            results.push({
              bot: "@nghientrickshop_bot",
              name: text,
              data: data
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scraping Nghien Trick:", err.message);
  }
  return results;
}

async function scrapeShopHXN(client) {
  console.log("\n=======================================================");
  console.log("🔍 [6/6] Crawling @ShopHXN_bot (Shop HXN MMO)...");
  console.log("=======================================================");
  const results = [];
  try {
    const bot = "ShopHXN_bot";
    await client.sendMessage(bot, { message: "/sanpham" });
    await sleep(2500);

    let msgs = await client.getMessages(bot, { limit: 1 });
    let msg = msgs[0];
    console.log("HXN Reply:\n", msg?.message?.slice(0, 300));

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const data = btn.data ? btn.data.toString("utf-8") : "";
          if (/chatgpt|gpt|openai/i.test(text) || /chatgpt|gpt|openai/i.test(data)) {
            console.log(`  Found HXN ChatGPT: [${text}] -> "${data}"`);
            results.push({
              bot: "@ShopHXN_bot",
              name: text,
              data: data
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scraping HXN:", err.message);
  }
  return results;
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("✅ Logged in successfully to user's Telegram!");

  const all = {};
  all.xoainon = await scrapeShopXoaiNon(client);
  all.dshop = await scrapeDShop(client);
  all.dkey = await scrapeDKey(client);
  all.khommo = await scrapeKhoMMO(client);
  all.nghientrick = await scrapeNghienTrick(client);
  all.hxn = await scrapeShopHXN(client);

  console.log("\n=======================================================");
  console.log("🎯 CRAWL COMPLETE! SUMMARY OF CHATGPT PRODUCTS:");
  console.log("=======================================================");
  console.log(JSON.stringify(all, null, 2));

  fs.writeFileSync(path.join(__dirname, "chatgpt-bots-crawled.json"), JSON.stringify(all, null, 2), "utf-8");
  await client.disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
