import { prisma } from "@/lib/prisma";

export interface OutOfStockAlertParams {
  orderCode: string;
  orderId: string;
  productTitle: string;
  productSlug?: string;
  quantity: number;
  totalAmount: number;
  customerEmail?: string | null;
}

/**
 * Sends notification to Admin when an order is paid but local warehouse is out of keys.
 * Supports Telegram Bot alerts, AuditLog records, and formatted console alerts.
 */
export async function notifyAdminOutOfStock(params: OutOfStockAlertParams): Promise<void> {
  const { orderCode, orderId, productTitle, quantity, totalAmount, customerEmail } = params;

  const alertLines = [
    `🚨 [CẢNH BÁO HẾT KEY - CẦN CẤP MÃ THỦ CÔNG]`,
    `📦 Đơn hàng: #${orderCode}`,
    `🏷️ Sản phẩm: ${productTitle}`,
    `🔢 Số lượng cần cấp: ${quantity}`,
    `💰 Tổng tiền đã thanh toán: ${totalAmount.toLocaleString("vi-VN")}đ`,
    customerEmail ? `✉️ Email khách: ${customerEmail}` : `👤 Khách: Khách vãng lai`,
    `⏱️ Khách hàng đang đợi tại màn hình nhận hàng!`,
    `👉 Vào Admin cấp ngay: https://daitruongstore.fly.dev/admin/orders`,
  ];

  const alertMessage = alertLines.join("\n");

  console.warn(`\n======================================================\n${alertMessage}\n======================================================\n`);

  // 1. Persist in AuditLog for Admin reconciliation
  try {
    await prisma.auditLog.create({
      data: {
        action: "OUT_OF_STOCK_PENDING_MANUAL",
        entityType: "ORDER",
        entityId: orderId,
        details: JSON.stringify({
          orderCode,
          productTitle,
          quantity,
          totalAmount,
          customerEmail,
          alertMessage,
          timestamp: new Date().toISOString(),
        }),
        performedBy: "SYSTEM",
      },
    });
  } catch (logErr) {
    console.error("Failed to write out-of-stock AuditLog:", logErr);
  }

  // 2. Dispatch Telegram Bot alert if configured in env
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: alertMessage,
          parse_mode: "HTML",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Telegram alert failed response:", errText);
      }
    } catch (teleErr) {
      console.error("Failed to send Telegram alert to admin:", teleErr);
    }
  }
}
