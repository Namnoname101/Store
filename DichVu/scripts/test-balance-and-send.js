/**
 * Test: Gọi API balance cho XOAINON_TELE, in kết quả, rồi gửi vào Telegram admin
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BOT_TOKEN = process.env.TELEGRAM_ASSISTANT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
// Try local first, then production
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const CRON_SECRET = process.env.CRON_SECRET || "daemon-internal-khodee-2024";

async function sendTelegram(text) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.log("[NO TOKEN/CHATID - skip Telegram send]");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
  });
  const data = await res.json();
  console.log("Telegram send result:", data.ok, data.description || "");
}

async function checkOneSupplier(code) {
  const sup = await prisma.supplier.findFirst({ where: { code } });
  if (!sup) { console.error(`Supplier ${code} not found`); return; }

  console.log(`\n=== ${sup.name} (${sup.code}) ===`);
  console.log(`  DB balance trước: ${sup.currentBalance}đ`);
  console.log(`  APP_URL: ${APP_URL}`);
  console.log(`  Calling: POST ${APP_URL}/api/admin/suppliers/${sup.id}/balance`);

  try {
    const res = await fetch(`${APP_URL}/api/admin/suppliers/${sup.id}/balance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": CRON_SECRET,
      },
    });
    const text = await res.text();
    console.log(`  HTTP ${res.status}: ${text}`);
    if (res.ok) {
      const data = JSON.parse(text);
      console.log(`  ✅ Balance mới: ${data.balance}đ`);
      return data.balance;
    } else {
      console.error(`  ❌ API error: ${text}`);
    }
  } catch (err) {
    console.error(`  ❌ fetch error: ${err.message}`);
  }
  return null;
}

async function main() {
  // Check tất cả Telegram suppliers
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true, type: "TELEGRAM_BOT" },
    orderBy: { code: "asc" },
  });

  console.log(`Found ${suppliers.length} Telegram Bot suppliers`);
  console.log(`APP_URL: ${APP_URL}`);
  console.log(`BOT_TOKEN: ${BOT_TOKEN ? "SET (len=" + BOT_TOKEN.length + ")" : "NOT SET"}`);
  console.log(`ADMIN_CHAT_ID: ${ADMIN_CHAT_ID}`);

  let report = "🔍 <b>TEST SỐ DƯ THỰC TẾ:</b>\n\n";

  for (const sup of suppliers) {
    console.log(`\n--- ${sup.code} ---`);
    const dbBal = sup.currentBalance || 0;
    console.log(`  DB balance: ${dbBal}đ`);

    let freshBal = null;
    try {
      const res = await fetch(`${APP_URL}/api/admin/suppliers/${sup.id}/balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": CRON_SECRET,
        },
      });
      const text = await res.text();
      console.log(`  HTTP ${res.status}: ${text.slice(0, 150)}`);
      if (res.ok) {
        const data = JSON.parse(text);
        freshBal = data.balance;
        console.log(`  ✅ Fresh balance: ${freshBal}đ`);
      } else {
        console.log(`  ❌ Error: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`  ❌ fetch failed: ${err.message}`);
    }

    report += `${sup.name} (<code>${sup.code}</code>)\n`;
    report += `  DB cũ: <b>${dbBal.toLocaleString("vi-VN")}đ</b>\n`;
    if (freshBal !== null) {
      report += `  Thực tế: <b>${freshBal.toLocaleString("vi-VN")}đ</b> ✅\n`;
    } else {
      report += `  Thực tế: <i>Lỗi lấy balance</i> ❌\n`;
    }
    report += "\n";

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n\n=== SENDING TO TELEGRAM ===");
  await sendTelegram(report);
  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)));
