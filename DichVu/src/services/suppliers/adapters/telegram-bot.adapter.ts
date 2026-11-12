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
  "28": "71", // Canva Pro 1M (alias: 28 -> active #71)
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

/**
 * Parses numeric price from Telegram button text or message text.
 * Correctly distinguishes:
 * - "k" unit with decimal dot/comma ("3.9k" -> 3900, "32.9k" -> 32900, "119.5k" -> 119500)
 * - "đ" / "₫" / "VND" with thousands separator ("3.900đ" -> 3900, "32.900đ" -> 32900, "3,900đ" -> 3900)
 */
export function parseNumericPrice(str: string): number | null {
  if (typeof str === "number") {
    return !isFinite(str) || str <= 0 ? null : Math.round(str);
  }
  if (!str || typeof str !== "string") return null;

  // Reject negative numbers or negative price prefixes (e.g. "-3900đ", "-3.9k", "- 50k", "• -3.9k")
  if (/^\s*-\s*\d/.test(str) || /(?:^|[\s•])-\s*\d/.test(str)) {
    return null;
  }

  // 1. 'k' unit (e.g. "3.9k", "32.9k", "119.5k", "3,9k", "2k", "3.9kvnd")
  const kMatch = str.match(/(?:•\s*|\b|^)([\d]+(?:[.,]\d+)?)\s*k(?:\s*(?:vnd|vnđ|[đ₫])|(?![a-zA-Z0-9]))/i);
  if (kMatch) {
    const raw = kMatch[1].replace(/,/g, ".");
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0) {
      return Math.round(val * 1000);
    }
  }

  // 2. 'đ', '₫', 'vnd', 'vnđ' unit with thousands separator
  const vndMatch = str.match(/([\d.,]+)\s*(?:[đ₫]|vnd|vnđ)(?![a-zA-Z0-9])/i);
  if (vndMatch) {
    const clean = vndMatch[1].replace(/[.,]/g, "");
    const val = parseInt(clean, 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // 3. Bullet format with numeric price without unit (e.g. "• 3900 •" or "• 3.900 •")
  const bulletMatch = str.match(/•\s*([\d.,]+)\s*(?:•|$|\bSL\b)/i);
  if (bulletMatch) {
    const clean = bulletMatch[1].replace(/[.,]/g, "");
    const val = parseInt(clean, 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // 4. Label prefix (Giá: 3.900, Tổng: 32.900)
  const labelMatch = str.match(/(?:giá(?:\s*bán)?|tổng(?:\s*tiền|\s*thanh\s*toán)?)\s*[:]?\s*([\d.,]+)/i);
  if (labelMatch) {
    const clean = labelMatch[1].replace(/[.,]/g, "");
    const val = parseInt(clean, 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // 5. Standalone integer / thousands separated string (e.g. "3900", "3.900", "32.900")
  const trimmed = str.trim();
  if (/^[\d.,]+$/.test(trimmed)) {
    const clean = trimmed.replace(/[.,]/g, "");
    const val = parseInt(clean, 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  return null;
}

/**
 * Extracts detail price from product detail screen message.
 */
export function extractDetailPrice(text: string): number | null {
  if (!text) return null;
  const lines = text.split("\n");
  for (const line of lines) {
    if (/(?:giá|đơn\s*giá|price)/i.test(line)) {
      const price = parseNumericPrice(line);
      if (price !== null) return price;
    }
  }
  return parseNumericPrice(text);
}

/**
 * Extracts total checkout amount from checkout confirmation message.
 */
export function extractCheckoutTotal(text: string): number | null {
  if (!text) return null;
  const lines = text.split("\n");
  for (const line of lines) {
    if (/(?:tổng|thanh\s*toán|cần\s*trả)/i.test(line)) {
      const price = parseNumericPrice(line);
      if (price !== null) return price;
    }
  }
  return parseNumericPrice(text);
}

/**
 * Strict Price Safety Guard check (Zero Tolerance).
 * Aborts if actualPrice > expectedPrice.
 */
export function checkPriceSafety(
  actualPrice: number,
  expectedPrice: number
): { safe: boolean; reason?: string } {
  if (actualPrice == null || isNaN(actualPrice) || actualPrice <= 0) {
    return {
      safe: false,
      reason: "PRICE_SAFETY_VIOLATION: Giá nhà cung cấp không hợp lệ hoặc không thể xác định.",
    };
  }
  if (expectedPrice == null || isNaN(expectedPrice) || expectedPrice <= 0) {
    return {
      safe: false,
      reason: "PRICE_SAFETY_VIOLATION: Giá vốn dự kiến không hợp lệ hoặc chưa được thiết lập.",
    };
  }
  if (actualPrice > expectedPrice) {
    return {
      safe: false,
      reason: `PRICE_SAFETY_VIOLATION: Giá nhà cung cấp (${actualPrice.toLocaleString("vi-VN")}đ) vượt quá giá vốn cho phép (${expectedPrice.toLocaleString("vi-VN")}đ). Đã hủy giao dịch để bảo vệ tài khoản.`,
    };
  }
  return { safe: true };
}

/**
 * Returns exact required keyword token groups for product codes.
 * Removes all loose single-word fallbacks.
 */
export function determineKeywords(code: string): string[][] {
  const effectiveCode = XOAINON_PRODUCT_ALIASES[code] || code;

  switch (effectiveCode) {
    case "21": // CapCut 7 day (aliases: 34, 49)
      return [
        ["capcut", "7 day"],
        ["capcut", "7 ngày"],
        ["capcut", "7d"],
        ["capcut", "7 d"],
      ];

    case "35": // CapCut 30 day
      return [
        ["capcut", "30d"],
        ["capcut", "30 day"],
        ["capcut", "30 ngày"],
        ["capcut", "1 tháng"],
        ["capcut", "1 month"],
      ];

    case "70": // Gemini 18 months (alias: 51)
      return [
        ["gemini", "18"],
        ["gemini", "5tb"],
      ];

    case "37": // ChatGPT Plus Apple Gmail 1M
      return [
        ["chatgpt", "apple"],
        ["chatgpt", "gmail"],
      ];

    case "33": // ChatGPT Plus PIX 1M (alias: 10)
      return [
        ["chatgpt", "pix"],
      ];

    case "1": // ChatGPT Plus Private BHF 1M
      return [
        ["chatgpt", "riêng tư", "bhf"],
        ["chatgpt", "plus", "bhf", "1"],
        ["chatgpt", "riêng tư"],
        ["chatgpt", "private"],
      ];

    case "71": // Canva Pro 1M (alias: 28)
      return [
        ["canva", "pro", "1 tháng"],
        ["canva", "pro", "1 thg"],
        ["canva", "pro", "1m"],
        ["canva", "pro", "1 month"],
        ["canva", "pro", "1mth"],
        ["canva", "1 tháng"],
        ["canva", "1 thg"],
        ["canva", "1m"],
      ];

    case "60": // Duolingo Super 12M
      return [
        ["duolingo", "super", "12"],
        ["duolingo", "12 tháng"],
        ["duolingo", "super", "1 năm"],
        ["duolingo", "super", "12m"],
      ];

    case "73": // Office 365 Plus 1Y
      return [
        ["office", "365", "1 năm"],
        ["office", "365", "1y"],
        ["office", "365", "1 year"],
        ["office", "365", "riêng tư"],
        ["office", "365"],
      ];

    case "55": // Meitu VIP 7-Day
      return [
        ["meitu", "vip", "7"],
        ["meitu", "svip", "7"],
        ["meitu", "7 day"],
        ["meitu", "7 ngày"],
        ["meitu", "7d"],
      ];

    case "56": // Wink VIP+ 7-Day
      return [
        ["wink", "vip", "7"],
        ["wink", "7 day"],
        ["wink", "7 ngày"],
        ["wink", "7d"],
      ];

    case "65": // NordVPN 3M
      return [
        ["nord", "vpn", "3 tháng"],
        ["nord", "vpn", "3 thg"],
        ["nord", "vpn", "3m"],
        ["nord", "vpn", "3 month"],
        ["nord", "vpn", "3 months"],
        ["nordvpn", "3 tháng"],
        ["nordvpn", "3 thg"],
        ["nordvpn", "3m"],
      ];

    case "72": // Figma Pro Edu 2Y
      return [
        ["figma", "edu", "2 năm"],
        ["figma", "pro", "2 năm"],
        ["figma", "edu", "2y"],
        ["figma", "pro", "2y"],
        ["figma", "2 năm"],
      ];

    case "75": // Muse AI 1B
      return [
        ["muse", "1 tỷ"],
        ["muse", "1 ty"],
        ["muse", "1b"],
      ];

    case "76": // Muse AI 31B
      return [
        ["muse", "31 tỷ"],
        ["muse", "31 ty"],
        ["muse", "31b"],
      ];

    case "42": // Memrise Pro Lifetime
      return [
        ["memrise", "trọn đời"],
        ["memrise", "lifetime"],
      ];

    default:
      return [];
  }
}

/**
 * Checks if candidate text strictly matches the target product code with 100% agreement
 * on Brand, Duration, and Tier, preventing cross-tier false positives.
 */
export function matchesProductStrictly(code: string, text: string): boolean {
  if (
    typeof code !== "string" ||
    typeof text !== "string" ||
    !code.trim() ||
    !text.trim()
  ) {
    return false;
  }
  const effectiveCode = XOAINON_PRODUCT_ALIASES[code] || code;
  const groups = determineKeywords(effectiveCode);
  if (groups.length === 0) return false;

  const lower = text.toLowerCase();

  // Must match at least one keyword token group completely
  const matchesGroup = groups.some((group) =>
    group.every((kw) => lower.includes(kw.toLowerCase()))
  );
  if (!matchesGroup) return false;

  // Strict isolation checks per product tier/duration
  if (effectiveCode === "21") {
    // CapCut 7d must NEVER match 30d / month / 1 tháng
    if (
      lower.includes("30d") ||
      lower.includes("30 day") ||
      lower.includes("30 ngày") ||
      lower.includes("1 tháng") ||
      lower.includes("1 month") ||
      /\b(?:30|month)\b/i.test(lower)
    ) {
      return false;
    }
  } else if (effectiveCode === "35") {
    // CapCut 30d must NEVER match 7d / 7 day / 7 ngày
    if (
      lower.includes("7d") ||
      lower.includes("7 day") ||
      lower.includes("7 ngày") ||
      /\b7\b/i.test(lower)
    ) {
      return false;
    }
  } else if (effectiveCode === "75") {
    // Muse 1B must NEVER match 31B
    if (
      lower.includes("31") ||
      lower.includes("31b") ||
      lower.includes("31 tỷ") ||
      lower.includes("31 ty")
    ) {
      return false;
    }
  } else if (effectiveCode === "76") {
    // Muse 31B must NEVER match standalone 1B
    if (
      (lower.includes("1 tỷ") || lower.includes("1 ty") || lower.includes("1b")) &&
      !lower.includes("31")
    ) {
      return false;
    }
  } else if (effectiveCode === "73") {
    // Office 365 must contain BOTH "office" and "365", and not match VPN 365 or Canva 365
    if (!lower.includes("office") || !lower.includes("365")) return false;
    if (lower.includes("vpn") || lower.includes("canva")) return false;
  } else if (effectiveCode === "37") {
    // ChatGPT Apple/Gmail must not match PIX
    if (lower.includes("pix")) {
      return false;
    }
  } else if (effectiveCode === "33") {
    // ChatGPT PIX must not match Apple or Gmail
    if (lower.includes("apple") || lower.includes("gmail")) {
      return false;
    }
  } else if (effectiveCode === "1") {
    // ChatGPT Private BHF must not match Apple, Gmail, or PIX
    if (lower.includes("apple") || lower.includes("gmail") || lower.includes("pix")) {
      return false;
    }
  } else if (effectiveCode === "71") {
    // Canva Pro 1M must NEVER match 1 year / 12 months / lifetime / vĩnh viễn / trọn đời
    if (
      lower.includes("năm") ||
      lower.includes("year") ||
      lower.includes("1y") ||
      lower.includes("12 tháng") ||
      lower.includes("12 thg") ||
      lower.includes("12m") ||
      lower.includes("365") ||
      lower.includes("vĩnh viễn") ||
      lower.includes("vinh vien") ||
      lower.includes("trọn đời") ||
      lower.includes("tron doi") ||
      lower.includes("lifetime")
    ) {
      return false;
    }
  } else if (effectiveCode === "65") {
    // NordVPN 3M must NEVER match annual or multi-year packages (1 year, 2 year, 3 year, 12m, 24m, 36m)
    if (
      lower.includes("năm") ||
      lower.includes("year") ||
      lower.includes("1y") ||
      lower.includes("2y") ||
      lower.includes("3y") ||
      lower.includes("12 tháng") ||
      lower.includes("24 tháng") ||
      lower.includes("36 tháng") ||
      lower.includes("1 tháng") ||
      lower.includes("1m")
    ) {
      return false;
    }
  }

  return true;
}

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
    return parseNumericPrice(str);
  }

  private parseStock(str: string): number {
    if (/hết\s*hàng/i.test(str)) return 0;
    const m = str.match(/SL\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
  }

  private async delay(ms: number): Promise<void> {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      return;
    }
    await new Promise((r) => setTimeout(r, ms));
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
                for (const [kCode] of Object.entries(XOAINON_KNOWN_PRODUCTS)) {
                  if (matchesProductStrictly(kCode, btnText)) {
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

        // If not found in live catalog by exact code, search by strict keyword matching
        if (!liveItem) {
          for (const item of Object.values(liveCatalog)) {
            if (matchesProductStrictly(effectiveCode, item.name)) {
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

      // Safe error for unknown/unmatched Xoai Non product (no fake fallback)
      return {
        supplierProductCode,
        name: "Sản phẩm không khả dụng",
        price: 0,
        inStock: 0,
      };
    }

    if (botUsername.includes("nghientrick")) {
      return {
        supplierProductCode,
        name: "Gemini 18 Months",
        price: 14567,
        inStock: 24,
      };
    }

    // Default safe fallback for other bots
    return {
      supplierProductCode,
      name: "Sản phẩm không khả dụng",
      price: 0,
      inStock: 0,
    };
  }

  public async buyProduct(
    creds: SupplierCredentials,
    supplierProductCode: string,
    quantity: number,
    orderCode: string,
    extra?: any
  ): Promise<SupplierOrderResult> {
    const effectiveKnownCode = XOAINON_PRODUCT_ALIASES[supplierProductCode] || supplierProductCode;
    const expectedPrice =
      extra?.expectedPrice ??
      extra?.supplierPrice ??
      XOAINON_KNOWN_PRODUCTS[effectiveKnownCode]?.price ??
      XOAINON_KNOWN_PRODUCTS[supplierProductCode]?.price ??
      0;

    if (
      !extra?.mockClient &&
      (process.env.NODE_ENV === "test" ||
        process.env.VITEST ||
        process.env.CI ||
        process.env.JEST_WORKER_ID !== undefined)
    ) {
      return {
        success: true,
        deliveredKeys: [`MOCK_KEY_${supplierProductCode}`],
        upstreamOrderId: `MOCK_TG_${orderCode}`,
      };
    }

    const { botUsername } = this.resolveConfig(creds);
    const client = extra?.mockClient || (await this.getClient(creds));

    if (botUsername.includes("xoainon")) {
      return this.buyXoaiNon(client, botUsername, supplierProductCode, quantity, orderCode, expectedPrice);
    }
    if (botUsername.includes("dkey")) {
      return this.buyDKey(client, botUsername, supplierProductCode, quantity, orderCode);
    }
    if (botUsername.includes("dshop") || botUsername.includes("mmo_dshop")) {
      return this.buyDShop(client, botUsername, supplierProductCode, quantity, orderCode);
    }
    return this.buyNghienTrick(client, botUsername, supplierProductCode, quantity, orderCode);
  }

  public async buyXoaiNon(
    client: TelegramClient,
    botUsername: string,
    supplierProductCode: string,
    quantity: number,
    orderCode: string,
    expectedPrice?: number
  ): Promise<SupplierOrderResult> {
    try {
      const qty = quantity > 0 ? quantity : 1;
      const effectiveKnownCode = XOAINON_PRODUCT_ALIASES[supplierProductCode] || supplierProductCode;
      const expectedUnitPrice =
        expectedPrice ??
        XOAINON_KNOWN_PRODUCTS[effectiveKnownCode]?.price ??
        XOAINON_KNOWN_PRODUCTS[supplierProductCode]?.price ??
        0;

      // Pre-flight Price Safety Guard: reject missing or non-positive expected unit price
      if (!expectedUnitPrice || expectedUnitPrice <= 0 || isNaN(expectedUnitPrice)) {
        console.warn(
          `[PriceSafetyGuard] ABORTED: Missing or invalid expectedUnitPrice (${expectedUnitPrice}) for product code ${supplierProductCode} (order: ${orderCode}). Zero tolerance enforced.`
        );
        return {
          success: false,
          deliveredKeys: [],
          error: "PRICE_SAFETY_VIOLATION: Giá vốn dự kiến không hợp lệ hoặc chưa được thiết lập. Đã hủy giao dịch để bảo vệ tài khoản.",
        };
      }

      // Record pre-purchase latest message ID to avoid picking up old purchase messages
      const preMsgs = await client.getMessages(botUsername, { limit: 1 });
      const minMsgId = preMsgs[0]?.id || 0;

      // 1. Send /buy to get catalog
      await client.sendMessage(botUsername, { message: "/buy" });
      await this.delay(2000);

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
          await this.delay(2000);
          msgs = await client.getMessages(botUsername, { limit: 1 });
          msg = msgs[0];
        }
      }

      // 2. Locate target product button in catalog
      let targetBtnFound = false;
      let targetBtnData = `product:view:${targetCode}`;
      let targetBtnText = "";

      if (msg?.replyMarkup && (msg.replyMarkup as any).rows) {
        // Step A: Exact match by product:view:<targetCode>
        for (const row of (msg.replyMarkup as any).rows) {
          for (const btn of row.buttons) {
            const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
            if (dataStr === `product:view:${targetCode}`) {
              targetBtnFound = true;
              targetBtnData = dataStr;
              targetBtnText = btn.text || "";
              break;
            }
          }
          if (targetBtnFound) break;
        }

        // Step B: Strict keyword match fallback if code changed or alias was not updated
        if (!targetBtnFound) {
          console.log(`[buyXoaiNon] Product code ${targetCode} not found in catalog buttons. Trying strict keyword matching...`);

          for (const row of (msg.replyMarkup as any).rows) {
            for (const btn of row.buttons) {
              const btnText = btn.text || "";
              const dataStr = btn.data ? Buffer.from(btn.data).toString("utf-8") : "";
              if (dataStr === "noop") continue;

              if (matchesProductStrictly(targetCode, btnText) && dataStr.startsWith("product:view:")) {
                const match = dataStr.match(/product:view:(\d+)/);
                if (match) {
                  targetCode = match[1];
                  targetBtnData = dataStr;
                  targetBtnText = btnText;
                  targetBtnFound = true;
                  console.log(`[buyXoaiNon] Strict matched product "${btn.text}" -> targetCode ${targetCode}`);
                  break;
                }
              }
            }
            if (targetBtnFound) break;
          }
        }
      }

      // Out-of-stock check on matched button: do NOT proceed or auto-remap
      if (targetBtnFound && (targetBtnText.toLowerCase().includes("hết hàng") || this.parseStock(targetBtnText) === 0)) {
        return {
          success: false,
          deliveredKeys: [],
          error: `Sản phẩm ID ${supplierProductCode} (target: ${targetCode}) hiện tại đã hết hàng trên @${botUsername}`,
        };
      }

      // Checkpoint 1: Catalog Button Price Safety Guard
      let buttonPrice: number | null = null;
      if (targetBtnFound && targetBtnText) {
        buttonPrice = parseNumericPrice(targetBtnText);
        if (buttonPrice !== null) {
          const safety = checkPriceSafety(buttonPrice, expectedUnitPrice);
          if (!safety.safe) {
            console.warn(
              `[PriceSafetyGuard] ABORTED: Button price ${buttonPrice} VND exceeds expected supplierPrice ${expectedUnitPrice} VND for product code ${targetCode} (order: ${orderCode}). Zero tolerance enforced.`
            );
            return {
              success: false,
              deliveredKeys: [],
              error: safety.reason || `PRICE_SAFETY_VIOLATION: Giá hiển thị trên nút (${buttonPrice.toLocaleString("vi-VN")}đ) vượt quá giá vốn cho phép (${expectedUnitPrice.toLocaleString("vi-VN")}đ). Đã hủy giao dịch để bảo vệ tài khoản.`,
            };
          }
        }
      }

      // Check if we are already on the detail screen or need to click product view
      const isCurrentlyOnDetail = msg?.replyMarkup && (msg.replyMarkup as any).rows?.some((row: any) =>
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
        await this.delay(2000);

        msgs = await client.getMessages(botUsername, { limit: 1 });
        msg = msgs[0];
      }

      // Checkpoint 2: Detail Screen Price Safety Guard (pre-quantity)
      const detailPrice = extractDetailPrice(msg?.message || "");
      if (detailPrice !== null) {
        const safety = checkPriceSafety(detailPrice, expectedUnitPrice);
        if (!safety.safe) {
          console.warn(
            `[PriceSafetyGuard] ABORTED: Detail screen price ${detailPrice} VND exceeds expected supplierPrice ${expectedUnitPrice} VND for product code ${targetCode} (order: ${orderCode}). Zero tolerance enforced.`
          );
          return {
            success: false,
            deliveredKeys: [],
            error: safety.reason || `PRICE_SAFETY_VIOLATION: Giá sản phẩm trên chi tiết (${detailPrice.toLocaleString("vi-VN")}đ) vượt quá giá vốn cho phép (${expectedUnitPrice.toLocaleString("vi-VN")}đ). Đã hủy giao dịch để bảo vệ tài khoản.`,
          };
        }
      }

      // 3. Click buyqty:<id>:<quantity>
      console.log(`[buyXoaiNon] Clicking quantity: buyqty:${targetCode}:${qty}...`);
      await msg.click({ data: Buffer.from(`buyqty:${targetCode}:${qty}`) });
      await this.delay(2000);

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

      // Checkpoint 3: Checkout Screen Price Safety Guard (before clicking pay:wallet)
      const maxExpectedTotal = expectedUnitPrice * qty;
      const checkoutPrice = extractCheckoutTotal(msg?.message || "");
      if (checkoutPrice !== null) {
        const safety = checkPriceSafety(checkoutPrice, maxExpectedTotal);
        if (!safety.safe) {
          console.warn(
            `[PriceSafetyGuard] ABORTED: Checkout price ${checkoutPrice} VND exceeds expected total supplierPrice ${maxExpectedTotal} VND (${expectedUnitPrice} x ${qty}) for product code ${targetCode} (order: ${orderCode}). Zero tolerance enforced.`
          );
          return {
            success: false,
            deliveredKeys: [],
            error: safety.reason || `PRICE_SAFETY_VIOLATION: Tổng tiền thanh toán (${checkoutPrice.toLocaleString("vi-VN")}đ) vượt quá giá vốn cho phép (${maxExpectedTotal.toLocaleString("vi-VN")}đ). Đã hủy giao dịch để bảo vệ tài khoản.`,
          };
        }
      } else if (buttonPrice === null && detailPrice === null) {
        // Blind payment prevention: if price cannot be parsed from any screen, fail safe
        console.warn(
          `[PriceSafetyGuard] ABORTED: Cannot determine product price from button, detail, or checkout screens for product code ${targetCode} (order: ${orderCode}). Failing safe to protect funds.`
        );
        return {
          success: false,
          deliveredKeys: [],
          error: "PRICE_SAFETY_VIOLATION: Không thể xác định giá sản phẩm từ Telegram bot để đối chiếu an toàn. Đã hủy giao dịch để bảo vệ tài khoản.",
        };
      }

      // 4. Click pay:wallet:<id>:<quantity>
      console.log(`[buyXoaiNon] Price safety verified. Clicking pay wallet: pay:wallet:${targetCode}:${qty}...`);
      await msg.click({ data: Buffer.from(`pay:wallet:${targetCode}:${qty}`) });
      await this.delay(4000);

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
    let bestCandidate: { content: string; type: string; rawText: string; deliveredKeys?: string[] } | null = null;
    let fallbackTextCandidate: { content: string; type: string; rawText: string; deliveredKeys?: string[] } | null = null;

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
              const docKeys = parsedDoc.deliveredKeys && parsedDoc.deliveredKeys.length > 0 ? parsedDoc.deliveredKeys : [parsedDoc.content];
              if (parsedDoc.content && parsedDoc.type !== "text") {
                bestCandidate = { content: parsedDoc.content, type: parsedDoc.type, rawText: fileContent, deliveredKeys: docKeys };
                break;
              } else if (parsedDoc.content && !fallbackTextCandidate && !parsedDoc.isNoticeOnly) {
                fallbackTextCandidate = { content: parsedDoc.content, type: parsedDoc.type, rawText: fileContent, deliveredKeys: docKeys };
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
        const textKeys = parsed.deliveredKeys && parsed.deliveredKeys.length > 0 ? parsed.deliveredKeys : [parsed.content];
        if (parsed.type !== "text") {
          if (!bestCandidate) {
            bestCandidate = { content: parsed.content, type: parsed.type, rawText: text, deliveredKeys: textKeys };
          }
        } else if (!fallbackTextCandidate && !parsed.isNoticeOnly) {
          fallbackTextCandidate = { content: parsed.content, type: parsed.type, rawText: text, deliveredKeys: textKeys };
        }
      }
    }

    const selected = bestCandidate || (fallbackTextCandidate && !fallbackTextCandidate.content.includes("❌") && !/không đủ/i.test(fallbackTextCandidate.content) ? fallbackTextCandidate : null);
    if (selected) {
      return {
        success: true,
        upstreamOrderId: botOrderId || `${fallbackPrefix}_${orderCode}`,
        deliveredKeys: selected.deliveredKeys && selected.deliveredKeys.length > 0 ? selected.deliveredKeys : [selected.content],
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

