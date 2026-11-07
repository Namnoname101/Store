// 24/7 Telegram Admin Assistant Daemon
// Operates 24/7 on Fly.io production server ($0 additional cost)
// Usage: node scripts/telegram-assistant-daemon.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BOT_TOKEN = process.env.TELEGRAM_ASSISTANT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
// Internal API base URL – same host as the Next.js app
const APP_INTERNAL_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
// Secret header for bypassing admin auth on internal API calls
const CRON_SECRET = process.env.CRON_SECRET || "";

if (!BOT_TOKEN) {
  console.warn("[AssistantDaemon] TELEGRAM_ASSISTANT_BOT_TOKEN not provided. Assistant daemon disabled.");
  process.exit(0);
}

const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function callTelegram(method, body) {
  try {
    const res = await fetch(`${BASE_URL}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!result.ok) {
      console.warn(`[AssistantDaemon] Telegram API warning on ${method}:`, result.description || result);
    }
    return result;
  } catch (err) {
    console.warn(`[AssistantDaemon] Telegram API network error on ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

async function sendMessage(chatId, text, replyMarkup) {
  const res = await callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });

  // Fallback to plain text if HTML entity parsing failed
  if (!res.ok && typeof res.description === "string" && res.description.includes("can't parse entities")) {
    console.warn("[AssistantDaemon] Retrying sendMessage without HTML parse_mode due to entity parsing error...");
    return callTelegram("sendMessage", {
      chat_id: chatId,
      text: text.replace(/<[^>]*>/g, ""),
      disable_web_page_preview: true,
      reply_markup: replyMarkup,
    });
  }

  return res;
}

async function editMessageText(chatId, messageId, text, replyMarkup) {
  const res = await callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });

  if (!res.ok && typeof res.description === "string") {
    if (res.description.includes("message is not modified")) {
      return { ok: true };
    }
    if (res.description.includes("can't parse entities")) {
      console.warn("[AssistantDaemon] Retrying editMessageText without HTML parse_mode...");
      return callTelegram("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: text.replace(/<[^>]*>/g, ""),
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      });
    }
  }

  return res;
}

