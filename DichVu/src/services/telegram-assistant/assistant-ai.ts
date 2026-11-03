import {
  getProductCatalog,
  updateProductPrice,
  toggleProductActive,
  getRevenueReport,
  checkProductStock,
  triggerSyncAllSuppliers,
  lookupOrder,
} from "./assistant-actions";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

const TOOLS_DECLARATION = [
  {
    function_declarations: [
      {
        name: "update_product_price",
        description: "Cập nhật giá bán lẻ hoặc giá CTV/đại lý của một sản phẩm trên web",
        parameters: {
          type: "OBJECT",
          properties: {
            product_name: {
              type: "STRING",
              description: "Tên hoặc slug của sản phẩm (ví dụ: 'canva', 'chatgpt', 'capcut', 'office')",
            },
            new_price: {
              type: "NUMBER",
              description: "Giá bán lẻ mới bằng VND (ví dụ: 199000, 45000)",
            },
            new_reseller_price: {
              type: "NUMBER",
              description: "Giá sỉ / CTV mới bằng VND (nếu có)",
            },
          },
          required: ["product_name", "new_price"],
        },
      },
      {
        name: "toggle_product_status",
        description: "Bật mở bán hoặc tạm dừng ẩn sản phẩm trên web",
        parameters: {
          type: "OBJECT",
          properties: {
            product_name: {
              type: "STRING",
              description: "Tên hoặc slug của sản phẩm (ví dụ: 'canva', 'meitu', 'capcut')",
            },
            is_active: {
              type: "BOOLEAN",
              description: "true nếu muốn mở bán lại, false nếu muốn tạm dừng / ẩn",
            },
          },
          required: ["product_name", "is_active"],
        },
      },
      {
        name: "get_revenue_report",
        description: "Xem báo cáo thống kê doanh thu, số lượng đơn hàng và lợi nhuận",
        parameters: {
          type: "OBJECT",
          properties: {
            period: {
              type: "STRING",
              enum: ["today", "yesterday", "week", "month"],
              description: "Khoảng thời gian: 'today' (hôm nay), 'yesterday' (hôm qua), 'week' (7 ngày), 'month' (tháng này)",
            },
          },
          required: ["period"],
        },
      },
      {
        name: "check_product_stock",
        description: "Kiểm tra tồn kho thời gian thực của sản phẩm ở kho sẵn và bot nhà cung cấp",
        parameters: {
          type: "OBJECT",
          properties: {
            product_name: {
              type: "STRING",
              description: "Tên sản phẩm cần kiểm tra tồn kho",
            },
          },
          required: ["product_name"],
        },
      },
      {
        name: "sync_suppliers_catalog",
        description: "Ép hệ thống chạy đồng bộ giá và tồn kho từ tất cả bot nhà cung cấp Telegram ngay lập tức",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "lookup_order",
        description: "Tra cứu thông tin chi tiết một đơn hàng theo mã đơn (ví dụ: ORD123456)",
        parameters: {
          type: "OBJECT",
          properties: {
            order_code: {
              type: "STRING",
              description: "Mã đơn hàng ORD...",
            },
          },
          required: ["order_code"],
        },
      },
      {
        name: "list_products",
        description: "Liệt kê danh sách các sản phẩm đang có trong hệ thống",
        parameters: {
          type: "OBJECT",
          properties: {
            search: {
              type: "STRING",
              description: "Từ khóa tìm kiếm (tùy chọn)",
            },
          },
        },
      },
    ],
  },
];

const SYSTEM_INSTRUCTION = `
Bạn là Trợ lý Quản trị Cửa hàng Thông minh (AI Store Manager) của KhoDee MMO Hub (daitruongstore.fly.dev).
Bạn đang nói chuyện trực tiếp với CHỦ SHOP (Admin) qua Telegram.
Nhiệm vụ của bạn:
1. Hiểu câu lệnh tiếng Việt tự nhiên của chủ shop và gọi đúng Function Tool (chỉnh giá, bật/tắt sản phẩm, tra cứu tồn kho, báo cáo doanh thu, tra cứu đơn, đồng bộ bot).
2. Trả lời ngắn gọn, lịch sự, chuyên nghiệp, sử dụng biểu tượng cảm xúc (emoji) trực quan.
3. Luôn báo cáo số liệu chính xác bằng tiền VND (được định dạng dấu chấm như 45.000đ).
`;

