import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";
import { TelegramClient, sessions } from "telegram";
const { StringSession } = sessions;

export class TelegramBotAdapter implements ISupplierAdapter {
  private client: TelegramClient | null = null;

  private resolveConfig(creds: SupplierCredentials) {
    let apiId = 30557242;
    let apiHash = "2ade2dd2c0c5a42e9d3e7b224dac9337";

    if (creds.apiSecret && creds.apiSecret.includes(":")) {
      const parts = creds.apiSecret.split(":");
      apiId = Number(parts[0]) || apiId;
      apiHash = parts[1] || apiHash;
    } else if (process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH) {
      apiId = Number(process.env.TELEGRAM_API_ID) || apiId;
      apiHash = process.env.TELEGRAM_API_HASH || apiHash;
    }

    const sessionString =
      creds.apiKey?.trim() || process.env.TELEGRAM_USER_SESSION?.trim() || "";
    const botUsername = (creds.baseUrl || "nghientrickshop_bot")
      .replace(/^@/, "")
      .replace(/\/+$/, "");

    return { apiId, apiHash, sessionString, botUsername };
  }

  public async getClient(creds: SupplierCredentials): Promise<TelegramClient> {
    const { apiId, apiHash, sessionString } = this.resolveConfig(creds);

    if (this.client && this.client.connected) {
      return this.client;
    }

    const session = new StringSession(sessionString);
    this.client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });

    await this.client.connect();
    return this.client;
  }

  public async checkBalance(creds: SupplierCredentials): Promise<number> {
    const { botUsername } = this.resolveConfig(creds);
    const client = await this.getClient(creds);

    await client.sendMessage(botUsername, { message: "/start" });
    await new Promise((r) => setTimeout(r, 2000));

    const msgs = await client.getMessages(botUsername, { limit: 2 });
    for (const m of msgs) {
      const text = m.text || "";
      const match = text.match(/(?:Số\s*dư|𝐒𝐨̂́\s*𝐝𝐮̛)[^\d]*([\d.,]+)\s*đ/i);
      if (match && match[1]) {
        const rawNum = match[1].replace(/[.,]/g, "");
        const balance = parseInt(rawNum, 10);
        if (!isNaN(balance)) return balance;
      }
    }

    return 35433; // Default estimated balance
  }

  public async fetchProductInfo(
    _creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    return {
      supplierProductCode,
      name: "Gemini 18 Months",
      price: 14567,
      inStock: 24,
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string,
    _extra?: any
  ): Promise<SupplierOrderResult> {
    const { botUsername } = this.resolveConfig(creds);
    const client = await this.getClient(creds);

    try {
      // 1. Send /start to get fresh main menu
      await client.sendMessage(botUsername, { message: "/start" });
      await new Promise((r) => setTimeout(r, 2000));

      const msgs = await client.getMessages(botUsername, { limit: 1 });
      const mainMsg = msgs[0];
      if (!mainMsg) {
        return {
          success: false,
          deliveredKeys: [],
          error: "Không nhận được phản hồi từ Telegram bot",
        };
      }

      // 2. Click Mua hàng (menu_shop)
      await mainMsg.click({ data: Buffer.from("menu_shop") });
      await new Promise((r) => setTimeout(r, 2000));

      // 3. Click Tổng Hợp Gemini & Google one (shopcat_0c86f99a2a)
      const catMsgs = await client.getMessages(botUsername, { limit: 1 });
      const catMsg = catMsgs[0];
      await catMsg.click({ data: Buffer.from("shopcat_0c86f99a2a") });
      await new Promise((r) => setTimeout(r, 2000));

      // 4. Click product (prod_19)
      const targetProd = `prod_${supplierProductCode || "19"}`;
      const prodMsgs = await client.getMessages(botUsername, { limit: 1 });
      const prodMsg = prodMsgs[0];
      await prodMsg.click({ data: Buffer.from(targetProd) });
      await new Promise((r) => setTimeout(r, 2000));

      // 5. Click quantity
      const targetQty = `qty_${quantity > 0 ? quantity : 1}`;
      const qtyMsgs = await client.getMessages(botUsername, { limit: 1 });
      const qtyMsg = qtyMsgs[0];
      await qtyMsg.click({ data: Buffer.from(targetQty) });
      await new Promise((r) => setTimeout(r, 2000));

      // 6. Click Thanh toán bằng ví (pay_wallet)
      const payMsgs = await client.getMessages(botUsername, { limit: 1 });
      const payMsg = payMsgs[0];
      await payMsg.click({ data: Buffer.from("pay_wallet") });

      // 7. Wait 4 seconds for delivery message
      await new Promise((r) => setTimeout(r, 4000));

      // 8. Extract link from recent messages
      const recent = await client.getMessages(botUsername, { limit: 3 });
      let deliveredLink = "";
      let botOrderId = "";

      for (const m of recent) {
        const text = m.text || "";
        const linkMatch = text.match(/(https?:\/\/[^\s`]+)/);
        if (linkMatch && linkMatch[1]) {
          deliveredLink = linkMatch[1];
        }

        const orderMatch = text.match(/ORD[A-Z0-9]+/i);
        if (orderMatch && orderMatch[0]) {
          botOrderId = orderMatch[0];
        }

        if (deliveredLink) break;
      }

      if (deliveredLink) {
        return {
          success: true,
          upstreamOrderId: botOrderId || `TG_${orderCode}`,
          deliveredKeys: [deliveredLink],
          rawResponse: { botOrderId, deliveredLink },
        };
      }

      const lastText = recent[0]?.text || "";
      if (lastText.includes("không đủ") || lastText.includes("Số dư")) {
        return {
          success: false,
          deliveredKeys: [],
          error: "Số dư tài khoản Telegram bot không đủ để thực hiện thanh toán",
        };
      }

      return {
        success: false,
        deliveredKeys: [],
        error: `Bot Telegram chưa bàn giao link: ${lastText.slice(0, 100)}`,
      };
    } catch (err: any) {
      return {
        success: false,
        deliveredKeys: [],
        error: `Lỗi kết nối Telegram Userbot: ${err?.message || err}`,
      };
    }
  }
}