async function answerCallbackQuery(callbackQueryId, text) {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}
async function sendPhoto(chatId, buffer, filename, caption, replyMarkup) {
  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
    formData.append("photo", blob, filename || "vietqr.png");
    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");
    }
    if (replyMarkup) {
      formData.append("reply_markup", JSON.stringify(replyMarkup));
    }
    const res = await fetch(`${BASE_URL}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
    return await res.json();
  } catch (err) {
    console.warn("[AssistantDaemon] Telegram API error on sendPhoto:", err.message);
    return { ok: false, error: err.message };
  }
}

async function generateVietQR(bankId, accountNo, accountName, amount, addInfo) {
  try {
    const res = await fetch("https://api.vietqr.io/v2/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountNo,
        accountName,
        acqId: bankId,
        amount: amount > 0 ? amount : undefined,
        addInfo,
        format: "text",
        template: "compact2",
      }),
    });
    const data = await res.json();
    if (data?.code === "00" && data.data?.qrDataURL) {
      const b64 = data.data.qrDataURL.replace(/^data:image\/\w+;base64,/, "");
      return Buffer.from(b64, "base64");
    }
  } catch (err) {
    console.warn("[AssistantDaemon] VietQR error:", err.message);
  }
  return null;
}


function getMainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📦 Kho & Tồn kho", callback_data: "cmd:stock" },
        { text: "💰 Doanh thu hôm nay", callback_data: "cmd:revenue_today" },
      ],
      [
        { text: "📊 Doanh thu 7 ngày", callback_data: "cmd:revenue_week" },
        { text: "⚡ Sync Nhà cung cấp", callback_data: "cmd:sync" },
      ],
      [
        { text: "🏷️ Bảng giá (Lẻ/CTV)", callback_data: "cmd:prices" },
        { text: "🔘 Bật/Tắt sản phẩm", callback_data: "cmd:toggles" },
      ],
      [
        { text: "💳 Nạp tiền NCC (VietQR)", callback_data: "cmd:topup_menu" },
        { text: "🏢 Số dư NCC", callback_data: "cmd:supplier_balances" },
      ],
    ],
  };
}

// -----------------------------------------------------------------------------
// CORE BUSINESS HANDLERS
// -----------------------------------------------------------------------------

async function handleRevenue(period) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "yesterday") {
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(now.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const paidOrders = await prisma.order.findMany({
    where: {
      status: "PAID",
      paidAt: { gte: startDate, lte: endDate },
    },
    include: {
      orderItems: { include: { product: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const periodTitle =
    period === "today"
      ? "HÔM NAY"
      : period === "yesterday"
      ? "HÔM QUA"
      : period === "week"
      ? "7 NGÀY QUA"
      : "THÁNG NÀY";

  let lines = paidOrders
    .slice(0, 6)
    .map(
      (o) =>
        `• <code>${o.orderCode}</code>: <b>${o.totalAmount.toLocaleString("vi-VN")}đ</b> (${
          o.orderItems[0]?.product?.title || "Sản phẩm"
        })`
    )
    .join("\n");

  return (
    `💰 <b>BÁO CÁO DOANH THU (${periodTitle}):</b>\n\n` +
    `• Tổng đơn đã thanh toán: <b>${paidOrders.length}</b> đơn\n` +
    `• Tổng doanh thu: <b>${totalRevenue.toLocaleString("vi-VN")}đ</b>\n\n` +
    `<b>Đơn hàng gần nhất:</b>\n` +
    (lines || "Chưa có đơn hàng trong khoảng thời gian này.")
  );
}

async function handleStockSummary() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      supplierMapping: true,
      items: { where: { status: "AVAILABLE" } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const lines = products.map((p) => {
    const local = p.items.length;
    const sup = p.supplierMapping?.supplierStock || 0;
    const total = local + sup;
    const icon = total > 0 ? "🟢" : "🔴";
    return `${icon} <b>${p.title}</b>: <b>${total}</b> (Kho: ${local} | Nguồn: ${sup})`;
  });

  return (
    `📦 <b>TỒN KHO CÁC MẶT HÀNG ĐANG BÁN:</b>\n\n` +
    lines.join("\n") +
    `\n\n<i>Nhấn "⚡ Sync Nhà cung cấp" để cập nhật số liệu mới nhất từ bot.</i>`
  );
}

async function handlePricesList(search) {
  const where = { isActive: true };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { slug: { contains: search.toLowerCase() } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: { supplierMapping: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  if (products.length === 0) {
    return `Không tìm thấy sản phẩm nào khớp với "${search || ""}".`;
  }

  const lines = products.map((p) => {
    let reseller = 0;
    let cost = p.supplierMapping?.supplierPrice || 0;
    if (p.supplierMapping?.customConfig) {
      try {
        const c = JSON.parse(p.supplierMapping.customConfig);
        reseller = c.resellerPrice || 0;
        cost = c.supplierCost || cost;
      } catch {}
    }
    return `• <b>${p.title}</b>\n  ↳ Giá lẻ: <b>${p.price.toLocaleString("vi-VN")}đ</b> | CTV: <b>${
      reseller ? reseller.toLocaleString("vi-VN") + "đ" : "Chưa set"
    }</b> | Vốn: <b>${cost ? cost.toLocaleString("vi-VN") + "đ" : "0đ"}</b>`;
  });

  return (
    `🏷️ <b>BẢNG GIÁ SẢN PHẨM (LẺ / CTV / VỐN):</b>\n\n` +
    lines.join("\n\n") +
    `\n\n<i>💡 Mẹo: Nhắn "Đổi giá [tên SP] [số tiền]k" để sửa giá ngay lập tức.</i>`
  );
}

async function handleToggleMenu() {
  const products = await prisma.product.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const keyboard = products.map((p) => [
    {
      text: `${p.isActive ? "🟢 Đang bán:" : "🔴 Đang ẩn:"} ${p.title.substring(0, 24)}`,
      callback_data: `toggle:${p.id}:${p.isActive ? "off" : "on"}`,
    },
  ]);

  keyboard.push([{ text: "🔙 Về Menu chính", callback_data: "cmd:main_menu" }]);

  return {
    text: "🔘 <b>QUẢN LÝ BẬT / TẮT SẢN PHẨM:</b>\n\nBấm vào tên sản phẩm để đảo trạng thái (Ẩn/Hiện ngay trên Web):",
    keyboard: { inline_keyboard: keyboard },
  };
}

async function handleUpdatePrice(query, newPrice, resellerPrice) {
  const numPrice = Number(newPrice);
  if (isNaN(numPrice) || numPrice <= 0) {
    return { success: false, message: "Giá tiền không hợp lệ (phải là số nguyên dương)." };
  }

  const prod = await prisma.product.findFirst({
    where: {
      OR: [
        { id: query },
        { slug: query.toLowerCase() },
        { title: { contains: query } },
      ],
    },
    include: { supplierMapping: true },
  });

  if (!prod) {
    return { success: false, message: `Không tìm thấy sản phẩm nào khớp với "${query}".` };
  }

  const oldPrice = prod.price;

  if (prod.supplierMapping) {
    let confObj = {};
    try {
      confObj = prod.supplierMapping.customConfig
        ? JSON.parse(prod.supplierMapping.customConfig)
        : {};
    } catch {}

    confObj.retailPrice = numPrice;
    if (resellerPrice && Number(resellerPrice) > 0) {
      confObj.resellerPrice = Number(resellerPrice);
    }

    await prisma.supplierProductMapping.update({
      where: { id: prod.supplierMapping.id },
      data: {
        customConfig: JSON.stringify(confObj),
        isAutoSync: false, // Lock so auto sync does not overwrite owner's manual price
      },
    });
  }

  const updated = await prisma.product.update({
    where: { id: prod.id },
    data: { price: numPrice },
  });

  return {
    success: true,
    message:
      `✅ <b>ĐÃ CẬP NHẬT GIÁ THÀNH CÔNG!</b>\n\n` +
      `• Sản phẩm: <b>${updated.title}</b>\n` +
      `• Giá cũ: <s>${oldPrice.toLocaleString("vi-VN")}đ</s>\n` +
      `• Giá bán lẻ mới: <b>${updated.price.toLocaleString("vi-VN")}đ</b>` +
      (resellerPrice ? `\n• Giá CTV mới: <b>${Number(resellerPrice).toLocaleString("vi-VN")}đ</b>` : "") +
      `\n\n<i>Đã đồng bộ lên trang web và khóa tự động ghi đè giá.</i>`,
  };
}

async function handleToggleStatus(query, shouldActive) {
  const prod = await prisma.product.findFirst({
    where: {
      OR: [
        { id: query },
        { slug: query.toLowerCase() },
        { title: { contains: query } },
      ],
    },
  });

  if (!prod) {
    return { success: false, message: `Không tìm thấy sản phẩm "${query}".` };
  }

  const updated = await prisma.product.update({
    where: { id: prod.id },
    data: { isActive: Boolean(shouldActive) },
  });

  return {
    success: true,
    message: `✓ Đã chuyển trạng thái <b>${updated.title}</b> sang: ${
      updated.isActive ? "🟢 MỞ BÁN" : "🔴 TẠM DỪNG / ẨN"
    }`,
  };
}

async function handleViewOrder(orderCode) {
  const cleanCode = (orderCode || "").trim().toUpperCase();
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ orderCode: cleanCode }, { id: cleanCode }],
    },
    include: {
      orderItems: { include: { product: true } },
      deliveredItems: true,
    },
  });

  if (!order) {
    return { success: false, message: `Không tìm thấy đơn hàng "${orderCode}".` };
  }

  const itemsList = order.orderItems
    .map((i) => `• <b>${i.product?.title || i.productId}</b> (x${i.quantity})`)
    .join("\n");

  const keysDelivered = order.deliveredItems
    .map((d) => `  🔑 <code>${d.itemData}</code>`)
    .join("\n");

  const text =
    `🔍 <b>CHI TIẾT ĐƠN HÀNG:</b>\n\n` +
    `• Mã đơn: <code>${order.orderCode}</code>\n` +
    `• Trạng thái TT: <b>${order.status}</b>\n` +
    `• Cấp phát (Upstream): <b>${order.upstreamStatus}</b>\n` +
    `• Tổng tiền: <b>${order.totalAmount.toLocaleString("vi-VN")}đ</b>\n` +
    `• Khách hàng: <code>${order.customerEmail || "Khách vãng lai"}</code>\n` +
    `• Sản phẩm đặt:\n${itemsList}\n` +
    (keysDelivered ? `• Key đã cấp:\n${keysDelivered}\n` : "") +
    (order.upstreamError ? `• Lỗi cấp phát: <i>${order.upstreamError}</i>\n` : "");

  const keyboard = [];
  if (order.upstreamStatus === "FAILED" || order.upstreamStatus === "PENDING_UPSTREAM") {
    keyboard.push([
      { text: "🔄 Thử lại cấp phát ngay", callback_data: `retry_order:${order.orderCode}` },
    ]);
  }
  keyboard.push([{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }]);

  return { success: true, text, keyboard: { inline_keyboard: keyboard } };
}

async function handleRetryOrder(orderCode) {
  const APP_PORT = process.env.PORT || "3000";
  try {
    const res = await fetch(`http://127.0.0.1:${APP_PORT}/api/admin/orders/${orderCode}/retry-upstream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success) {
      return `✅ Cấp phát lại đơn <code>${orderCode}</code> thành công!`;
    } else {
      return `⚠️ Thử lại đơn <code>${orderCode}</code> không thành công: ${data.error || data.message || "Lỗi chưa rõ"}`;
    }
  } catch (err) {
    return `⚠️ Lỗi gọi server cấp phát: ${err.message}`;
  }
}