/**
 * Xử lý tin nhắn của Chủ Shop bằng Gemini Flash AI
 */
export async function processAdminMessageWithAI(userText: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "⚠️ Trợ lý AI chưa có GEMINI_API_KEY. Vui lòng cấu hình trong file .env.";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: userText }],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    tools: TOOLS_DECLARATION,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[AssistantAI] Gemini call failed:", res.status, errText);
      return `⚠️ Lỗi kết nối trợ lý AI (HTTP ${res.status}). Bạn có thể dùng lệnh nút bấm /menu để điều khiển trực tiếp.`;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Check if Gemini invoked a function call
    const functionCallPart = parts.find((p: any) => p.functionCall);

    if (functionCallPart && functionCallPart.functionCall) {
      const call = functionCallPart.functionCall;
      const fnName = call.name;
      const args = call.args || {};

      console.log(`[AssistantAI] Executing Tool: ${fnName} with args:`, args);

      if (fnName === "update_product_price") {
        const result = await updateProductPrice(args.product_name, args.new_price, args.new_reseller_price);
        return result.success ? `✅ ${result.message}` : `❌ ${result.message}`;
      }

      if (fnName === "toggle_product_status") {
        const result = await toggleProductActive(args.product_name, args.is_active);
        return result.success ? `✅ ${result.message}` : `❌ ${result.message}`;
      }

      if (fnName === "get_revenue_report") {
        const rep = await getRevenueReport(args.period || "today");
        return `📊 <b>BÁO CÁO DOANH THU (${rep.period}):</b>\n\n• Số đơn đã thanh toán: <b>${rep.orderCount}</b> đơn\n• Tổng doanh thu: <b>${rep.totalRevenue.toLocaleString("vi-VN")}đ</b>\n\n<i>Cần chi tiết đơn nào bạn cứ nhắn mã đơn nhé!</i>`;
      }

      if (fnName === "check_product_stock") {
        const res = await checkProductStock(args.product_name);
        return res.message;
      }

      if (fnName === "sync_suppliers_catalog") {
        const res = await triggerSyncAllSuppliers();
        return res.message;
      }

      if (fnName === "lookup_order") {
        const res = await lookupOrder(args.order_code);
        if (!res.success || !res.order) return `❌ ${res.message}`;
        const ord = res.order;
        const items = ord.orderItems.map((i: any) => `  - ${i.product?.title || i.productId} x${i.quantity}`).join("\n");
        return `🔍 <b>THÔNG TIN ĐƠN ${ord.orderCode}:</b>\n• Khách hàng: <code>${ord.customerEmail || "Khách vãng lai"}</code>\n• Tổng tiền: <b>${ord.totalAmount.toLocaleString("vi-VN")}đ</b>\n• Trạng thái: <b>${ord.status}</b>\n• Sản phẩm:\n${items}\n• Upstream: <b>${ord.upstreamStatus}</b>`;
      }

      if (fnName === "list_products") {
        const list = await getProductCatalog({ search: args.search });
        if (list.length === 0) return "Không tìm thấy sản phẩm nào phù hợp.";
        const lines = list.map(
          (p) => `${p.isActive ? "🟢" : "🔴"} <b>${p.title}</b>: ${p.price.toLocaleString("vi-VN")}đ (Kho: ${p.localStock})`
        );
        return `📦 <b>DANH SÁCH SẢN PHẨM (${list.length}):</b>\n\n${lines.join("\n")}`;
      }
    }

    // Direct text response from Gemini
    const textPart = parts.find((p: any) => p.text);
    if (textPart && textPart.text) {
      return textPart.text;
    }

    return "Dạ tôi đã nhận lệnh từ bạn.";
  } catch (err: any) {
    console.error("[AssistantAI] Error handling message:", err);
    return `⚠️ Lỗi xử lý: ${err?.message || "Không xác định"}`;
  }
}
