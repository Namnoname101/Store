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
  console.log("Connected to Telegram.");

  const allOpportunities = [];

  // 1. Scan @shopxoainon_bot
  console.log("\n=== 1. SCANNING @shopxoainon_bot ===");
  try {
    const bot = await client.getEntity("shopxoainon_bot");
    await client.sendMessage(bot, { message: "/buy" });
    await sleep(2000);
    const msgs = await client.getMessages(bot, { limit: 1 });
    const msg = msgs[0];
    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const d = btn.data ? btn.data.toString("utf-8") : "";
          const text = btn.text || "";
          if (d.startsWith("product:view:")) {
            const id = d.replace("product:view:", "");
            allOpportunities.push({
              supplier: "Shop Xoài Non (@shopxoainon_bot)",
              supplierCode: "XOAINON_TELE",
              id,
              rawText: text,
              inStock: !text.includes("Hết hàng"),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scanning Xoai Non:", err.message);
  }

  // 2. Scan @mmo_dshop_bot categories
  console.log("\n=== 2. SCANNING @mmo_dshop_bot ===");
  try {
    const dshop = await client.getEntity("mmo_dshop_bot");
    await client.sendMessage(dshop, { message: "/start" });
    await sleep(2000);
    let msgs = await client.getMessages(dshop, { limit: 1 });
    let msg = msgs[0];

    // Find "buy" button
    let buyBtn = null;
    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const d = btn.data ? btn.data.toString("utf-8") : "";
          if (d === "buy" || /shop/i.test(btn.text)) {
            buyBtn = btn;
            break;
          }
        }
      }
    }

    if (buyBtn) {
      await msg.click({ data: buyBtn.data });
      await sleep(2000);
      msgs = await client.getMessages(dshop, { limit: 1 });
      msg = msgs[0];

      if (msg?.replyMarkup?.rows) {
        for (const row of msg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : "";
            const text = btn.text || "";
            if (d.startsWith("cat:")) {
              allOpportunities.push({
                supplier: "MMO D-Shop (@mmo_dshop_bot)",
                supplierCode: "DSHOP_TELE",
                id: d,
                rawText: text,
                inStock: !text.includes("Stock: 0"),
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scanning D-Shop:", err.message);
  }

  // 3. Scan @hihistorebot categories & products
  console.log("\n=== 3. SCANNING @hihistorebot ===");
  try {
    const hihi = await client.getEntity("hihistorebot");
    await client.sendMessage(hihi, { message: "/sanpham" });
    await sleep(2000);
    let msgs = await client.getMessages(hihi, { limit: 1 });
    let msg = msgs[0];

    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const d = btn.data ? btn.data.toString("utf-8") : "";
          const text = btn.text || "";
          if (d.startsWith("cat_view_") || d.startsWith("product_id::")) {
            allOpportunities.push({
              supplier: "PQV Store (@hihistorebot)",
              supplierCode: "HIHISTORE_TELE",
              id: d,
              rawText: text,
              inStock: !text.includes("(0)"),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scanning hihistore:", err.message);
  }

  // 4. Scan @nghientrickshop_bot
  console.log("\n=== 4. SCANNING @nghientrickshop_bot ===");
  try {
    const trick = await client.getEntity("nghientrickshop_bot");
    await client.sendMessage(trick, { message: "/start" });
    await sleep(2000);
    let msgs = await client.getMessages(trick, { limit: 1 });
    let msg = msgs[0];

    let shopBtn = null;
    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const d = btn.data ? btn.data.toString("utf-8") : "";
          if (d === "menu_shop" || /mua hàng/i.test(btn.text)) {
            shopBtn = btn;
            break;
          }
        }
      }
    }

    if (shopBtn) {
      await msg.click({ data: shopBtn.data });
      await sleep(2000);
      msgs = await client.getMessages(trick, { limit: 1 });
      msg = msgs[0];

      if (msg?.replyMarkup?.rows) {
        for (const row of msg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : "";
            const text = btn.text || "";
            if (d.startsWith("shopcat_") || d.startsWith("prod_")) {
              allOpportunities.push({
                supplier: "Nghiện Trick (@nghientrickshop_bot)",
                supplierCode: "NGHIENTRICK_TELE",
                id: d,
                rawText: text,
                inStock: !text.includes("Hết hàng"),
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error scanning Nghien Trick:", err.message);
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL FOUND: ${allOpportunities.length} raw supplier catalog items`);
  console.log(`======================================================\n`);

  fs.writeFileSync(
    path.join(__dirname, "suppliers-scan-summary.json"),
    JSON.stringify(allOpportunities, null, 2),
    "utf-8"
  );
  console.log("Saved to scripts/suppliers-scan-summary.json");
}

main().catch(console.error).finally(() => process.exit(0));