// -----------------------------------------------------------------------------
// SUPPLIER TOP-UP & BALANCE FLUCTUATIONS HANDLERS
// -----------------------------------------------------------------------------

/**
 * Gọi API /api/admin/suppliers/{id}/balance để lấy số dư THỰC từ bot NCC rồi cập nhật DB.
 * Chỉ áp dụng cho các supplier dạng TELEGRAM_BOT (có baseUrl dạng tg://resolve?domain=...).
 * Returns updated balance hoặc null nếu lỗi.
 */
async function refreshSupplierBalance(supplierId) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (CRON_SECRET) headers["x-internal-secret"] = CRON_SECRET;
    const res = await fetch(`${APP_INTERNAL_URL}/api/admin/suppliers/${supplierId}/balance`, {
      method: "POST",
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      return data.balance ?? null;
    }
  } catch (err) {
    console.warn(`[Daemon] refreshSupplierBalance(${supplierId}) failed:`, err.message);
  }
  return null;
}

/**
 * Refresh balance của tất cả Telegram Bot suppliers tuần tự.
 * Chạy trước khi hiển thị danh sách số dư cho admin.
 */
async function refreshAllTelegramBalances(suppliers) {
  const telegramSuppliers = suppliers.filter(
    (s) => s.type === "TELEGRAM_BOT" && s.baseUrl && s.baseUrl.includes("tg://")
  );
  for (const sup of telegramSuppliers) {
    const bal = await refreshSupplierBalance(sup.id);
    if (bal !== null) {
      sup.currentBalance = bal; // update in-memory for display
    }
    // small delay between bots to avoid flooding
    await new Promise((r) => setTimeout(r, 800));
  }
}

async function handleSupplierBalances() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    include: { mappings: { include: { product: true } } },
  });

  if (suppliers.length === 0) {
    return "Chưa có nhà cung cấp nào đang hoạt động.";
  }

  // Refresh real-time balances from Telegram bots before displaying
  await refreshAllTelegramBalances(suppliers);

  let text = "🏢 <b>DANH SÁCH & SỐ DƯ NHÀ CUNG CẤP:</b>\n\n";
  for (const s of suppliers) {
    text += `${getSupplierIcon(s.name, s.code)} <b>${escapeHtml(s.name)}</b> (<code>${escapeHtml(s.code)}</code>)\n`;
    text += `• Số dư ví: <b>${(s.currentBalance || 0).toLocaleString("vi-VN")}đ</b>\n`;
    if (s.depositAccountNo && s.depositAccountNo !== "0388888888") {
      text += `• Ngân hàng nạp: <b>${escapeHtml(s.depositBankId || "MB")}</b> | STK: <code>${escapeHtml(s.depositAccountNo)}</code>\n`;
      text += `• Chủ TK: <b>${escapeHtml(s.depositAccountName || s.name)}</b>\n`;
      text += `• Cú pháp: <code>${escapeHtml(s.depositSyntax || "NAP " + ADMIN_CHAT_ID)}</code>\n`;
    } else {
      text += `• Nạp tiền: <i>${s.type && s.type.includes("API") ? "Nạp qua cổng API hoặc Bot đối tác" : "Xem chi tiết tại web NCC"}</i>\n`;
    }
    text += `• Sản phẩm: <b>${s.mappings.length}</b> sản phẩm\n\n`;
  }
  text += "👉 <i>Bấm nút bên dưới để tạo mã VietQR nạp tiền vào ví bot nguồn.</i>";
  return text;
}

function getSupplierIcon(name, code) {
  if (code.includes("XOAI") || name.includes("Xoài")) return "🥭";
  if (code.includes("KHOMMO") || name.includes("Kho MMO")) return "📦";
  if (code.includes("DSHOP") || name.includes("D-Shop") || name.includes("DShop")) return "🛍";
  if (code.includes("TOKI") || name.includes("Toki")) return "⚡";
  if (code.includes("DKEY") || name.includes("DKey")) return "🔑";
  if (code.includes("HXN") || name.includes("HXN")) return "✂️";
  if (code.includes("CHODAUMOI") || name.includes("Chợ Đầu Mối")) return "🏪";
  if (code.includes("HIHI") || name.includes("PQV")) return "🎁";
  if (code.includes("NGHIENTRICK") || name.includes("Nghiện")) return "𝔑";
  if (code.includes("GENZ") || name.includes("Genz")) return "⚡";
  return "🏢";
}

async function handleTopupMenu() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, currentBalance: true },
  });

  const buttons = suppliers.map((s) => [
    {
      text: `${getSupplierIcon(s.name, s.code)} ${s.name} (${(s.currentBalance || 0).toLocaleString("vi-VN")}đ)`,
      callback_data: `topup_sup:${s.code}`,
    },
  ]);
  buttons.push([{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }]);

  return {
    text: "💳 <b>CHỌN NHÀ CUNG CẤP CẦN NẠP TIỀN:</b>\n\nHệ thống kết nối trực tiếp với toàn bộ Bot NCC. Chọn nhà cung cấp bên dưới để lấy thông tin tài khoản và mã VietQR chuẩn:",
    keyboard: { inline_keyboard: buttons },
  };
}

