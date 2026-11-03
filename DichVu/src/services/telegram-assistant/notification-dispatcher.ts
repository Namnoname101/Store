import { telegramBot } from "./telegram-bot-client";

function getAdminChatId(): string {
  return (
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    ""
  ).trim();
}

export async function sendAdminNotification(
  htmlText: string,
  replyMarkup?: any
): Promise<boolean> {
  const adminChatId = getAdminChatId();
  if (!adminChatId) {
    console.warn("[NotificationDispatcher] TELEGRAM_ADMIN_CHAT_ID is not configured. Notification dropped.");
    return false;
  }

  try {
    const res = await telegramBot.sendMessage(adminChatId, htmlText, {
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
    console.log("[NotificationDispatcher] Send result:", res?.ok ? "OK" : JSON.stringify(res));
    return Boolean(res?.ok);
  } catch (err: any) {
    console.error("[NotificationDispatcher] Failed to send notification:", err?.message || err);
    return false;
  }
}

/**
 * 1. Bắn tin thông báo khi có đơn thanh toán thành công
 */
export async function notifyOrderPaid(order: {
  orderCode: string;
  totalAmount: number;
  customerEmail?: string | null;
  items?: Array<{ title?: string; quantity: number }>;
}): Promise<boolean> {
  const itemsText = (order.items || [])
    .map((i) => `• <b>${i.title || "Sản phẩm"}</b> (x${i.quantity})`)
    .join("\n");

  const msg = `🔔 <b>CÓ ĐƠN HÀNG MỚI THANH TOÁN!</b>

• Mã đơn: <code>${order.orderCode}</code>
• Tổng tiền: <b>${order.totalAmount.toLocaleString("vi-VN")}đ</b>
• Khách hàng: <code>${order.customerEmail || "Khách vãng lai"}</code>
• Chi tiết:
${itemsText || "• Đang cập nhật..."}

⚡ <i>Hệ thống đang tiến hành cấp phát hàng tự động...</i>`;

  return sendAdminNotification(msg, {
    inline_keyboard: [
      [
        {
          text: "🔍 Xem chi tiết đơn",
          callback_data: `view_order:${order.orderCode}`,
        },
      ],
    ],
  });
}

/**
 * 2. Bắn tin thông báo giao hàng thành công
 */
export async function notifyFulfillmentSuccess(
  orderCode: string,
  itemSummary: string
): Promise<boolean> {
  const msg = `✅ <b>GIAO HÀNG TỰ ĐỘNG THÀNH CÔNG!</b>

• Mã đơn: <code>${orderCode}</code>
• Nội dung: ${itemSummary}
• Trạng thái: Đã gửi mã thẻ/tài khoản cho khách hàng.`;

  return sendAdminNotification(msg);
}

/**
 * 3. Bắn tin cảnh báo khi giao hàng tự động thất bại (cần can thiệp)
 */
export async function notifyFulfillmentFailure(
  orderCode: string,
  productTitle: string,
  errorReason: string
): Promise<boolean> {
  const msg = `🚨 <b>CẢNH BÁO: LỖI CẤP PHÁT ĐƠN HÀNG!</b>

• Mã đơn: <code>${orderCode}</code>
• Sản phẩm: <b>${productTitle}</b>
• Lý do lỗi: <i>${errorReason}</i>

⚠️ <i>Vui lòng kiểm tra ví bot nguồn hoặc cấp mã thủ công cho khách!</i>`;

  return sendAdminNotification(msg, {
    inline_keyboard: [
      [
        {
          text: "🔄 Thử lại đơn này",
          callback_data: `retry_order:${orderCode}`,
        },
        {
          text: "📦 Xem tồn kho",
          callback_data: "check_stock_all",
        },
      ],
    ],
  });
}

/**
 * 4. Cảnh báo hết kho
 */
export async function notifyLowStockAlert(
  productTitle: string,
  remainingStock: number
): Promise<boolean> {
  const msg = `⚠️ <b>CẢNH BÁO HẾT KHO:</b>

• Sản phẩm: <b>${productTitle}</b>
• Tồn kho hiện tại: <b>${remainingStock} slot</b>
• Đã kích hoạt chế độ chống hoàn tiền và tạm ẩn nút mua.`;

  return sendAdminNotification(msg);
}
