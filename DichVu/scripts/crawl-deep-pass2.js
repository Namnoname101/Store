const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deepCrawlPass2() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram Userbot.");

  const results = {};

  // 1. Chợ Đầu Mối: Bấm "category|ChatGPT"
  console.log("\n--- Crawling Chợ Đầu Mối: category|ChatGPT ---");
  try {
    const cdm = "chodaumoi_bot";
    const msgs = await client.getMessages(cdm, { limit: 1 });
    let msg = msgs[0];
    const catBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
      const d = b.data ? b.data.toString("utf-8") : "";
      return d === "category|ChatGPT";
    });

    if (catBtn && catBtn.data) {
      console.log("Clicking category|ChatGPT on CDM...");
      await msg.click({ data: catBtn.data });
      await sleep(2500);

      const newMsgs = await client.getMessages(cdm, { limit: 1 });
      const reply = newMsgs[0];
      console.log("CDM ChatGPT Text:\n", reply?.message);
      results.chodaumoi = [];
      if (reply?.replyMarkup?.rows) {
        for (const row of reply.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const text = btn.text || "";
            const d = btn.data ? btn.data.toString("utf-8") : "";
            console.log(`  CDM Item: [${text}] -> "${d}"`);
            if (d && !d.includes("back") && !d.includes("menu")) {
              results.chodaumoi.push({ text, data: d, screen: reply.message });
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("CDM err:", e.message);
  }

  // 2. DKey: Gửi /products
  console.log("\n--- Crawling DKey: /products ---");
  try {
    const dkey = "dkeyshop_bot";
    await client.sendMessage(dkey, { message: "/products" });
    await sleep(2500);

    const msgs = await client.getMessages(dkey, { limit: 1 });
    const msg = msgs[0];
    console.log("DKey /products reply:\n", msg?.message);
    results.dkey = [];
    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const text = btn.text || "";
          const d = btn.data ? btn.data.toString("utf-8") : "";
          console.log(`  DKey Btn: [${text}] -> "${d}"`);
          if (/chatgpt|gpt|openai|ai/i.test(text) || /chatgpt|gpt|openai|ai/i.test(d)) {
            results.dkey.push({ text, data: d, screen: msg.message });
          }
        }
      }
    }
  } catch (e) {
    console.error("DKey err:", e.message);
  }

  // 3. HiHiStore: Bấm cat_view_cat_53b29d0b (AI)
  console.log("\n--- Crawling HiHiStore: AI Category ---");
  try {
    const hihi = "hihistorebot";
    const msgs = await client.getMessages(hihi, { limit: 1 });
    let msg = msgs[0];
    const aiBtn = msg?.replyMarkup?.rows?.flatMap(r => r.buttons).find(b => {
      const d = b.data ? b.data.toString("utf-8") : "";
      return d === "cat_view_cat_53b29d0b";
    });

    if (aiBtn && aiBtn.data) {
      console.log("Clicking cat_view_cat_53b29d0b on HiHiStore...");
      await msg.click({ data: aiBtn.data });
      await sleep(2500);

      const newMsgs = await client.getMessages(hihi, { limit: 1 });
      const reply = newMsgs[0];
      console.log("HiHiStore AI Products Text:\n", reply?.message);
      results.hihistore = [];
      if (reply?.replyMarkup?.rows) {
        for (const row of reply.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const text = btn.text || "";
            const d = btn.data ? btn.data.toString("utf-8") : "";
            console.log(`  HiHi Item: [${text}] -> "${d}"`);
            if (d && !d.includes("back") && !d.includes("cat_view_")) {
              results.hihistore.push({ text, data: d, screen: reply.message });
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("HiHi err:", e.message);
  }

  fs.writeFileSync(path.join(__dirname, "chatgpt-pass2-results.json"), JSON.stringify(results, null, 2), "utf-8");
  console.log("Pass 2 saved to scripts/chatgpt-pass2-results.json");
  await client.disconnect();
}

deepCrawlPass2().catch(console.error).finally(() => process.exit(0));
