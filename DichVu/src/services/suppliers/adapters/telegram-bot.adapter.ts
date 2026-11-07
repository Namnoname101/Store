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
  "34": "21", // Legacy CapCut 7 day (#34) -> active in-stock #21
  "49": "21", // Legacy CapCut 7 day credit (#49) -> active in-stock #21
  "10": "33",
};

export const XOAINON_KNOWN_PRODUCTS: Record<
  string,
  { name: string; price: number; inStock: number }
> = {
  "21": {
    name: "Capcut Pro 7 day BHF",
    price: 3900,
    inStock: 13,
  },
  "49": {
    name: "Capcut Pro 7 ngày 500 Credit BH6D",
    price: 5500,
    inStock: 117,
  },
  "35": {
    name: "Capcut Pro 30d full Date - BHF",
    price: 32900,
    inStock: 11,
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
  "70": {
    name: "Gemini Pro 18 tháng chính hãng",
    price: 21800,
    inStock: 56,
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
    if (botUsername.includes("KhoMMO") || botUsername.includes("khommo")) {
      return this.checkKhoMmoBalance(client, botUsername);
    }
    if (botUsername.includes("dkeyshop")) {
      return this.checkDKeyShopBalance(client, botUsername);
    }
    if (botUsername.includes("toki_shopmmo")) {
      return this.checkTokiShopBalance(client, botUsername);
    }
    if (botUsername.includes("ShopHXN") || botUsername.includes("shophxn")) {
      return this.checkShopHXNBalance(client, botUsername);
    }
    if (botUsername.includes("chodaumoi")) {
      return this.checkChoDauMoiBalance(client, botUsername);
    }
    if (botUsername.includes("hihistore")) {
      return this.checkHiHistoreBalance(client, botUsername);
    }
    if (botUsername.includes("timecloudorder")) {
      return this.checkTimeCloudBalance(client, botUsername);
    }
    if (botUsername.includes("mmo_dshop") || botUsername.includes("dshop")) {
      return this.checkDShopBalance(client, botUsername);
    }
    return this.checkNghienTrickBalance(client, botUsername);
  }

  /**
   * Helper: parse VND balance from texts like:
   *   "VND: 50.000 ~ $2.00"  → 50000
   *   "VND: 0k"               → 0
   *   "VND: 50k"              → 50000
   *   "Số dư khả dụng: 50.000đ" → 50000
   *   "Số dư ví: 50000 VND"  → 50000
   *   "Số dư tài khoản: 50.000 ₫" → 50000
   */
  private parseBalanceFromText(text: string): number | null {
    // Pattern: "VND: 50.000 ~ $..." or "VND: 50k"
    const vndTilde = text.match(/VND:\s*([\d.,]+)\s*(?:~|\s|$)/i);
    if (vndTilde) {
      const raw = vndTilde[1].replace(/\./g, "").replace(/,/g, "");
      if (raw.endsWith("k") || raw.endsWith("K")) {
        return parseInt(raw.slice(0, -1), 10) * 1000;
      }
      const n = parseInt(raw, 10);
      if (!isNaN(n)) return n;
    }

    // Pattern: "Số dư ...: 50.000đ" or "50 ₫" or "50000 VND"
    const soduMatch = text.match(
      /(?:Số\s*dư[^:]*:|balance[^:]*:)\s*([\d.,]+)\s*(?:đ|₫|VND|vnđ|vnd)/i
    );
    if (soduMatch) {
      const raw = soduMatch[1].replace(/[.,]/g, "");
      const n = parseInt(raw, 10);
      if (!isNaN(n)) return n;
    }

    // Fallback: any "Số dư" followed by number + currency
    const fallback = text.match(/Số\s*dư[^0-9]*([\d.,]+)\s*(?:đ|₫|VND)/i);
    if (fallback) {
      const raw = fallback[1].replace(/[.,]/g, "");
      const n = parseInt(raw, 10);
      if (!isNaN(n)) return n;
    }

    return null;
  }

  /** KhoMMO_Market_bot: /wallet → "VND: X ~ $Y" */
  private async checkKhoMmoBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/wallet" });
    await new Promise((r) => setTimeout(r, 2500));
    const msgs = await client.getMessages(botUsername, { limit: 2 });
    for (const m of msgs) {
      const bal = this.parseBalanceFromText(m.text || "");
      if (bal !== null) return bal;
    }
    return 0;
  }

  /** dkeyshop_bot + ShopHXN_bot: /wallet → "VND: Xk" */
  private async checkDKeyShopBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/wallet" });
    await new Promise((r) => setTimeout(r, 2500));
    const msgs = await client.getMessages(botUsername, { limit: 2 });
    for (const m of msgs) {
      const text = m.text || "";
      // "VND: 50k" or "VND: 0k"
      const match = text.match(/VND:\s*([\d.]+)k/i);
      if (match) {
        const n = parseFloat(match[1].replace(/\./g, "")) * 1000;
        return Math.round(n);
      }
      // Try generic parser
      const bal = this.parseBalanceFromText(text);
      if (bal !== null) return bal;
    }
    return 0;
  }

  /** ShopHXN_bot: same system as dkeyshop */
  private async checkShopHXNBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    return this.checkDKeyShopBalance(client, botUsername);
  }

  /** toki_shopmmo_bot: /wallet → "Số dư khả dụng: Xđ" */
  private async checkTokiShopBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/wallet" });
    await new Promise((r) => setTimeout(r, 2500));
    const msgs = await client.getMessages(botUsername, { limit: 2 });
    for (const m of msgs) {
      const bal = this.parseBalanceFromText(m.text || "");
      if (bal !== null) return bal;
    }
    return 0;
  }

  /**
   * chodaumoi_bot: /start → click reply keyboard button "Ví"
   * (buttons are ReplyKeyboardMarkup with text only, no callback data)
   */
  private async checkChoDauMoiBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/start" });
    await new Promise((r) => setTimeout(r, 2000));

    // This bot uses ReplyKeyboardMarkup – just send the button text as a message
    await client.sendMessage(botUsername, { message: "Ví" });
    await new Promise((r) => setTimeout(r, 2500));

    const msgs = await client.getMessages(botUsername, { limit: 3 });
    for (const m of msgs) {
      if (m.out) continue;
      const text = m.text || "";
      // History showed: "💰 Số dư ví của bạn: 0đ"
      const bal = this.parseBalanceFromText(text);
      if (bal !== null) return bal;
    }
    return 0;
  }

  /** hihistorebot (PQV Store): /deposit or /start → "Số dư tài khoản: X ₫" */
  private async checkHiHistoreBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/start" });
    await new Promise((r) => setTimeout(r, 2500));
    const msgs = await client.getMessages(botUsername, { limit: 2 });
    for (const m of msgs) {
      const text = m.text || "";
      // "💰 Số dư tài khoản: 0 ₫"
      const match = text.match(/Số\s*dư\s*tài\s*khoản\s*:\s*([\d.,]+)\s*[₫đ]/i);
      if (match) {
        const n = parseInt(match[1].replace(/[.,]/g, ""), 10);
        if (!isNaN(n)) return n;
      }
      const bal = this.parseBalanceFromText(text);
      if (bal !== null) return bal;
    }
    return 0;
  }

  /** timecloudorderbot: /start → "Số dư ví: X VND" */
  private async checkTimeCloudBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/start" });
    await new Promise((r) => setTimeout(r, 2500));
    const msgs = await client.getMessages(botUsername, { limit: 2 });
    for (const m of msgs) {
      const text = m.text || "";
      // "💳 Số dư ví: 0 VND"
      const match = text.match(/Số\s*dư\s*ví\s*:\s*([\d.,]+)\s*VND/i);
      if (match) {
        const n = parseInt(match[1].replace(/[.,]/g, ""), 10);
        if (!isNaN(n)) return n;
      }
      const bal = this.parseBalanceFromText(text);
      if (bal !== null) return bal;
    }
    return 0;
  }

  /**
   * mmo_dshop_bot: /start → click inline button "wallet" (callback_data: "wallet")
   * Then parse balance from reply.
   */
  private async checkDShopBalance(
    client: TelegramClient,
    botUsername: string
  ): Promise<number> {
    await client.sendMessage(botUsername, { message: "/start" });
    await new Promise((r) => setTimeout(r, 2000));

    let msgs = await client.getMessages(botUsername, { limit: 1 });
    let msg = msgs[0];

    // Click the "Wallet" inline button
    if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
      for (const row of (msg.replyMarkup as any).rows) {
        for (const btn of row.buttons) {
          const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
          if (dataStr === "wallet" || (btn.text || "").toLowerCase().includes("wallet")) {
            await msg.click({ data: btn.data });
            await new Promise((r) => setTimeout(r, 2500));
            msgs = await client.getMessages(botUsername, { limit: 2 });
            for (const m of msgs) {
              if (m.out) continue;
              const bal = this.parseBalanceFromText(m.text || "");
              if (bal !== null) return bal;
            }
            return 0;
          }
        }
      }
    }

    return 0;
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

    return 0;
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
    // In test environment, never connect or send commands to real Telegram bots
    if (
      process.env.NODE_ENV === "test" ||
      process.env.VITEST ||
      process.env.CI ||
      process.env.JEST_WORKER_ID !== undefined
    ) {
      return {};
    }

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

        // If not found in live catalog or currently out of stock, use Smart Keyword Matching to auto-remap
        if (!liveItem || liveItem.inStock === 0) {
          const determineKeywords = (code: string): string[][] => {
            if (code === "34" || code === "21" || code === "49") {
              return [["capcut", "7"], ["capcut", "7d"], ["capcut", "7 ngày"], ["capcut", "7 day"]];
            }
            if (code === "35") {
              return [["capcut", "30"], ["capcut", "30d"], ["capcut", "month"], ["capcut", "tháng"]];
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
            if (code === "76" || code === "75") {
              return [["muse", "ai"], ["muse"]];
            }
            return [];
          };

          const keywordGroups = determineKeywords(supplierProductCode);
          for (const kws of keywordGroups) {
            for (const item of Object.values(liveCatalog)) {
              if (item.inStock === 0) continue; // Prioritize in-stock replacements
              const lowerName = item.name.toLowerCase();
              if (kws.every((kw) => lowerName.includes(kw))) {
                liveItem = item;
                console.log(
                  `[TelegramBotAdapter] Auto-remapped stale code ${supplierProductCode} -> active code #${item.code} (${item.name}, Stock: ${item.inStock}) via live catalog scan!`
                );
                break;
              }
            }
            if (liveItem) break;
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
      const effectiveCode = XOAINON_PRODUCT_ALIASES[supplierProductCode] || supplierProductCode;
      const known = XOAINON_KNOWN_PRODUCTS[effectiveCode] || XOAINON_KNOWN_PRODUCTS[supplierProductCode];
      if (known) {
        return {
          supplierProductCode: effectiveCode,
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
    if (
      process.env.NODE_ENV === "test" ||
      process.env.VITEST ||
      process.env.CI ||
      process.env.JEST_WORKER_ID !== undefined
    ) {
      return {
        success: true,
        deliveredKeys: [`MOCK_KEY_${supplierProductCode}`],
        upstreamOrderId: `MOCK_TG_${orderCode}`,
      };
    }

    const { botUsername } = this.resolveConfig(creds);
    const client = await this.getClient(creds);

    if (botUsername.includes("xoainon")) {
      return this.buyXoaiNon(client, botUsername, supplierProductCode, quantity, orderCode);
    }
    if (botUsername.includes("dkey")) {
      return this.buyDKey(client, botUsername, supplierProductCode, quantity, orderCode);
    }
    if (botUsername.includes("dshop") || botUsername.includes("mmo_dshop")) {
      return this.buyDShop(client, botUsername, supplierProductCode, quantity, orderCode);
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
              return [["capcut", "7"], ["capcut", "7d"], ["capcut", "7 ngày"], ["capcut", "7 day"]];
            }
            if (code === "35") {
              return [["capcut", "30"], ["capcut", "30d"], ["capcut", "month"], ["capcut", "tháng"]];
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
            if (code === "76" || code === "75") {
              return [["muse", "ai"], ["muse"]];
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

  private async buyDKey(
    client: TelegramClient,
    botUsername: string,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    try {
      const qty = quantity > 0 ? quantity : 1;
      const preMsgs = await client.getMessages(botUsername, { limit: 1 });
      const minMsgId = preMsgs[0]?.id || 0;

      await client.sendMessage(botUsername, { message: "/start" });
      await new Promise((r) => setTimeout(r, 1500));

      let msgs = await client.getMessages(botUsername, { limit: 1 });
      let msg = msgs[0];
      if (!msg) {
        return { success: false, deliveredKeys: [], error: "Không nhận được phản hồi từ @dkeyshop_bot" };
      }

      await msg.click({ data: Buffer.from("menu::buy") });
      await new Promise((r) => setTimeout(r, 1500));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      let categoryCode = "";
      if (supplierProductCode === "6acf7db4452526529250f06e" || supplierProductCode.includes("netflix")) {
        categoryCode = "products_category::6839ac01fff70f6f";
      } else if (supplierProductCode === "6a3f1008cc06fe4bc3ab8e27" || supplierProductCode.includes("kling")) {
        categoryCode = "products_category::5c7d32ac2d24c7f9";
      } else if (supplierProductCode.includes("wink")) {
        categoryCode = "products_category::675e9bd10c28e5ab";
      }

      if (categoryCode && msg?.replyMarkup && (msg.replyMarkup as any).rows) {
        await msg.click({ data: Buffer.from(categoryCode) });
        await new Promise((r) => setTimeout(r, 1500));
        msgs = await client.getMessages(botUsername, { limit: 1 });
        msg = msgs[0];
      }

      const targetProdBtn = `product_id::${supplierProductCode}`;
      await msg.click({ data: Buffer.from(targetProdBtn) });
      await new Promise((r) => setTimeout(r, 1500));

      await client.sendMessage(botUsername, { message: String(qty) });
      await new Promise((r) => setTimeout(r, 2000));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      const confirmText = (msg?.message || "").toLowerCase();
      if (
        confirmText.includes("số dư ví hiện tại: 0") ||
        confirmText.includes("số dư không đủ") ||
        confirmText.includes("ví chưa đủ") ||
        confirmText.includes("không đủ để mua")
      ) {
        return {
          success: false,
          deliveredKeys: [],
          error: `Số dư ví DKeyShop không đủ để thanh toán (cần nạp thêm tiền vào @${botUsername})`,
        };
      }

      console.log(`[buyDKey] Clicking pay_method::wallet...`);
      await msg.click({ data: Buffer.from("pay_method::wallet") });
      await new Promise((r) => setTimeout(r, 4000));

      return await this.extractSecretFromRecentMessages(client, botUsername, orderCode, "DKEY", minMsgId);
    } catch (err: any) {
      return {
        success: false,
        deliveredKeys: [],
        error: `Lỗi kết nối DKeyShop: ${err?.message || err}`,
      };
    }
  }

  private async buyDShop(
    client: TelegramClient,
    botUsername: string,
    supplierProductCode: string,
    quantity: number,
    orderCode: string
  ): Promise<SupplierOrderResult> {
    try {
      const qty = quantity > 0 ? quantity : 1;
      const preMsgs = await client.getMessages(botUsername, { limit: 1 });
      const minMsgId = preMsgs[0]?.id || 0;

      await client.sendMessage(botUsername, { message: "/start" });
      await new Promise((r) => setTimeout(r, 1500));

      let msgs = await client.getMessages(botUsername, { limit: 1 });
      let msg = msgs[0];
      await msg.click({ data: Buffer.from("buy") });
      await new Promise((r) => setTimeout(r, 1500));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      let catCode = "cat:13";
      if (supplierProductCode.startsWith("prod:")) {
        const parts = supplierProductCode.split(":");
        catCode = `cat:${parts[1]}`;
      }

      await msg.click({ data: Buffer.from(catCode) });
      await new Promise((r) => setTimeout(r, 1500));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      await msg.click({ data: Buffer.from(supplierProductCode) });
      await new Promise((r) => setTimeout(r, 1500));

      msgs = await client.getMessages(botUsername, { limit: 1 });
      msg = msgs[0];

      let qtyBtnData: string | null = null;
      if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
        for (const row of (msg.replyMarkup as any).rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
            if (d.startsWith("qty:") && d.endsWith(`:${qty}`)) {
              qtyBtnData = d;
              break;
            }
          }
          if (qtyBtnData) break;
        }
      }

      if (qtyBtnData) {
        await msg.click({ data: Buffer.from(qtyBtnData) });
        await new Promise((r) => setTimeout(r, 2000));
        msgs = await client.getMessages(botUsername, { limit: 1 });
        msg = msgs[0];
      }

      if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
        for (const row of (msg.replyMarkup as any).rows) {
          for (const btn of row.buttons) {
            const d = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
            const t = (btn.text || "").toLowerCase();
            if (d.includes("wallet") || d.includes("balance") || t.includes("wallet") || t.includes("ví") || t.includes("balance")) {
              await msg.click({ data: Buffer.from(d) });
              await new Promise((r) => setTimeout(r, 4000));
              break;
            }
          }
        }
      }

      return await this.extractSecretFromRecentMessages(client, botUsername, orderCode, "DSHOP", minMsgId);
    } catch (err: any) {
      return {
        success: false,
        deliveredKeys: [],
        error: `Lỗi kết nối MMO D-Shop: ${err?.message || err}`,
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

