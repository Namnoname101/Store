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
  const botUsername = "shopxoainon_bot";
  const bot = await client.getEntity(botUsername);

  // Send /buy to ensure clean state
  await client.sendMessage(bot, { message: "/buy" });
  await sleep(2000);

  let msgs = await client.getMessages(bot, { limit: 1 });
  let currentMsg = msgs[0];

  // Extract catalog items
  const catalogItems = [];
  for (const row of currentMsg.replyMarkup.rows) {
    for (const btn of row.buttons) {
      const d = btn.data ? btn.data.toString("utf-8") : (btn.url || "");
      if (d.startsWith("product:view:")) {
        catalogItems.push({
          id: d.replace("product:view:", ""),
          title: btn.text,
          inStock: true,
          data: d,
        });
      } else if (d === "noop") {
        catalogItems.push({
          id: null,
          title: btn.text,
          inStock: false,
          data: d,
        });
      }
    }
  }

  console.log(`Found ${catalogItems.length} products in @shopxoainon_bot catalog.`);

  const detailedReport = [];

  for (let i = 0; i < catalogItems.length; i++) {
    const item = catalogItems[i];
    if (!item.inStock) {
      detailedReport.push({
        id: item.id,
        title: item.title,
        inStock: false,
        note: "Hết hàng trên menu chính (data:noop)",
      });
      console.log(`[${i + 1}/${catalogItems.length}] ❌ ${item.title} -> Hết hàng`);
      continue;
    }

    console.log(`\n[${i + 1}/${catalogItems.length}] 🔍 Inspecting ID #${item.id}: ${item.title}`);

    // Re-fetch the latest message to avoid stale references
    msgs = await client.getMessages(bot, { limit: 1 });
    currentMsg = msgs[0];

    // Find the button in currentMsg
    let targetBtn = null;
    if (currentMsg.replyMarkup && currentMsg.replyMarkup.rows) {
      for (const row of currentMsg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const d = btn.data ? btn.data.toString("utf-8") : "";
          if (d === item.data) {
            targetBtn = btn;
            break;
          }
        }
        if (targetBtn) break;
      }
    }

    if (!targetBtn) {
      console.log(`  Button ${item.data} not found on current screen. Sending /buy to refresh...`);
      await client.sendMessage(bot, { message: "/buy" });
      await sleep(2000);
      msgs = await client.getMessages(bot, { limit: 1 });
      currentMsg = msgs[0];
    }

    try {
      await currentMsg.click({ data: Buffer.from(item.data) });
      await sleep(1500);

      msgs = await client.getMessages(bot, { limit: 1 });
      const detailMsg = msgs[0];

      const qtyOptions = [];
      let backBtn = null;

      if (detailMsg.replyMarkup && detailMsg.replyMarkup.rows) {
        for (const row of detailMsg.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : (btn.url || "");
            if (d.startsWith("buyqty:")) {
              qtyOptions.push({ label: btn.text, data: d });
            }
            if (d === "menu:buy" || d.includes("menu:buy") || btn.text.includes("Quay lại")) {
              backBtn = btn;
            }
          }
        }
      }

      // Extract price, stock, balance from detail text
      const text = detailMsg.message || "";
      const priceMatch = text.match(/Giá bán:\s*([^\n]+)/i);
      const stockMatch = text.match(/Tồn kho:\s*([^\n]+)/i);
      const balanceMatch = text.match(/Số dư ví:\s*([^\n]+)/i);
      const idMatch = text.match(/Mã SP:\s*#?(\d+)/i);

      detailedReport.push({
        id: item.id,
        parsedId: idMatch ? idMatch[1] : item.id,
        title: item.title,
        inStock: true,
        priceStr: priceMatch ? priceMatch[1].trim() : "",
        stockStr: stockMatch ? stockMatch[1].trim() : "",
        balanceStr: balanceMatch ? balanceMatch[1].trim() : "",
        availableQuantities: qtyOptions.map(q => q.label),
        detailExcerpt: text.split("\n").slice(0, 8).join(" | "),
      });

      console.log(`  -> Mã: #${idMatch ? idMatch[1] : item.id} | Giá: ${priceMatch ? priceMatch[1] : "?"} | Kho: ${stockMatch ? stockMatch[1] : "?"}`);
      console.log(`  -> Số lượng có thể chọn: ${qtyOptions.map(q => q.label).join(", ")}`);

      // Return to catalog
      if (backBtn) {
        await detailMsg.click({ data: backBtn.data });
        await sleep(1500);
      } else {
        await client.sendMessage(bot, { message: "/buy" });
        await sleep(1500);
      }
    } catch (err) {
      console.error(`  Error inspecting ${item.id}:`, err.message);
      await client.sendMessage(bot, { message: "/buy" });
      await sleep(2000);
    }
  }

  console.log("\n========================================================");
  console.log("✅ ALL PRODUCTS IN @shopxoainon_bot INSPECTED SUCCESSFULLY!");
  console.log("========================================================");

  fs.writeFileSync(
    path.join(__dirname, "xoainon-full-inventory.json"),
    JSON.stringify(detailedReport, null, 2),
    "utf-8"
  );
  console.log("Saved full report to scripts/xoainon-full-inventory.json");
}

main().catch(console.error).finally(() => process.exit(0));