async function handleTopupSupplier(supCode) {
  const supplier = await prisma.supplier.findFirst({
    where: { OR: [{ code: supCode }, { id: supCode }] },
  });

  if (!supplier) {
    return { text: `Không tìm thấy nhà cung cấp "${supCode}".`, keyboard: getMainKeyboard() };
  }

  const amounts = [20000, 50000, 100000, 200000, 500000];
  const botUsername = supplier.baseUrl?.replace("tg://resolve?domain=", "").replace("@", "");
  const hasBot = botUsername && !botUsername.startsWith("http");

  const buttons = [
    amounts.slice(0, 3).map((a) => ({
      text: `⚡ QR ${a / 1000}k`,
      callback_data: `topup_amt:${supplier.code}:${a}`,
    })),
    amounts.slice(3).map((a) => ({
      text: `⚡ QR ${a / 1000}k`,
      callback_data: `topup_amt:${supplier.code}:${a}`,
    })),
  ];

  const actionRow = [];
  if (hasBot) {
    actionRow.push({ text: `🤖 Mở @${botUsername}`, url: `https://t.me/${botUsername}` });
  }
  actionRow.push({ text: "🔄 Kiểm tra số dư", callback_data: `check_balance:${supplier.code}` });
  buttons.push(actionRow);
  buttons.push([{ text: "🔙 Quay lại danh sách NCC", callback_data: "cmd:topup_menu" }]);

  const text =
    `💳 <b>NẠP TIỀN VÀO VÍ: ${supplier.name}</b>\n\n` +
    (hasBot ? `🤖 Bot NCC: @${botUsername}\n` : "") +
    `• Số dư hiện tại: <b>${(supplier.currentBalance || 0).toLocaleString("vi-VN")}đ</b>\n` +
    `• Ngân hàng nạp: <b>${supplier.depositBankId || "MB"}</b>\n` +
    `• Số tài khoản: <code>${supplier.depositAccountNo || "Chưa có"}</code>\n` +
    `• Chủ tài khoản: <b>${supplier.depositAccountName || "NCC"}</b>\n` +
    `• Cú pháp: <code>${supplier.depositSyntax || "NAP " + ADMIN_CHAT_ID}</code>\n\n` +
    `👉 <b>Bấm chọn mệnh giá bên dưới để tạo mã VietQR nạp tức thì:</b>`;

  return { text, keyboard: { inline_keyboard: buttons } };
}

async function handleSendTopupQR(chatId, supCode, amount, orderCode) {
  const supplier = await prisma.supplier.findFirst({
    where: { OR: [{ code: supCode }, { id: supCode }] },
  });

  if (!supplier) {
    await sendMessage(chatId, `Không tìm thấy nhà cung cấp "${supCode}".`);
    return;
  }

  const bankId = supplier.depositBankId || "MB";
  const accountNo = supplier.depositAccountNo || "0388888888";
  const accountName = supplier.depositAccountName || "SHOP XOAI NON";
  const syntax = supplier.depositSyntax || `NAP ${ADMIN_CHAT_ID || chatId}`;

  await sendMessage(chatId, `⏳ Đang tạo mã VietQR nạp <b>${amount.toLocaleString("vi-VN")}đ</b> cho <b>${supplier.name}</b>...`);

  const qrBuf = await generateVietQR(bankId, accountNo, accountName, amount, syntax);
  if (!qrBuf) {
    const text =
      `⚠️ <b>THÔNG TIN CHUYỂN KHOẢN NẠP TIỀN:</b>\n\n` +
      `🏢 Nhà cung cấp: <b>${supplier.name}</b>\n` +
      `🏦 Ngân hàng: <b>${bankId}</b> | STK: <code>${accountNo}</code>\n` +
      `👤 Chủ tài khoản: <b>${accountName}</b>\n` +
      `💵 Số tiền: <b>${amount.toLocaleString("vi-VN")}đ</b>\n` +
      `📝 Cú pháp: <code>${syntax}</code>`;
    await sendMessage(chatId, text, {
      inline_keyboard: [
        [{ text: "🔄 Kiểm tra số dư", callback_data: `check_balance:${supplier.code}` }],
        [{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }],
      ],
    });
    return;
  }

  let tip = "";
  if (supplier.code === "TOKI_TELE") {
    tip = "\n\n💡 <i>Toki MMO dùng cổng SePay tự động. Chuyển đúng cú pháp trên là ví được cộng tiền trong 10-30s.</i>";
  } else if (supplier.code === "KHOMMO_TELE") {
    tip = "\n\n💡 <i>Kho MMO Market tự tạo mã đơn riêng. Bạn cũng có thể gõ /nap " + amount + " tại @KhoMMO_Market_bot.</i>";
  } else if (supplier.code === "XOAINON_TELE") {
    tip = "\n\n💡 <i>Shop Xoài Non dùng phương thức tiền lẻ (Delta pennies) để xác nhận tự động qua Cake VPBank.</i>";
  } else if (supplier.code === "HIHISTORE_TELE") {
    tip = "\n\n💡 <i>PQV Store dùng số tiền lẻ nhận diện tự động qua MB Bank.</i>";
  }

  const caption =
    `💳 <b>MÃ VIETQR NẠP TIỀN: ${supplier.name}</b>\n\n` +
    `💵 Số tiền: <b>${amount.toLocaleString("vi-VN")}đ</b>\n` +
    `🏦 Ngân hàng: <b>${bankId}</b> | STK: <code>${accountNo}</code>\n` +
    `👤 Chủ tài khoản: <b>${accountName}</b>\n` +
    `📝 Cú pháp nạp: <code>${syntax}</code>\n\n` +
    `👉 <i>Mở ứng dụng ngân hàng quét mã trên để nạp tiền vào ví bot nguồn. Hệ thống sẽ tự động cập nhật số dư!</i>` +
    tip;

  const buttons = [
    [
      { text: "🔄 Kiểm tra số dư", callback_data: `check_balance:${supplier.code}` },
      { text: "🔙 Về Menu", callback_data: "cmd:main_menu" },
    ],
  ];

  if (orderCode) {
    buttons.unshift([
      { text: "⚡ Đã nạp xong - Cấp hàng ngay", callback_data: `retry_order:${orderCode}` },
    ]);
  }

  await sendPhoto(chatId, qrBuf, `vietqr_${supplier.code}_${amount}.png`, caption, {
    inline_keyboard: buttons,
  });
}

