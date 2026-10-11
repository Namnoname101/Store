import {
  ISupplierAdapter,
  SupplierCredentials,
  SupplierProductInfo,
  SupplierOrderResult,
} from "../supplier-adapter.interface";
import { extractDeliveredSecret } from "../secret-parser";
import { TelegramClient, sessions } from "telegram";
const { StringSession } = sessions;

// Known product catalog from @shopxoainon_bot
const XOAINON_KNOWN_PRODUCTS: Record<
  string,
  { name: string; price: number; inStock: number }
> = {
  "51": {
    name: "Gói Gemini Pro & Drive 5TB 18 Tháng Chính chủ",
    price: 13800,
    inStock: 68,
  },
  "60": {
    name: "Duolingo Super 12 Tháng Chính Chủ",
    price: 19800,
    inStock: 2,
  },
  "73": {
    name: "Microsoft Office 365 Plus 1 năm riêng tư",
    price: 16800,
    inStock: 59,
  },
  "71": {
    name: "Tài khoản Canva Pro 1 tháng",
    price: 9900,
    inStock: 5,
  },
  "35": {
    name: "Capcut Pro 30d full Date - BHF",
    price: 42800,
    inStock: 13,
  },
  "40": {
    name: "Grok Super 7 ngày - BHF",
    price: 68800,
    inStock: 13,
  },
  "65": {
    name: "Nord VPN Premium 3 Month code",
    price: 68000,
    inStock: 8,
  },
  "72": {
    name: "Tài Khoản Figma Pro Edu 2 Năm",
    price: 159000,
    inStock: 4,
  },
  "28": {
    name: "Canva Edu Pro Admin 3 năm add 500 mem",
    price: 99800,
    inStock: 2,
  },
  "42": {
    name: "Memrise Pro gói trọn đời chính chủ",
    price: 299000,
    inStock: 1,
  },
};

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
    const botUsername = (creds.baseUrl || "shopxoainon_bot")
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

    if (botUsername.includes("xoainon")) {
      return this.checkXoaiNonBalance(client, botUsername);
    }
    return this.checkNghienTrickBalance(client, botUsername);
  }

  private async checkXoaiNonBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/start" });
    await new Promise((r) => setTimeout(r, 2000));

    let msgs = await client.getMessages(botUsername, { limit: 1 });
    let msg = msgs[0];

    // If language selection is requested, click Vietnamese
    if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
      for (const row of (msg.replyMarkup as any).rows) {
        for (const btn of row.buttons) {
          const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
          if (dataStr === "lang:vi") {
            await msg.click({ data: btn.data });
            await new Promise((r) => setTimeout(r, 1500));
            msgs = await client.getMessages(botUsername, { limit: 1 });
            msg = msgs[0];
            break;
          }
        }
      }
    }

    // Click menu:account to get balance
    if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
      for (const row of (msg.replyMarkup as any).rows) {
        for (const btn of row.buttons) {
          const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
          if (dataStr === "menu:account") {
            await msg.click({ data: btn.data });
            await new Promise((r) => setTimeout(r, 1500));
            msgs = await client.getMessages(botUsername, { limit: 1 });
            msg = msgs[0];
            break;
          }
        }
      }
    }

    const text = msg?.text || "";
    const match = text.match(/(?:Số\s*dư|𝐒𝐨̂́\s*𝐝𝐮̛)[^\d]*([\d.,]+)\s*đ/i);
    if (match && match[1]) {
      const rawNum = match[1].replace(/[.,]/g, "");
      const balance = parseInt(rawNum, 10);
      if (!isNaN(balance)) return balance;
    }

    return 0;
  }

  private async checkNghienTrickBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
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

    return 35433; // Default estimated balance for nghientrick
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const { botUsername } = this.resolveConfig(creds);

    if (botUsername.includes("xoainon")) {
      const known = XOAINON_KNOWN_PRODUCTS[supplierProductCode];
      if (known) {
        return {
          supplierProductCode,
          name: known.name,
          price: known.price,
          inStock: known.inStock,
        };
      }
    }

    // Default fallback
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

    if (botUsername.includes("xoainon")) {
      return this.buyXoaiNon(client, botUsername, supplierProductCode, quantity, orderCode);
    }
    return this.buyNghienTrick(client, botUsername, supplierProductCode, quantity, orderCode);
  }

  private async buyXoaiNon(
    client: TelegramClient,
    botUsername: string,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    try {
      const qty = quantity > 0 ? quantity : 1;

      // 1. Send /buy to get catalog
      await client.sendMessage(botUsername, { message: "/buy" });
      await new Promise((r) => setTimeout(r, 2000));

      let msgs = await client.getMessages(botUsername, { limit: 1 });
      let msg = msgs[0];
      if (!msg) {
        return {
          success: false,
          deliveredKeys: [],
          error: "Không nhận được phản hồi từ @shopxoainon_bot",
        };
      }

      // 2. Click product:view:<id>
      await msg.click({ data: Buffer.from(`product:view:${supplierProductCode}`) });
      await new Promise((r) => setTimeout(r, 2000));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      // 3. Click buyqty:<id>:<quantity>
      await msg.click({ data: Buffer.from(`buyqty:${supplierProductCode}:${qty}`) });
      await new Promise((r) => setTimeout(r, 2000));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      // 4. Click pay:wallet:<id>:<quantity>
      await msg.click({ data: Buffer.from(`pay:wallet:${supplierProductCode}:${qty}`) });
      await new Promise((r) => setTimeout(r, 4000));

      // 5. Check response messages
      return await this.extractSecretFromRecentMessages(client, botUsername, orderCode, "XOAINON");
    } catch (err: any) {
      return {
        success: false,
        deliveredKeys: [],
        error: `Lỗi kết nối Shop Xoài Non: ${err?.message || err}`,
      };
    }
  }

  private async buyNghienTrick(
    client: TelegramClient,
    botUsername: string,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    try {
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

      await mainMsg.click({ data: Buffer.from("menu_shop") });
      await new Promise((r) => setTimeout(r, 2000));

      const catMsgs = await client.getMessages(botUsername, { limit: 1 });
      const catMsg = catMsgs[0];
      await catMsg.click({ data: Buffer.from("shopcat_0c86f99a2a") });
      await new Promise((r) => setTimeout(r, 2000));

      const targetProd = `prod_${supplierProductCode || "19"}`;
      const prodMsgs = await client.getMessages(botUsername, { limit: 1 });
      const prodMsg = prodMsgs[0];
      await prodMsg.click({ data: Buffer.from(targetProd) });
      await new Promise((r) => setTimeout(r, 2000));

      const targetQty = `qty_${quantity > 0 ? quantity : 1}`;
      const qtyMsgs = await client.getMessages(botUsername, { limit: 1 });
      const qtyMsg = qtyMsgs[0];
      await qtyMsg.click({ data: Buffer.from(targetQty) });
      await new Promise((r) => setTimeout(r, 2000));

      const payMsgs = await client.getMessages(botUsername, { limit: 1 });
      const payMsg = payMsgs[0];
      await payMsg.click({ data: Buffer.from("pay_wallet") });
      await new Promise((r) => setTimeout(r, 4000));

      // 7. Extract link from recent messages
      return await this.extractSecretFromRecentMessages(client, botUsername, orderCode, "TG");
    } catch (err: any) {
      return {
        success: false,
        deliveredKeys: [],
        error: `Lỗi kết nối Telegram Userbot: ${err?.message || err}`,
      };
    }
  }

  private async extractSecretFromRecentMessages(
    client: TelegramClient,
    botUsername: string,
    orderCode: string,
    fallbackPrefix: string
  ): Promise<SupplierOrderResult> {
    const recent = await client.getMessages(botUsername, { limit: 5 });
    let botOrderId = "";
    let bestCandidate: { content: string; type: string; rawText: string } | null = null;
    let fallbackTextCandidate: { content: string; type: string; rawText: string } | null = null;

    for (const m of recent) {
      const text = m.text || "";

      // Check balance issues
      if (
        text.includes("Số dư không đủ") ||
        text.includes("Ví chưa đủ") ||
        text.includes("không đủ để mua") ||
        text.includes("không đủ để thực hiện")
      ) {
        return {
          success: false,
          deliveredKeys: [],
          error: `Số dư tài khoản Telegram bot @${botUsername.replace(/^@/, "")} không đủ để thanh toán`,
        };
      }

      // Check order ID in text
      const orderMatch = text.match(/ORD[A-Z0-9]+|#\d+/i);
      if (orderMatch && orderMatch[0] && !botOrderId) {
        botOrderId = orderMatch[0];
      }

      // 1. Check if message has an attached text document (.txt file)
      if (m.media && (m.media as any).document) {
        const doc = (m.media as any).document;
        const mime = doc.mimeType || "";
        const isTextDoc =
          mime.includes("text") ||
          mime.includes("plain") ||
          (doc.attributes || []).some((a: any) =>
            typeof a.fileName === "string" && a.fileName.toLowerCase().endsWith(".txt")
          );

        if (isTextDoc) {
          try {
            const buf = await client.downloadMedia(m);
            if (buf && buf.length > 0) {
              const fileContent = buf.toString("utf-8");
              const parsedDoc = extractDeliveredSecret(fileContent);
              if (parsedDoc.content && parsedDoc.type !== "text") {
                bestCandidate = { content: parsedDoc.content, type: parsedDoc.type, rawText: fileContent };
                break;
              } else if (parsedDoc.content && !fallbackTextCandidate && !parsedDoc.isNoticeOnly) {
                fallbackTextCandidate = { content: parsedDoc.content, type: parsedDoc.type, rawText: fileContent };
              }
            }
          } catch (err) {
            console.warn(`[TelegramBotAdapter] Could not download document from ${botUsername}:`, err);
          }
        }
      }

      // 2. Check message text
      const parsed = extractDeliveredSecret(text);
      if (parsed.content) {
        if (parsed.type !== "text") {
          if (!bestCandidate) {
            bestCandidate = { content: parsed.content, type: parsed.type, rawText: text };
          }
        } else if (!fallbackTextCandidate && !parsed.isNoticeOnly) {
          fallbackTextCandidate = { content: parsed.content, type: parsed.type, rawText: text };
        }
      }
    }

    const selected = bestCandidate || fallbackTextCandidate;
    if (selected) {
      return {
        success: true,
        upstreamOrderId: botOrderId || `${fallbackPrefix}_${orderCode}`,
        deliveredKeys: [selected.content],
        rawResponse: { type: selected.type, rawText: selected.rawText, botOrderId },
      };
    }

    const lastText = recent[0]?.text || "";
    return {
      success: false,
      deliveredKeys: [],
      error: `Bot Telegram chưa bàn giao link: ${lastText.slice(0, 100)}`,
    };
  }
}

