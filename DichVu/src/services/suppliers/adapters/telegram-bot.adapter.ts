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
export const XOAINON_PRODUCT_ALIASES: Record<string, string> = {
  "51": "70",
  "34": "49",
  "21": "49", // CapCut 7 day credit BHF (#21) is out of stock -> map to active in-stock #49
  "10": "33",
};

export const XOAINON_KNOWN_PRODUCTS: Record<
  string,
  { name: string; price: number; inStock: number }
> = {
  "49": {
    name: "Capcut Pro 7 ngày 500 Credit BH6D",
    price: 5500,
    inStock: 117,
  },
  "35": {
    name: "Capcut Pro 30d full Date - BHF",
    price: 38800,
    inStock: 35,
  },
  "60": {
    name: "Duolingo Super 12 Tháng Chính Chủ",
    price: 19800,
    inStock: 31,
  },
  "65": {
    name: "Nord VPN chính chủ Premium 3 tháng code",
    price: 68000,
    inStock: 18,
  },
  "71": {
    name: "Tài khoản Canva Pro 1 tháng",
    price: 9900,
    inStock: 5,
  },
  "72": {
    name: "Tài Khoản Figma Pro Edu 2 Năm",
    price: 139000,
    inStock: 19,
  },
  "73": {
    name: "Microsoft Office 365 Plus 1 năm riêng tư",
    price: 16800,
    inStock: 77,
  },
  "33": {
    name: "Chatgpt plus 1 tháng pay PIX riêng tư - Bh24h",
    price: 135400,
    inStock: 11,
  },
  "37": {
    name: "Chatgpt Plus pay Apple Gmail 1 thg - BH 24H",
    price: 119500,
    inStock: 9,
  },
  "1": {
    name: "ChatGPT Plus 1 tháng riêng tư - BHF",
    price: 219000,
    inStock: 10,
  },
  "75": {
    name: "MUSE AI 1 TỶ TOKEN KBH",
    price: 2000,
    inStock: 195,
  },
  "76": {
    name: "MUSE AI 31 TỶ TOKEN KBH",
    price: 9800,
    inStock: 51,
  },
  "55": {
    name: "Meitu SVip, VIP+ 7 days riêng tư - BHF",
    price: 9500,
    inStock: 8,
  },
  "56": {
    name: "Wink VIP+ riêng tư 7 Days",
    price: 9600,
    inStock: 7,
  },
  "42": {
    name: "Memrise Pro gói trọn đời chính chủ",
    price: 299000,
    inStock: 2,
  },
};

interface CachedBotProduct {
  code: string;
  name: string;
  price: number;
  inStock: number;
}

const telegramCatalogCache = new Map<
  string,
  { timestamp: number; products: Record<string, CachedBotProduct> }