async function handleSetDeposit(text) {
  const parts = text.replace(/^\/set_deposit\s+/i, "").trim().split(/\s+/);
  if (parts.length < 3) {
    return (
      `ℹ️ <b>HƯỚNG DẪN CẤU HÌNH STK NẠP NCC:</b>\n\n` +
      `Cú pháp:\n<code>/set_deposit &lt;MÃ_NCC&gt; &lt;STK&gt; &lt;NGÂN_HÀNG&gt; &lt;CHỦ_TK&gt; [CÚ_PHÁP]</code>\n\n` +
      `Ví dụ:\n<code>/set_deposit XOAINON_TELE 0388888888 MB SHOP_XOAI_NON NAP 1853328773</code>`
    );
  }

  const [supCode, accountNo, bankId, accountName, ...syntaxParts] = parts;
  const syntax = syntaxParts.length > 0 ? syntaxParts.join(" ") : `NAP ${ADMIN_CHAT_ID}`;

  const sup = await prisma.supplier.findFirst({
    where: { OR: [{ code: supCode }, { id: supCode }] },
  });

  if (!sup) {
    return `Không tìm thấy nhà cung cấp có mã "${supCode}".`;
  }

  const cleanName = (accountName || "").replace(/_/g, " ");
  await prisma.supplier.update({
    where: { id: sup.id },
    data: {
      depositBankId: bankId.toUpperCase(),
      depositAccountNo: accountNo,
      depositAccountName: cleanName,
      depositSyntax: syntax,
    },
  });

  return (
    `✅ <b>ĐÃ CẬP NHẬT THÔNG TIN NẠP TIỀN CHO ${sup.name}:</b>\n\n` +
    `• Mã NCC: <code>${sup.code}</code>\n` +
    `• Ngân hàng: <b>${bankId.toUpperCase()}</b>\n` +
    `• Số tài khoản: <code>${accountNo}</code>\n` +
    `• Chủ tài khoản: <b>${cleanName}</b>\n` +
    `• Cú pháp nạp: <code>${syntax}</code>\n\n` +
    `👉 <i>Mọi mã VietQR tạo sau này sẽ tự động gắn thông tin trên!</i>`
  );
}

let lastBalanceCheckTime = 0;
async function checkBalanceFluctuations() {
  const now = Date.now();
  if (now - lastBalanceCheckTime < 40000) return;
  lastBalanceCheckTime = now;

  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
    });

    for (const sup of suppliers) {
      if (sup.lastNotifiedBalance !== null && sup.lastNotifiedBalance !== undefined) {
        if (sup.currentBalance !== sup.lastNotifiedBalance) {
          const diff = sup.currentBalance - sup.lastNotifiedBalance;
          const isDeposit = diff > 0;
          const alertMsg = isDeposit
            ? `🟢 <b>BIẾN ĐỘNG SỐ DƯ NCC (TIỀN VÀO)</b>\n\n` +
              `🏢 Nhà cung cấp: <b>${sup.name}</b>\n` +
              `➕ Tiền nạp vào: <b>+${diff.toLocaleString("vi-VN")}đ</b>\n` +
              `💰 Số dư hiện tại: <b>${sup.currentBalance.toLocaleString("vi-VN")}đ</b>\n` +
              `⏰ Thời gian: ${new Date().toLocaleTimeString("vi-VN")}`
            : `🔴 <b>BIẾN ĐỘNG SỐ DƯ NCC (TIỀN RA)</b>\n\n` +
              `🏢 Nhà cung cấp: <b>${sup.name}</b>\n` +
              `➖ Trừ tiền mua hàng: <b>${diff.toLocaleString("vi-VN")}đ</b>\n` +
              `💰 Số dư còn lại: <b>${sup.currentBalance.toLocaleString("vi-VN")}đ</b>\n` +
              `⏰ Thời gian: ${new Date().toLocaleTimeString("vi-VN")}`;

          if (ADMIN_CHAT_ID) {
            await sendMessage(ADMIN_CHAT_ID, alertMsg, {
              inline_keyboard: [
                [
                  { text: "💳 Nạp thêm tiền", callback_data: `topup_sup:${sup.code}` },
                  { text: "🏢 Tất cả số dư", callback_data: "cmd:supplier_balances" },
                ],
              ],
            });
          }

          await prisma.supplier.update({
            where: { id: sup.id },
            data: { lastNotifiedBalance: sup.currentBalance },
          });
        }
      } else {
        await prisma.supplier.update({
          where: { id: sup.id },
          data: { lastNotifiedBalance: sup.currentBalance },
        });
      }
    }
  } catch (err) {
    console.warn("[AssistantDaemon] Error checking balance fluctuations:", err.message);
  }
}

// -----------------------------------------------------------------------------
// GEMINI FLASH AI WITH FUNCTION CALLING
// -----------------------------------------------------------------------------

const TOOLS_DECLARATION = [
  {
    function_declarations: [
      {
        name: "update_product_price",
        description: "Cập nhật giá bán lẻ hoặc giá CTV của sản phẩm trên web",
        parameters: {
          type: "OBJECT",
          properties: {
            product_name: { type: "STRING", description: "Tên hoặc slug sản phẩm" },
            new_price: { type: "NUMBER", description: "Giá bán lẻ mới bằng VND (ví dụ: 35000, 150000)" },
            new_reseller_price: { type: "NUMBER", description: "Giá CTV mới bằng VND (tùy chọn)" },
          },
          required: ["product_name", "new_price"],
        },
      },
      {
        name: "toggle_product_status",
        description: "Bật hoặc tắt mở bán sản phẩm trên web",
        parameters: {
          type: "OBJECT",
          properties: {
            product_name: { type: "STRING", description: "Tên hoặc slug sản phẩm" },
            is_active: { type: "BOOLEAN", description: "true để mở bán, false để tạm ẩn" },
          },
          required: ["product_name", "is_active"],
        },
      },
      {
        name: "get_revenue_report",
        description: "Xem thống kê doanh thu và đơn hàng",
        parameters: {
          type: "OBJECT",
          properties: {
            period: {
              type: "STRING",
              enum: ["today", "yesterday", "week", "month"],
              description: "today, yesterday, week, hoặc month",
            },
          },
          required: ["period"],
        },
      },
      {
        name: "handle_stock_summary",
        description: "Kiểm tra tồn kho thời gian thực của các sản phẩm",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "lookup_order",
        description: "Tra cứu thông tin đơn hàng theo mã đơn ORD...",
        parameters: {
          type: "OBJECT",
          properties: { order_code: { type: "STRING", description: "Mã đơn hàng" } },
          required: ["order_code"],
        },
      },
      {
        name: "trigger_supplier_sync",
        description: "Đồng bộ tồn kho và giá từ các bot Telegram nhà cung cấp",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_supplier_balances",
        description: "Xem danh sách và số dư ví tại tất cả các nhà cung cấp hoặc bot nguồn",
        parameters: { type: "OBJECT", properties: {} },
      },
    ],
  },
];

