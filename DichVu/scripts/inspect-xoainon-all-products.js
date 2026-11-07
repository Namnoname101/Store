const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram userbot.");
  const botUsername = "shopxoainon_bot";
  const bot = await client.getEntity(botUsername);

  // 1. Send /buy to get catalog
  console.log("Sending /buy to @shopxoainon_bot...");
  await client.sendMessage(bot, { message: "/buy" });
  await sleep(2000);

  let msgs = await client.getMessages(bot, { limit: 1 });
  let msg = msgs[0];
  if (!msg || !msg.replyMarkup || !msg.replyMarkup.rows) {
    console.error("No reply markup received from /buy");
    return;
  }

  // Extract all product buttons
  const productButtons = [];
  for (const row of msg.replyMarkup.rows) {
    for (const btn of row.buttons) {
      const dataStr = btn.data ? btn.data.toString("utf-8") : "";
      if (dataStr.startsWith("product:view:")) {
        const id = dataStr.replace("product:view:", "");
        productButtons.push({
          id,
          text: btn.text,
          dataStr,
        });
      } else if (dataStr === "noop") {
        productButtons.push({
          id: "OUT_OF_STOCK",
          text: btn.text,
          dataStr,
        });
      }
    }
  }

  console.log(`\n=== FOUND ${productButtons.length} PRODUCTS IN @shopxoainon_bot CATALOG ===\n`);
  for (const p of productButtons) {
    console.log(`- [${p.id}] ${p.text} (data: ${p.dataStr})`);
  }

  const results = [];

  // 2. Iterate each product that is in stock
  for (const p of productButtons) {
    if (p.id === "OUT_OF_STOCK" || p.dataStr === "noop") {
      console.log(`\n⏩ Skipping OUT OF STOCK item: ${p.text}`);
      results.push({
        id: p.id,
        name: p.text,
        inStock: false,
        details: "Hết hàng",
        quantityButtons: [],
      });
      continue;
    }

    console.log(`\n======================================================`);
    console.log(`🔍 Inspecting Product ID: ${p.id} | ${p.text}`);
    console.log(`Clicking data: ${p.dataStr}...`);

    // Fetch the latest message again
    msgs = await client.getMessages(bot, { limit: 1 });
    msg = msgs[0];

    // Click into product
    try {
      await msg.click({ data: Buffer.from(p.dataStr) });
    } catch (err) {
      console.error(`Error clicking into product ${p.id}:`, err.message);
      continue;
    }

    await sleep(2000);
    msgs = await client.getMessages(bot, { limit: 1 });
    const detailMsg = msgs[0];

    const detailText = detailMsg?.message || "";
    console.log(`Detail Text:\n${detailText}\n`);

    const qtyButtons = [];
    let backBtnData = "menu:buy";

    if (detailMsg?.replyMarkup && detailMsg.replyMarkup.rows) {
      console.log("Buttons on detail screen:");
      for (const row of detailMsg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const bData = btn.data ? btn.data.toString("utf-8") : (btn.url || "");
          console.log(`  [${btn.text} | data: ${bData}]`);

          if (bData.startsWith("buyqty:")) {
            qtyButtons.push({ text: btn.text, data: bData });
          }
          if (bData.includes("menu:buy") || bData.includes("menu:home") || btn.text.includes("Quay lại")) {
            backBtnData = bData;
          }
        }
      }
    }

    // Now test clicking quantity button (e.g. buyqty:<id>:1) if present to see payment screen
    // SAFETY CHECK: WE DO NOT CLICK ANY PAYMENT BUTTON!
    let paymentScreenButtons = [];
    if (qtyButtons.length > 0) {
      const q1 = qtyButtons.find(q => q.data === `buyqty:${p.id}:1`) || qtyButtons[0];
      console.log(`  👉 Clicking quantity button: [${q1.text} | data: ${q1.data}] to inspect checkout screen...`);
      try {
        await detailMsg.click({ data: Buffer.from(q1.data) });
        await sleep(2000);

        msgs = await client.getMessages(bot, { limit: 1 });
        const checkoutMsg = msgs[0];
        console.log(`  Checkout Screen Text:\n  ${checkoutMsg?.message?.replace(/\n/g, "\n  ")}`);

        if (checkoutMsg?.replyMarkup && checkoutMsg.replyMarkup.rows) {
          console.log("  Checkout Screen Buttons (SAFETY: WILL NOT CLICK PAY):");
          for (const row of checkoutMsg.replyMarkup.rows) {
            for (const btn of row.buttons) {
              const bData = btn.data ? btn.data.toString("utf-8") : (btn.url || "");
              console.log(`    [${btn.text} | data: ${bData}]`);
              paymentScreenButtons.push({ text: btn.text, data: bData });
              if (bData.includes("menu:buy") || bData.includes("product:view") || btn.text.includes("Quay lại")) {
                backBtnData = bData;
              }
            }
          }
        }

        // Return back to product detail or catalog
        console.log(`  🔙 Returning back using data: ${backBtnData || "menu:buy"}...`);
        await checkoutMsg.click({ data: Buffer.from(backBtnData || "menu:buy") });
        await sleep(1500);
      } catch (err) {
        console.warn(`  Warning during qty click for product ${p.id}:`, err.message);
      }
    }

    // Make sure we are back at the catalog
    msgs = await client.getMessages(bot, { limit: 1 });
    msg = msgs[0];
    const isCatalog = msg?.replyMarkup?.rows?.some(r => r.buttons?.some(b => {
      const d = b.data ? b.data.toString("utf-8") : "";
      return d.startsWith("product:view:");
    }));

    if (!isCatalog) {
      console.log("  Not at catalog, sending /buy again to reset...");
      await client.sendMessage(bot, { message: "/buy" });
      await sleep(2000);
    }

    results.push({
      id: p.id,
      name: p.text,
      inStock: true,
      detailText: detailText.slice(0, 200),
      qtyButtons,
      paymentScreenButtons,
    });
  }

  console.log("\n======================================================");
  console.log("✅ FINISHED INSPECTING ALL PRODUCTS SAFELY (NO PURCHASE MADE)");
  console.log("======================================================\n");

  fs.writeFileSync(
    path.join(__dirname, "xoainon-all-products-report.json"),
    JSON.stringify(results, null, 2),
    "utf-8"
  );
  console.log("Report saved to scripts/xoainon-all-products-report.json");
}

main().catch(console.error).finally(() => process.exit(0));