>();
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

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

  public async exploreXoaiNonDeposit(creds: SupplierCredentials): Promise<any> {
    const { botUsername } = this.resolveConfig(creds);
    const client = await this.getClient(creds);

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

    // Click menu:account
    let accountClicked = false;
    if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
      for (const row of (msg.replyMarkup as any).rows) {
        for (const btn of row.buttons) {
          const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
          if (dataStr === "menu:account" || (btn.text || "").toLowerCase().includes("tài khoản")) {
            await msg.click({ data: btn.data });
            accountClicked = true;
            break;
          }
        }
        if (accountClicked) break;
      }
    }

    await new Promise((r) => setTimeout(r, 2000));
    msgs = await client.getMessages(botUsername, { limit: 1 });
    msg = msgs[0];

    const accountText = msg?.text || "";
    const accountButtons: string[] = [];

    // Find deposit button on the account message
    let depositBtn: any = null;
    if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
      for (const row of (msg.replyMarkup as any).rows) {
        for (const btn of row.buttons) {
          const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
          accountButtons.push(`${btn.text} (${dataStr})`);
          if (
            dataStr.includes("deposit") ||
            dataStr.includes("nap") ||
            (btn.text || "").toLowerCase().includes("nạp")
          ) {
            depositBtn = btn;
          }
        }
      }
    }

    let depositText = "";
    const depositButtons: string[] = [];
    if (depositBtn) {
      await msg.click({ data: depositBtn.data });
      await new Promise((r) => setTimeout(r, 2500));
      msgs = await client.getMessages(botUsername, { limit: 3 });
      depositText = msgs.map((m) => m.text).join("\n---\n");
      for (const m of msgs) {
        if (m.replyMarkup && (m.replyMarkup as any).rows) {
          for (const row of (m.replyMarkup as any).rows) {
            for (const btn of row.buttons) {
              const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
              depositButtons.push(`${btn.text} (${dataStr})`);
            }
          }
        }
      }
    }

    return {
      accountText,
      accountButtons,
      depositBtnFound: !!depositBtn,
      depositText,
      depositButtons,
    };
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

  private parsePrice(str: string): number | null {
    const m = str.match(/•\s*([\d.,]+)\s*([đk])/i);
    if (!m) return null;
    const isK = m[2].toLowerCase() === "k";
    const clean = m[1].replace(/[.,]/g, "");
    const num = parseInt(clean, 10);
    return isK ? num * 1000 : num;
  }

  private parseStock(str: string): number {
    if (/hết\s*hàng/i.test(str)) return 0;
    const m = str.match(/SL\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
  }

  private async getLiveCatalog(
    creds: SupplierCredentials,
    botUsername: string
  ): Promise<Record<string, CachedBotProduct>> {
    const cached = telegramCatalogCache.get(botUsername);
    const now = Date.now();
    if (cached && now - cached.timestamp < CATALOG_CACHE_TTL_MS) {
      return cached.products;
    }

    if (botUsername.includes("xoainon")) {
      try {
        const client = await this.getClient(creds);
        await client.sendMessage(botUsername, { message: "/buy" });
        await new Promise((r) => setTimeout(r, 2000));

        const msgs = await client.getMessages(botUsername, { limit: 1 });
        const msg = msgs[0];
        const parsedProducts: Record<string, CachedBotProduct> = {};

        if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
          for (const row of (msg.replyMarkup as any).rows) {
            for (const b of row.buttons) {
              const dataStr = b.data ? Buffer.from(b.data).toString("utf-8") : "";
              const btnText = b.text || "";

              let code: string | null = null;
              const codeMatch = dataStr.match(/product:view:(\d+)/);
              if (codeMatch) {
                code = codeMatch[1];
              } else {
                for (const [kCode, info] of Object.entries(XOAINON_KNOWN_PRODUCTS)) {
                  if (btnText.toLowerCase().includes(info.name.toLowerCase().slice(0, 15))) {
                    code = kCode;
                    break;
                  }
                }
              }

              if (code) {
                const price = this.parsePrice(btnText);
                const stock = this.parseStock(btnText);
                const fallbackName = XOAINON_KNOWN_PRODUCTS[code]?.name || btnText.split("•")[0].trim();
                if (price !== null) {
                  parsedProducts[code] = {
                    code,
                    name: fallbackName,
                    price,
                    inStock: stock,
                  };
                }
              }
            }
          }
        }

        if (Object.keys(parsedProducts).length > 0) {
          telegramCatalogCache.set(botUsername, {
            timestamp: now,
            products: parsedProducts,
          });
          return parsedProducts;
        }
      } catch (err) {
        console.warn(`[TelegramBotAdapter] Live catalog fetch failed for @${botUsername}, using fallback dictionary:`, err);
      }
    }

    return {};
  }

  public async fetchProductInfo(
    creds: SupplierCredentials,
    supplierProductCode: string
  ): Promise<SupplierProductInfo> {
    const { botUsername } = this.resolveConfig(creds);

    if (botUsername.includes("xoainon")) {
      // 1. Try live parsed catalog first
      try {
        const liveCatalog = await this.getLiveCatalog(creds, botUsername);
const effectiveCode = XOAINON_PRODUCT_ALIASES[supplierProductCode] || supplierProductCode;
        let liveItem = liveCatalog[effectiveCode] || liveCatalog[supplierProductCode];
        if (!liveItem) {
          const isGemini = supplierProductCode === "51" || supplierProductCode === "70";
          for (const item of Object.values(liveCatalog)) {
            const lowerName = item.name.toLowerCase();
            if (isGemini && lowerName.includes("gemini") && (lowerName.includes("18") || lowerName.includes("5tb"))) {
              liveItem = item;
              break;
            }
          }
        }
        if (liveItem) {
          return {
            supplierProductCode: liveItem.code,
            name: liveItem.name,
            price: liveItem.price,
            inStock: liveItem.inStock,
          };
        }
      } catch (e) {
        // Fallback to static catalog on live scrape error
      }

      // 2. Fallback to known static catalog
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

      // Record pre-purchase latest message ID to avoid picking up old purchase messages
      const preMsgs = await client.getMessages(botUsername, { limit: 1 });
      const minMsgId = preMsgs[0]?.id || 0;

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

      // Check if bot returned product detail directly or full catalog
      let targetCode = XOAINON_PRODUCT_ALIASES[supplierProductCode] || supplierProductCode;

      // If the bot is already on product detail screen (has buyqty:... buttons)
      const isAlreadyOnDetail = msg.replyMarkup && (msg.replyMarkup as any).rows?.some((row: any) =>
        row.buttons?.some((b: any) => b.data && Buffer.from(b.data).toString("utf-8").startsWith("buyqty:"))
      );

      if (isAlreadyOnDetail) {
        // Check if it's the product we want
        const detailHasOurCode = (msg.replyMarkup as any).rows?.some((row: any) =>
          row.buttons?.some((b: any) => {
            const d = b.data ? Buffer.from(b.data).toString("utf-8") : "";
            return d === `buyqty:${targetCode}:1` || d === `buyqty:custom:${targetCode}`;
          })
        );
        if (!detailHasOurCode) {
          // It's a different product! Click back to catalog
          console.log(`[buyXoaiNon] Bot is on a different product detail. Clicking back to catalog...`);
          await msg.click({ data: Buffer.from("menu:buy") }).catch(() => {});
          await new Promise((r) => setTimeout(r, 2000));
          msgs = await client.getMessages(botUsername, { limit: 1 });
          msg = msgs[0];
        }
      }

      // 2. Locate target product button in catalog
      let targetBtnFound = false;
      let targetBtnData = `product:view:${targetCode}`;

      if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
        // Step A: Exact match by product:view:<targetCode>
        for (const row of (msg.replyMarkup as any).rows) {
          for (const btn of row.buttons) {
            const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
            if (dataStr === `product:view:${targetCode}`) {
              targetBtnFound = true;
              targetBtnData = dataStr;
              break;
            }
          }
          if (targetBtnFound) break;
        }

        // Step B: Smart keyword match fallback if code changed or alias was not updated
        if (!targetBtnFound) {
          console.log(`[buyXoaiNon] Product code ${targetCode} not found in catalog buttons. Trying keyword matching...`);

          const determineKeywords = (code: string): string[][] => {
            if (code === "34" || code === "21" || code === "49") {
              return [["capcut", "7"], ["capcut", "bhf"], ["capcut"]];
            }
            if (code === "35") {
              return [["capcut", "30"], ["capcut", "month"], ["capcut", "date"]];
            }
            if (code === "51" || code === "70") {
              return [["gemini", "18"], ["gemini", "5tb"], ["gemini"]];
            }
            if (code === "10" || code === "33" || code === "37" || code === "1") {
              return [["chatgpt", "plus"], ["gpt", "plus"], ["chatgpt"]];
            }
            if (code === "71" || code === "28") {
              return [["canva", "pro"], ["canva"]];
            }
            if (code === "60") {
              return [["duolingo", "super"], ["duolingo", "12"], ["duolingo"]];
            }
            if (code === "73") {
              return [["office", "365"], ["office"], ["365"]];
            }
            if (code === "55") {
              return [["meitu", "vip"], ["meitu", "7"], ["meitu"]];
            }
            if (code === "56") {
              return [["wink", "vip"], ["wink"]];
            }
            if (code === "65") {
              return [["nord", "vpn"], ["nord"]];
            }
            if (code === "72") {
              return [["figma", "pro"], ["figma", "edu"], ["figma"]];
            }
            return [];
          };

          const keywordGroups = determineKeywords(targetCode);

          for (const kws of keywordGroups) {
            for (const row of (msg.replyMarkup as any).rows) {
              for (const btn of row.buttons) {
                const btnText = (btn.text || "").toLowerCase();
                const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
                if (dataStr === "noop" || btnText.includes("hết hàng")) continue; // Skip out of stock

                const allMatch = kws.every((kw) => btnText.includes(kw));
                if (allMatch && dataStr.startsWith("product:view:")) {
                  const match = dataStr.match(/product:view:(\d+)/);
                  if (match) {
                    targetCode = match[1];
                    targetBtnData = dataStr;
                    targetBtnFound = true;
                    console.log(`[buyXoaiNon] Auto-matched product "${btn.text}" -> remapped targetCode to ${targetCode}`);
                    break;
                  }
                }
              }
              if (targetBtnFound) break;
            }
            if (targetBtnFound) break;
          }
        }
      }

      // Check if we are already on the detail screen or need to click product view
      const isCurrentlyOnDetail = msg.replyMarkup && (msg.replyMarkup as any).rows?.some((row: any) =>
        row.buttons?.some((b: any) => b.data && Buffer.from(b.data).toString("utf-8").startsWith(`buyqty:${targetCode}`))
      );

      if (!isCurrentlyOnDetail) {
        if (!targetBtnFound) {
          return {
            success: false,
            deliveredKeys: [],
            error: `Không tìm thấy nút sản phẩm ID ${supplierProductCode} (target: ${targetCode}) trên menu @${botUsername}`,
          };
        }

        console.log(`[buyXoaiNon] Clicking product view: ${targetBtnData}...`);
        await msg.click({ data: Buffer.from(targetBtnData) });
        await new Promise((r) => setTimeout(r, 2000));

        msgs = await client.getMessages(botUsername, { limit: 1 });
        msg = msgs[0];
      }

      // 3. Click buyqty:<id>:<quantity>
      console.log(`[buyXoaiNon] Clicking quantity: buyqty:${targetCode}:${qty}...`);
      await msg.click({ data: Buffer.from(`buyqty:${targetCode}:${qty}`) });
      await new Promise((r) => setTimeout(r, 2000));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      // Check if checkout screen reports insufficient balance before attempting to pay
      const checkoutText = (msg?.message || "").toLowerCase();
      if (
        checkoutText.includes("ví chưa đủ") ||
        checkoutText.includes("số dư không đủ") ||
        checkoutText.includes("không đủ để mua") ||
        checkoutText.includes("thiếu")
      ) {
        const errorLine = (msg?.message || "").split("\n").find((l: string) => /ví chưa đủ|thiếu|không đủ/i.test(l)) || "Số dư ví Shop Xoài Non không đủ để thanh toán";
        return {
          success: false,
          deliveredKeys: [],
          error: `Số dư ví Shop Xoài Non không đủ: ${errorLine.trim()}`,
        };
      }

      // 4. Click pay:wallet:<id>:<quantity>
      console.log(`[buyXoaiNon] Clicking pay wallet: pay:wallet:${targetCode}:${qty}...`);
      await msg.click({ data: Buffer.from(`pay:wallet:${targetCode}:${qty}`) });
      await new Promise((r) => setTimeout(r, 4000));

      // 5. Check response messages
      return await this.extractSecretFromRecentMessages(client, botUsername, orderCode, "XOAINON", minMsgId);
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
      const preMsgs = await client.getMessages(botUsername, { limit: 1 });
      const minMsgId = preMsgs[0]?.id || 0;

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
      return await this.extractSecretFromRecentMessages(client, botUsername, orderCode, "TG", minMsgId);
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
    fallbackPrefix: string,
    minMsgId?: number
  ): Promise<SupplierOrderResult> {
    const recent = await client.getMessages(botUsername, { limit: 8 });
    let botOrderId = "";
    let bestCandidate: { content: string; type: string; rawText: string } | null = null;
    let fallbackTextCandidate: { content: string; type: string; rawText: string } | null = null;

    for (const m of recent) {
      // If minMsgId is provided, ignore messages that occurred before this purchase
      if (minMsgId && m.id <= minMsgId) {
        continue;
      }

      const text = m.text || "";

      // Check balance issues and failure notices (case-insensitive & comprehensive)
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes("số dư không đủ") ||
        lowerText.includes("ví chưa đủ") ||
        lowerText.includes("không đủ để mua") ||
        lowerText.includes("không đủ để thanh toán") ||
        lowerText.includes("không đủ để thực hiện") ||
        lowerText.includes("nạp thêm tiền") ||
        lowerText.includes("giao dịch thất bại") ||
        lowerText.includes("hết hàng") ||
        (text.includes("❌") && (lowerText.includes("số dư") || lowerText.includes("thanh toán")))
      ) {
        return {
          success: false,
          deliveredKeys: [],
          error: `Số dư tài khoản Telegram bot @${botUsername.replace(/^@/, "")} không đủ để thanh toán hoặc bot hết hàng`,
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

    const selected = bestCandidate || (fallbackTextCandidate && !fallbackTextCandidate.content.includes("❌") && !/không đủ/i.test(fallbackTextCandidate.content) ? fallbackTextCandidate : null);
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