const SYSTEM_PROMPT = `
Bạn là Trợ lý Quản trị Cửa hàng Thông minh (Store Assistant) của KhoDee MMO Hub (daitruongstore.fly.dev).
Bạn đang trao đổi trực tiếp với Chủ Shop qua Telegram.
Hãy phân tích yêu cầu của Chủ shop và gọi đúng Function Call phù hợp:
- Sửa giá, đổi giá: update_product_price
- Bật/tắt sản phẩm: toggle_product_status
- Xem doanh thu, đơn hàng: get_revenue_report
- Xem tồn kho: handle_stock_summary
- Tra cứu đơn hàng ORD...: lookup_order
- Đồng bộ nguồn: trigger_supplier_sync
- Xem số dư nhà cung cấp, ví bot nguồn: get_supplier_balances
Nếu là câu hỏi thông thường, hãy trả lời ngắn gọn, lịch sự, dùng emoji thân thiện.
`;

async function callGeminiAI(userText) {
  if (!GEMINI_API_KEY) {
    return "Dạ tôi đã nhận được tin nhắn. (Cần cấu hình GEMINI_API_KEY để bật tính năng hiểu tiếng Việt tự nhiên).";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userText }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        tools: TOOLS_DECLARATION,
      }),
    });

    if (!res.ok) {
      return `⚠️ Lỗi kết nối trợ lý AI (HTTP ${res.status}). Bạn có thể bấm /menu để điều khiển trực tiếp.`;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const fnCallPart = parts.find((p) => p.functionCall);
    if (fnCallPart && fnCallPart.functionCall) {
      const call = fnCallPart.functionCall;
      const fnName = call.name;
      const args = call.args || {};

      console.log(`[AssistantDaemon] AI Function Call: ${fnName}`, args);

      if (fnName === "update_product_price") {
        const result = await handleUpdatePrice(args.product_name, args.new_price, args.new_reseller_price);
        return result.message;
      }
      if (fnName === "toggle_product_status") {
        const result = await handleToggleStatus(args.product_name, args.is_active);
        return result.message;
      }
      if (fnName === "get_revenue_report") {
        return await handleRevenue(args.period || "today");
      }
      if (fnName === "handle_stock_summary") {
        return await handleStockSummary();
      }
      if (fnName === "lookup_order") {
        const result = await handleViewOrder(args.order_code);
        return result.text || result.message;
      }
      if (fnName === "trigger_supplier_sync") {
        return "⏳ Đã gửi yêu cầu đồng bộ nhà cung cấp. Bấm nút 'Sync' trên menu để kiểm tra tiến độ!";
      }
      if (fnName === "get_supplier_balances") {
        const textBalances = await handleSupplierBalances();
        return {
          text: textBalances,
          keyboard: {
            inline_keyboard: [
              [
                { text: "💳 Nạp tiền NCC", callback_data: "cmd:topup_menu" },
                { text: "🔙 Về Menu", callback_data: "cmd:main_menu" },
              ],
            ],
          },
        };
      }
    }

    const textPart = parts.find((p) => p.text);
    return textPart?.text || "Dạ tôi đã nhận được lệnh từ bạn.";
  } catch (err) {
    console.error("[AssistantDaemon] Gemini error:", err);
    return `Dạ tôi đã nhận tin nhắn: "${userText}". Bạn có thể gõ /menu để mở bảng điều khiển nhé!`;
  }
}

// -----------------------------------------------------------------------------
// FAST REGEX MATCHER FOR COMMON VIETNAMESE COMMANDS
// -----------------------------------------------------------------------------

function parsePriceNumber(raw) {
  let clean = raw.toLowerCase().trim();
  let mult = 1;
  if (clean.endsWith("k") || clean.endsWith("tr")) {
    if (clean.endsWith("k")) mult = 1000;
    if (clean.endsWith("tr")) mult = 1000000;
    clean = clean.replace(/[ktr]/g, "");
  }
  clean = clean.replace(/[^0-9]/g, "");
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num * mult;
}

