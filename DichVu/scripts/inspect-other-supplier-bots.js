const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const SUPPLIER_BOTS = [
  { code: "NGHIENTRICK_TELE", username: "nghientrickshop_bot" },
  { code: "KHOMMO_TELE", username: "KhoMMO_Market_bot" },
  { code: "DSHOP_TELE", username: "mmo_dshop_bot" },
  { code: "TOKI_TELE", username: "toki_shopmmo_bot" },
  { code: "DKEY_TELE", username: "dkeyshop_bot" },
  { code: "SHOPHXN_TELE", username: "ShopHXN_bot" },
  { code: "CHODAUMOI_TELE", username: "chodaumoi_bot" },
  { code: "HIHISTORE_TELE", username: "hihistorebot" },
];

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  console.log("Connected to Telegram.");

  const botCatalogs = {};

  for (const botInfo of SUPPLIER_BOTS) {
    console.log(`\n======================================================`);
    console.log(`🤖 Inspecting Supplier Bot: @${botInfo.username} (${botInfo.code})`);
    console.log(`======================================================`);

    try {
      const entity = await client.getEntity(botInfo.username);

      // Check last 2 messages
      let msgs = await client.getMessages(entity, { limit: 2 });
      let lastMsg = msgs[0];

      // Send /start or /buy to see main menu
      console.log(`  Sending /start to @${botInfo.username}...`);
      await client.sendMessage(entity, { message: "/start" });
      await sleep(2000);

      msgs = await client.getMessages(entity, { limit: 2 });
      let reply = msgs.find(m => !m.out) || msgs[0];

      const menuButtons = [];
      if (reply?.replyMarkup?.rows) {
        for (const row of reply.replyMarkup.rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? btn.data.toString("utf-8") : (btn.url || "");
            menuButtons.push({ text: btn.text, data: d });
          }
        }
      }

      console.log(`  Main Menu Text:\n  ${reply?.message?.replace(/\n/g, "\n  ")?.slice(0, 300)}...`);
      console.log(`  Main Menu Buttons:`);
      for (const b of menuButtons) {
        console.log(`    [${b.text} | ${b.data}]`);
      }

      // If there is a shop/catalog button, click it to see categories/products
      const shopBtn = menuButtons.find(b => 
        /mua|shop|sản phẩm|store|kho|danh mục/i.test(b.text) ||
        /menu_shop|buy|catalog|category/i.test(b.data)
      );

      let subCategories = [];
      if (shopBtn && shopBtn.data) {
        console.log(`  👉 Clicking shop button: [${shopBtn.text} | ${shopBtn.data}]...`);
        try {
          await reply.click({ data: Buffer.from(shopBtn.data) });
          await sleep(2000);

          msgs = await client.getMessages(entity, { limit: 2 });
          let catReply = msgs.find(m => !m.out) || msgs[0];
          console.log(`  Catalog Screen Text:\n  ${catReply?.message?.replace(/\n/g, "\n  ")?.slice(0, 300)}...`);

          if (catReply?.replyMarkup?.rows) {
            for (const row of catReply.replyMarkup.rows) {
              for (const btn of row.buttons) {
                const d = btn.data ? btn.data.toString("utf-8") : (btn.url || "");
                subCategories.push({ text: btn.text, data: d });
                console.log(`    [${btn.text} | ${d}]`);
              }
            }
          }
        } catch (clickErr) {
          console.warn(`  Could not click shop button:`, clickErr.message);
        }
      }

      botCatalogs[botInfo.username] = {
        code: botInfo.code,
        mainMenuText: reply?.message?.slice(0, 300),
        menuButtons,
        subCategories,
      };
    } catch (err) {
      console.error(`  Error inspecting @${botInfo.username}:`, err.message);
      botCatalogs[botInfo.username] = { error: err.message };
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "other-bots-catalogs.json"),
    JSON.stringify(botCatalogs, null, 2),
    "utf-8"
  );
  console.log("\n✅ ALL SUPPLIER BOTS INSPECTED SAFELY (NO PURCHASES)");
  console.log("Saved report to scripts/other-bots-catalogs.json");
}

main().catch(console.error).finally(() => process.exit(0));
