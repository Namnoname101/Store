/**
 * Telegram Bot API Client
 * Uses native fetch in Node.js 20 - Zero external dependencies.
 */

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageOptions {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
      text?: string;
    };
    data?: string;
  };
}

export class TelegramBotClient {
  private explicitToken?: string;

  constructor(token?: string) {
    this.explicitToken = token;
  }

  public getBotToken(): string {
    return (
      this.explicitToken ||
      process.env.TELEGRAM_ASSISTANT_BOT_TOKEN ||
      process.env.TELEGRAM_BOT_TOKEN ||
      ""
    ).trim();
  }

  private get baseUrl(): string {
    return `https://api.telegram.org/bot${this.getBotToken()}`;
  }

  public isConfigured(): boolean {
    return Boolean(this.getBotToken());
  }

  public async getMe(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/getMe`);
    const data = await res.json();
    return data;
  }

  public async sendMessage(
    chatId: string | number,
    text: string,
    options?: SendMessageOptions
  ): Promise<any> {
    if (!this.isConfigured()) return { ok: false, error: "Bot token not configured" };

    const payload: Record<string, any> = {
      chat_id: chatId,
      text: text,
      parse_mode: options?.parse_mode || "HTML",
      disable_web_page_preview: options?.disable_web_page_preview ?? true,
    };

    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      console.error("[TelegramBotClient] sendMessage failed:", err?.message || err);
      return { ok: false, error: err?.message };
    }
  }

  public async sendPhoto(
    chatId: string | number,
    photoBuffer: Buffer,
    filename: string = "vietqr.png",
    caption?: string,
    options?: SendMessageOptions
  ): Promise<any> {
    if (!this.isConfigured()) return { ok: false, error: "Bot token not configured" };

    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    const blob = new Blob([new Uint8Array(photoBuffer)], { type: "image/png" });
    formData.append("photo", blob, filename);

    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", options?.parse_mode || "HTML");
    }

    if (options?.reply_markup) {
      formData.append("reply_markup", JSON.stringify(options.reply_markup));
    }

    try {
      const res = await fetch(`${this.baseUrl}/sendPhoto`, {
        method: "POST",
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      console.error("[TelegramBotClient] sendPhoto failed:", err?.message || err);
      return { ok: false, error: err?.message };
    }
  }

  public async editMessageText(
    chatId: string | number,
    messageId: number,
    text: string,
    options?: SendMessageOptions
  ): Promise<any> {
    if (!this.isConfigured()) return { ok: false, error: "Bot token not configured" };

    const payload: Record<string, any> = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: options?.parse_mode || "HTML",
      disable_web_page_preview: options?.disable_web_page_preview ?? true,
    };

    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    try {
      const res = await fetch(`${this.baseUrl}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      console.error("[TelegramBotClient] editMessageText failed:", err?.message || err);
      return { ok: false, error: err?.message };
    }
  }

  public async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert: boolean = false
  ): Promise<any> {
    if (!this.isConfigured()) return { ok: false, error: "Bot token not configured" };

    try {
      await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          show_alert: showAlert,
        }),
      });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message };
    }
  }

  public async getUpdates(offset: number = 0, timeout: number = 25): Promise<TelegramUpdate[]> {
    if (!this.isConfigured()) return [];

    try {
      const res = await fetch(
        `${this.baseUrl}/getUpdates?offset=${offset}&timeout=${timeout}&allowed_updates=["message","callback_query"]`
      );
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        return data.result;
      }
      return [];
    } catch (err: any) {
      console.error("[TelegramBotClient] getUpdates failed:", err?.message || err);
      return [];
    }
  }

  public async deleteWebhook(): Promise<any> {
    if (!this.isConfigured()) return { ok: false };
    try {
      const res = await fetch(`${this.baseUrl}/deleteWebhook`);
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err?.message };
    }
  }
}

export const telegramBot = new TelegramBotClient();