async function tryFastRegex(text) {
  const t = text.trim();
  // Set deposit config command: /set_deposit
  if (t.startsWith("/set_deposit")) {
    return await handleSetDeposit(t);
  }

  // Supplier balances
  const cleanT = t.toLowerCase().replace(/\s+/g, " ");
  if (
    /^(?:số\s*dư|so\s*du|ví\s*ncc|vi\s*ncc|số\s*dư\s*ncc|so\s*du\s*ncc|ncc|balance|check\s*balance|kiem\s*tra\s*so\s*du|xem\s*so\s*du|kt\s*so\s*du|so\s*du\s*vi)(?:\s+ncc)?$/i.test(t) ||
    cleanT === "so du ncc" ||
    cleanT === "so du" ||
    cleanT === "so du vi" ||
    cleanT === "vi ncc" ||
    cleanT.includes("số dư") ||
    cleanT.includes("so du") ||
    cleanT.includes("ví ncc") ||
    cleanT.includes("vi ncc")
  ) {
    const textBalances = await handleSupplierBalances();
    return {
      text: textBalances,
      keyboard: {
        inline_keyboard: [
          [
            { text: "💳 Nạp tiền NCC", callback_data: "cmd:topup_menu" },
            { text: "🔙 Về Menu", callback_data: "cmd:main_menu" },
          ],
        ],
      },
    };
  }

  // Quick top-up: "nạp tiền", "nạp xoài non 50k", "nạp tiền ncc"
  const topupQuickRegex = /^(?:nạp\s*tiền|nạp\s*ví|nạp\s*ncc)(?:\s+(.+?)(?:\s+(\d+[\d\.,]*(?:k|đ)?))?)?$/i;
  const topupMatch = t.match(topupQuickRegex);
  if (topupMatch) {
    const targetSup = topupMatch[1]?.trim();
    const targetAmt = topupMatch[2] ? parsePriceNumber(topupMatch[2]) : 50000;
    if (targetSup) {
      const sup = await prisma.supplier.findFirst({
        where: {
          OR: [
            { code: { contains: targetSup } },
            { name: { contains: targetSup } },
          ],
        },
      });
      if (sup) {
        await handleSendTopupQR(ADMIN_CHAT_ID, sup.code, targetAmt);
        return "✓ Đã gửi mã VietQR nạp tiền ở trên!";
      }
    }
    const menu = await handleTopupMenu();
    return menu.text;
  }


  // 1. Price update: "Đổi giá Canva 35k" / "Sửa giá Canva thành 45000" / "Set giá capcut 150k ctv 120k"
  const priceRegex = /^(?:đổi|sửa|set|cập\s*nhật|chỉnh)\s+giá\s+(.+?)\s+(?:thành|=|sang)?\s*(\d+[\d\.,]*(?:k|tr|đ|vnd)?)(?:\s+(?:ctv|sỉ)\s+(\d+[\d\.,]*(?:k|tr|đ|vnd)?))?$/i;
  const priceMatch = t.match(priceRegex);
  if (priceMatch) {
    const prodName = priceMatch[1].trim();
    const retail = parsePriceNumber(priceMatch[2]);
    const reseller = priceMatch[3] ? parsePriceNumber(priceMatch[3]) : undefined;
    const res = await handleUpdatePrice(prodName, retail, reseller);
    return res.message;
  }

  // 2. Toggle active: "Tắt Canva" / "Ẩn Netflix" / "Bật Canva" / "Mở Capcut"
  const toggleOffRegex = /^(?:tắt|ẩn|dừng|pause)\s+(.+)$/i;
  const offMatch = t.match(toggleOffRegex);
  if (offMatch) {
    const res = await handleToggleStatus(offMatch[1].trim(), false);
    return res.message;
  }

  const toggleOnRegex = /^(?:bật|mở|hiện|active)\s+(.+)$/i;
  const onMatch = t.match(toggleOnRegex);
  if (onMatch) {
    const res = await handleToggleStatus(onMatch[1].trim(), true);
    return res.message;
  }

  // 3. Stock check: "Kho", "Tồn kho"
  if (/^(?:kho|tồn\s*kho|check\s*kho)$/i.test(t)) {
    return await handleStockSummary();
  }

  // 4. Revenue: "Doanh thu", "Hôm nay bán được bao nhiêu"
  if (/^(?:doanh\s*thu|dt|tiền\s*về|hôm\s*nay\s*bán\s*được\s*bao\s*nhiêu)/i.test(t)) {
    return await handleRevenue("today");
  }

  // 5. Order check: "ORD..." or "Đơn ORD..."
  const orderRegex = /(?:đơn\s*)?(ORD[A-Z0-9]{5,})/i;
  const orderMatch = t.match(orderRegex);
  if (orderMatch) {
    const res = await handleViewOrder(orderMatch[1]);
    return res.text || res.message;
  }

  return null;
}

// -----------------------------------------------------------------------------
// MAIN POLLING LOOP
// -----------------------------------------------------------------------------

let lastUpdateId = 0;
let isRunning = true;

