const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

async function checkApis() {
  console.log("=== 1. KIỂM TRA ADOBE TỪ CÁC ĐỐI TÁC API ===");

  // 1. Canboso (DKey Shop & Shop HXN)
  const canbosoKeys = [
    { name: "DKey Shop (Canboso)", key: "tgb_67d29cc012c999717a1f645ca0fb0079de354bf09d5af05e" },
    { name: "Shop HXN (Canboso)", key: "tgb_8813c30a3c6f232192884ca050d9e5822e8955989ad932f2" },
  ];

  for (const c of canbosoKeys) {
    try {
      const res = await fetch(`https://canboso.com/api/v2/telegram-buyer/products?key=${encodeURIComponent(c.key)}`, {
        headers: { "x-buyer-key": c.key, Accept: "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        const prods = data.products || data.data || [];
        const adobeProds = prods.filter(p => /adobe/i.test(p.name || ""));
        console.log(`[${c.name}] Tổng SP: ${prods.length} | SP Adobe tìm thấy: ${adobeProds.length}`);
        adobeProds.forEach(p => {
          console.log(`  - ${p.name} | Giá: ${p.price?.amount || p.price} | Tồn kho: ${p.availability?.available ?? p.stock ?? "N/A"}`);
        });
      } else {
        console.log(`[${c.name}] HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`[${c.name}] Lỗi: ${e.message}`);
    }
  }

  // 2. DBot (Chợ Đầu Mối)
  try {
    const key = "dbot_ceb5d392136482bef5617717bb099c1f";
    const res = await fetch("https://dbot.pro.vn/public-api/v1/products", {
      headers: { "X-API-Key": key, Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      const prods = data.products || [];
      const adobeProds = prods.filter(p => /adobe/i.test(p.name || ""));
      console.log(`[Chợ Đầu Mối - DBot] Tổng SP: ${prods.length} | SP Adobe tìm thấy: ${adobeProds.length}`);
      adobeProds.forEach(p => {
        console.log(`  - ${p.name} | Giá: ${p.price} | Tồn kho: ${p.stock}`);
      });
    } else {
      console.log(`[Chợ Đầu Mối - DBot] HTTP ${res.status}`);
    }
  } catch (e) {
    console.log(`[Chợ Đầu Mối - DBot] Lỗi: ${e.message}`);
  }

  // 3. Kho MMO Partner API
  try {
    const key = "brk_66ba6f1e26e8df69df2dab56bf7400d3354ceb001d074023";
    const res = await fetch("https://api.khommo.vn/api/partner/v1/products", {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      const prods = data.data?.products || data.data || [];
      const adobeProds = prods.filter(p => /adobe/i.test(p.name || ""));
      console.log(`[Kho MMO Partner API] Tổng SP: ${prods.length} | SP Adobe tìm thấy: ${adobeProds.length}`);
      adobeProds.forEach(p => {
        console.log(`  - ${p.name} (${p.sku}) | Giá: ${p.priceVnd || p.price} | Tồn kho: ${p.stock}`);
      });
    } else {
      console.log(`[Kho MMO Partner API] HTTP ${res.status}`);
    }
  } catch (e) {
    console.log(`[Kho MMO Partner API] Lỗi: ${e.message}`);
  }
}

async function checkTelegramBots() {
  console.log("\n=== 2. KIỂM TRA BOT TELEGRAM CÓ DANH MỤC ADOBE ===");
  const credsPath = path.join(__dirname, "../tele-session.json");
  const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });
  await client.connect();

  // Test dkeyshop_bot
  try {
    console.log("\n-> Đang kiểm tra @dkeyshop_bot danh mục Adobe...");
    await client.sendMessage("dkeyshop_bot", { message: "/products" });
    await new Promise(r => setTimeout(r, 2000));
    let msgs = await client.getMessages("dkeyshop_bot", { limit: 2 });
    let msg = msgs.find(m => !m.out);
    if (msg?.replyMarkup?.rows) {
      let adobeBtn = null;
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const str = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
          if (/adobe/i.test(btn.text) || /adobe/i.test(str)) {
            adobeBtn = btn;
            console.log(`  Tìm thấy nút Adobe: "${btn.text}" -> data: ${str}`);
          }
        }
      }
      if (adobeBtn) {
        await msg.click({ data: adobeBtn.data });
        await new Promise(r => setTimeout(r, 2500));
        const subMsgs = await client.getMessages("dkeyshop_bot", { limit: 2 });
        const subReply = subMsgs.find(m => !m.out);
        console.log("  [Nội dung danh mục Adobe tại @dkeyshop_bot]:\n" + subReply?.message);
        if (subReply?.replyMarkup?.rows) {
          for (const row of subReply.replyMarkup.rows) {
            console.log("   Nút: " + row.buttons.map(b => b.text).join(" | "));
          }
        }
      }
    }
  } catch (e) {
    console.log("Lỗi dkeyshop_bot:", e.message);
  }

  // Test mmo_dshop_bot
  try {
    console.log("\n-> Đang kiểm tra @mmo_dshop_bot danh mục Adobe...");
    await client.sendMessage("mmo_dshop_bot", { message: "/start" });
    await new Promise(r => setTimeout(r, 2000));
    let msgs = await client.getMessages("mmo_dshop_bot", { limit: 2 });
    let msg = msgs.find(m => !m.out);
    if (msg?.replyMarkup?.rows) {
      for (const row of msg.replyMarkup.rows) {
        for (const btn of row.buttons) {
          const str = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
          if (str === "buy") {
            await msg.click({ data: btn.data });
            await new Promise(r => setTimeout(r, 2000));
            break;
          }
        }
      }
      const catMsgs = await client.getMessages("mmo_dshop_bot", { limit: 2 });
      const catReply = catMsgs.find(m => !m.out);
      if (catReply?.replyMarkup?.rows) {
        for (const row of catReply.replyMarkup.rows) {
          for (const btn of row.buttons) {
            if (/adobe/i.test(btn.text)) {
              console.log(`  Tìm thấy nút Adobe: "${btn.text}"`);
              await catReply.click({ data: btn.data });
              await new Promise(r => setTimeout(r, 2500));
              const itemMsgs = await client.getMessages("mmo_dshop_bot", { limit: 2 });
              console.log("  [Sản phẩm Adobe tại @mmo_dshop_bot]:\n" + itemMsgs.find(m => !m.out)?.message);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("Lỗi mmo_dshop_bot:", e.message);
  }
}

async function main() {
  await checkApis();
  await checkTelegramBots();
  console.log("\nHoàn tất kiểm tra Adobe!");
}

main().catch(console.error).finally(() => process.exit(0));
