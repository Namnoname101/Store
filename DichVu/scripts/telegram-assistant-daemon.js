// 24/7 Telegram Admin Assistant Daemon
// Operates 24/7 on Fly.io production server ($0 additional cost)
// Usage: node scripts/telegram-assistant-daemon.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BOT_TOKEN = process.env.TELEGRAM_ASSISTANT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

if (!BOT_TOKEN) {
  console.warn("[AssistantDaemon] TELEGRAM_ASSISTANT_BOT_TOKEN not provided. Assistant daemon disabled.");
  process.exit(0);
}

const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function callTelegram(method, body) {
  try {
    const res = await fetch(`${BASE_URL}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.warn(`[AssistantDaemon] Telegram API error on ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

async function sendMessage(chatId, text, replyMarkup) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
}

async function editMessageText(chatId, messageId, text, replyMarkup) {
  return callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
}

async function answerCallbackQuery(callbackQueryId, text) {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
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
              await sendMessage(msg.chat.id, fastReply, getMainKeyboard());
              continue;
            }

            // Fallback to Gemini Flash Function Calling AI
            const aiReply = await callGeminiAI(text);
            await sendMessage(msg.chat.id, aiReply, getMainKeyboard());
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