async function pollUpdates() {
  while (isRunning) {
    await checkBalanceFluctuations();
    try {
      const res = await fetch(
        `${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=20&allowed_updates=["message","callback_query"]`
      );
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);

          // 1. Process Messages
          if (update.message) {
            const msg = update.message;
            const fromId = msg.from?.id ? msg.from.id.toString() : "";
            const text = (msg.text || "").trim();

            console.log(`[AssistantDaemon] Msg from ${fromId} (${msg.from?.first_name}): "${text}"`);

            // Security check: Only Admin allowed
            if (ADMIN_CHAT_ID && fromId !== ADMIN_CHAT_ID) {
              await sendMessage(
                msg.chat.id,
                "⛔ <b>Truy cập bị từ chối:</b> Bạn không có quyền điều khiển trợ lý này."
              );
              continue;
            }

            if (text === "/start" || text === "/menu" || text.toLowerCase() === "menu") {
              const welcome =
                `👋 <b>Chào Chủ Shop! Tôi là Trợ lý Quản lý KhoDee 24/7.</b>\n\n` +
                `Tôi đang theo dõi cửa hàng <b>daitruongstore.fly.dev</b> theo thời gian thực.\n\n` +
                `Bạn có thể bấm các nút điều khiển nhanh bên dưới hoặc nhắn tin tiếng Việt tự nhiên bất cứ lúc nào!`;
              await sendMessage(msg.chat.id, welcome, getMainKeyboard());
              continue;
            }

            // Check fast regex first for zero latency
            const fastReply = await tryFastRegex(text);
            if (fastReply) {
              const replyText = typeof fastReply === "object" ? fastReply.text : fastReply;
              const replyKb = typeof fastReply === "object" && fastReply.keyboard ? fastReply.keyboard : getMainKeyboard();
              await sendMessage(msg.chat.id, replyText, replyKb);
              continue;
            }

            // Fallback to Gemini Flash Function Calling AI
            const aiReply = await callGeminiAI(text);
            const aiText = typeof aiReply === "object" ? aiReply.text : aiReply;
            const aiKb = typeof aiReply === "object" && aiReply.keyboard ? aiReply.keyboard : getMainKeyboard();
            await sendMessage(msg.chat.id, aiText, aiKb);
          }

          // 2. Process Callback Queries (Button clicks)
          if (update.callback_query) {
            const cb = update.callback_query;
            const fromId = cb.from?.id ? cb.from.id.toString() : "";
            const dataStr = cb.data || "";

            if (ADMIN_CHAT_ID && fromId !== ADMIN_CHAT_ID) {
              await answerCallbackQuery(cb.id, "Từ chối truy cập");
              continue;
            }

            await answerCallbackQuery(cb.id);

            if (dataStr === "cmd:main_menu") {
              await editMessageText(
                cb.message.chat.id,
                cb.message.message_id,
                "👋 <b>BẢNG ĐIỀU KHIỂN CỬA HÀNG KHODEE:</b>",
                getMainKeyboard()
              );
              continue;
            }

            if (dataStr === "cmd:stock") {
              const text = await handleStockSummary();
              await sendMessage(cb.message.chat.id, text, {
                inline_keyboard: [
                  [{ text: "⚡ Sync từ Bot ngay", callback_data: "cmd:sync" }],
                  [{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }],
                ],
              });
              continue;
            }

            if (dataStr === "cmd:revenue_today") {
              const text = await handleRevenue("today");
              await sendMessage(cb.message.chat.id, text, {
                inline_keyboard: [[{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }]],
              });
              continue;
            }

            if (dataStr === "cmd:revenue_week") {
              const text = await handleRevenue("week");
              await sendMessage(cb.message.chat.id, text, {
                inline_keyboard: [[{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }]],
              });
              continue;
            }

            
            if (dataStr === "cmd:supplier_balances") {
              const text = await handleSupplierBalances();
              await sendMessage(cb.message.chat.id, text, {
                inline_keyboard: [
                  [{ text: "💳 Nạp tiền ngay", callback_data: "cmd:topup_menu" }],
                  [{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }],
                ],
              });
              continue;
            }

            if (dataStr === "cmd:topup_menu") {
              const menu = await handleTopupMenu();
              await sendMessage(cb.message.chat.id, menu.text, menu.keyboard);
              continue;
            }

            if (dataStr.startsWith("topup_sup:")) {
              const supCode = dataStr.replace("topup_sup:", "");
              const res = await handleTopupSupplier(supCode);
              await sendMessage(cb.message.chat.id, res.text, res.keyboard);
              continue;
            }

            if (dataStr.startsWith("topup_amt:")) {
              const [, supCode, amtStr] = dataStr.split(":");
              const amount = parseInt(amtStr, 10) || 50000;
              await handleSendTopupQR(cb.message.chat.id, supCode, amount);
              continue;
            }

            if (dataStr.startsWith("check_balance:")) {
              const supCode = dataStr.replace("check_balance:", "");
              const sup = await prisma.supplier.findFirst({
                where: { OR: [{ code: supCode }, { id: supCode }] },
              });
              if (sup) {
                // Refresh real-time balance from the actual bot
                await sendMessage(cb.message.chat.id, `⏳ Đang kiểm tra số dư thực từ bot <b>${escapeHtml(sup.name)}</b>...`);
                const freshBalance = await refreshSupplierBalance(sup.id);
                const displayBalance = freshBalance !== null ? freshBalance : (sup.currentBalance || 0);
                const balText =
                  `🏢 <b>THÔNG TIN SỐ DƯ: ${escapeHtml(sup.name)}</b>\n\n` +
                  `• Số dư hiện tại: <b>${displayBalance.toLocaleString("vi-VN")}đ</b>` +
                  (freshBalance !== null ? " ✅ <i>(vừa cập nhật)</i>" : " ⚠️ <i>(từ cache)</i>") + "\n" +
                  `• Ngân hàng nạp: <b>${escapeHtml(sup.depositBankId || "MB")}</b> | STK: <code>${escapeHtml(sup.depositAccountNo || "0388888888")}</code>\n` +
                  `• Cú pháp: <code>${escapeHtml(sup.depositSyntax || "NAP " + ADMIN_CHAT_ID)}</code>`;
                await sendMessage(cb.message.chat.id, balText, {
                  inline_keyboard: [
                    [{ text: "🔄 Refresh lại", callback_data: `check_balance:${sup.code}` }],
                    [{ text: "💳 Nạp tiền vào ví", callback_data: `topup_sup:${sup.code}` }],
                    [{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }],
                  ],
                });
              }
              continue;
            }

            if (dataStr === "cmd:prices") {
              const text = await handlePricesList();
              await sendMessage(cb.message.chat.id, text, {
                inline_keyboard: [[{ text: "🔙 Về Menu", callback_data: "cmd:main_menu" }]],
              });
              continue;
            }

            if (dataStr === "cmd:toggles") {
              const toggleMenu = await handleToggleMenu();
              await sendMessage(cb.message.chat.id, toggleMenu.text, toggleMenu.keyboard);
              continue;
            }

            if (dataStr.startsWith("toggle:")) {
              const [, prodId, action] = dataStr.split(":");
              const newStatus = action === "on";
              const updated = await prisma.product.update({
                where: { id: prodId },
                data: { isActive: newStatus },
              });
              await sendMessage(
                cb.message.chat.id,
                `✓ Đã chuyển trạng thái <b>${updated.title}</b> sang: ${
                  newStatus ? "🟢 MỞ BÁN" : "🔴 TẠM DỪNG"
                }`
              );
              const toggleMenu = await handleToggleMenu();
              await editMessageText(
                cb.message.chat.id,
                cb.message.message_id,
                toggleMenu.text,
                toggleMenu.keyboard
              );
              continue;
            }

            if (dataStr.startsWith("view_order:")) {
              const orderCode = dataStr.replace("view_order:", "");
              const orderView = await handleViewOrder(orderCode);
              await sendMessage(
                cb.message.chat.id,
                orderView.text || orderView.message,
                orderView.keyboard
              );
              continue;
            }

            if (dataStr.startsWith("retry_order:")) {
              const orderCode = dataStr.replace("retry_order:", "");
              await sendMessage(cb.message.chat.id, `⏳ Đang thử lại cấp phát cho đơn <code>${orderCode}</code>...`);
              const retryMsg = await handleRetryOrder(orderCode);
              await sendMessage(cb.message.chat.id, retryMsg, getMainKeyboard());
              continue;
            }

            if (dataStr === "cmd:sync") {
              await sendMessage(cb.message.chat.id, "⏳ Đang kết nối các bot Telegram để đồng bộ kho...");
              try {
                const APP_PORT = process.env.PORT || "3000";
                const syncUrl = `http://127.0.0.1:${APP_PORT}/api/cron/sync-suppliers`;
                const sres = await fetch(syncUrl, {
                  method: "POST",
                  headers: { "x-cron-secret": "internal_sync_secret_token" },
                });
                const sdata = await sres.json();
                await sendMessage(
                  cb.message.chat.id,
                  `✅ <b>ĐỒNG BỘ THÀNH CÔNG!</b>\n• Đã đồng bộ: <b>${sdata.syncedCount || 0}/${
                    sdata.totalMappings || 0
                  }</b> sản phẩm\n• Hết hàng tạm ẩn: <b>${sdata.pausedCount || 0}</b>`
                );
              } catch (e) {
                await sendMessage(cb.message.chat.id, `⚠️ Đồng bộ chạy trong nền: ${e.message}`);
              }
              continue;
            }
          }
        }
      }
    } catch (err) {
      console.warn("[AssistantDaemon] Polling loop error:", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// Clean signal handling
function cleanup() {
  console.log("[AssistantDaemon] Stopping daemon...");
  isRunning = false;
  prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

console.log(
  `[AssistantDaemon] Telegram Admin Assistant started for Bot @Quanlykhodeebot (Admin ID: ${ADMIN_CHAT_ID})...`
);
pollUpdates();
