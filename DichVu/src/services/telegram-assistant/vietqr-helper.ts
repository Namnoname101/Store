import { telegramBot } from "./telegram-bot-client";

export interface VietQRParams {
  accountNo: string;
  accountName: string;
  bankId: string;
  amount: number;
  addInfo: string;
}

export interface SupplierDepositInfo {
  id: string;
  name: string;
  code: string;
  depositBankId?: string | null;
  depositAccountNo?: string | null;
  depositAccountName?: string | null;
  depositSyntax?: string | null;
  currentBalance?: number;
}

/**
 * Generates a PNG Buffer from VietQR API v2
 */
export async function generateVietQRPngBuffer(params: VietQRParams): Promise<Buffer | null> {
  try {
    const res = await fetch("https://api.vietqr.io/v2/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountNo: params.accountNo,
        accountName: params.accountName,
        acqId: params.bankId,
        amount: params.amount > 0 ? params.amount : undefined,
        addInfo: params.addInfo,
        format: "text",
        template: "compact2",
      }),
    });

    const data = await res.json();
    if (!data || data.code !== "00" || !data.data?.qrDataURL) {
      console.error("[VietQRHelper] Failed to generate QR:", data);
      return null;
    }

    const dataUrl: string = data.data.qrDataURL;
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  } catch (err: any) {
    console.error("[VietQRHelper] Exception in generateVietQRPngBuffer:", err.message);
    return null;
  }
}

/**
 * Sends a VietQR Top-up Photo to Admin on Telegram
 */
export async function sendSupplierTopupQR(opts: {
  chatId: string | number;
  supplier: SupplierDepositInfo;
  amount: number;
  orderCode?: string;
  isUrgentOrder?: boolean;
}): Promise<boolean> {
  const bankId = opts.supplier.depositBankId || "MB";
  const accountNo = opts.supplier.depositAccountNo || "0388888888";
  const accountName = opts.supplier.depositAccountName || "SHOP XOAI NON";
  const syntax = opts.supplier.depositSyntax || `NAP ${opts.chatId}`;

  const qrBuffer = await generateVietQRPngBuffer({
    bankId,
    accountNo,
    accountName,
    amount: opts.amount,
    addInfo: syntax,
  });

  if (!qrBuffer) {
    console.warn("[VietQRHelper] Unable to generate QR buffer, sending text fallback");
    const fallbackText = `⚠️ <b>KHÔNG TẠO ĐƯỢC ẢNH QR:</b>\n` +
      `🏢 NCC: <b>${opts.supplier.name}</b>\n` +
      `🏦 Ngân hàng: <b>${bankId}</b> | STK: <code>${accountNo}</code>\n` +
      `👤 Chủ TK: <b>${accountName}</b>\n` +
      `💵 Số tiền: <b>${opts.amount.toLocaleString("vi-VN")}đ</b>\n` +
      `📝 Cú pháp: <code>${syntax}</code>`;
    await telegramBot.sendMessage(opts.chatId, fallbackText);
    return false;
  }

  let caption = "";
  let replyMarkup: any = null;

  if (opts.isUrgentOrder && opts.orderCode) {
    caption =
      `🚨 <b>ĐƠN HÀNG CHỜ NẠP TIỀN NCC</b>\n\n` +
      `📦 Đơn hàng: <code>#${opts.orderCode}</code>\n` +
      `🏢 Nhà cung cấp: <b>${opts.supplier.name}</b>\n` +
      `💵 Cần nạp: <b>${opts.amount.toLocaleString("vi-VN")}đ</b>\n` +
      `🏦 Ngân hàng: <b>${bankId}</b> | STK: <code>${accountNo}</code>\n` +
      `👤 Chủ TK: <b>${accountName}</b>\n` +
      `📝 Cú pháp nạp: <code>${syntax}</code>\n\n` +
      `👉 <i>Quét mã VietQR trên để nạp ví bot nguồn. Sau khi nạp xong, bấm nút bên dưới để cấp hàng ngay cho khách!</i>`;

    replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "⚡ Đã nạp xong - Cấp hàng ngay cho khách",
            callback_data: `retry_order:${opts.orderCode}`,
          },
        ],
        [
          {
            text: "🔍 Xem chi tiết đơn",
            callback_data: `view_order:${opts.orderCode}`,
          },
          {
            text: "🔄 Kiểm tra số dư",
            callback_data: `check_balance:${opts.supplier.code}`,
          },
        ],
      ],
    };
  } else {
    caption =
      `💳 <b>MÃ NẠP TIỀN VÍ NHÀ CUNG CẤP</b>\n\n` +
      `🏢 Nhà cung cấp: <b>${opts.supplier.name}</b>\n` +
      `💵 Số tiền nạp: <b>${opts.amount.toLocaleString("vi-VN")}đ</b>\n` +
      `🏦 Ngân hàng: <b>${bankId}</b> | STK: <code>${accountNo}</code>\n` +
      `👤 Chủ TK: <b>${accountName}</b>\n` +
      `📝 Cú pháp nạp: <code>${syntax}</code>\n\n` +
      `👉 <i>Quét mã VietQR trên để nạp tiền vào ví. Hệ thống sẽ tự động ghi nhận biến động số dư!</i>`;

    replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "🔄 Kiểm tra số dư",
            callback_data: `check_balance:${opts.supplier.code}`,
          },
          {
            text: "🔙 Về Menu",
            callback_data: "cmd:main_menu",
          },
        ],
      ],
    };
  }

  const res = await telegramBot.sendPhoto(
    opts.chatId,
    qrBuffer,
    `vietqr_${opts.supplier.code}_${opts.amount}.png`,
    caption,
    { reply_markup: replyMarkup }
  );

  return Boolean(res?.ok);
}
