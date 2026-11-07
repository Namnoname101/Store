import { describe, it, expect, vi } from "vitest";
import {
  parseNumericPrice,
  checkPriceSafety,
  determineKeywords,
  matchesProductStrictly,
  extractDetailPrice,
  extractCheckoutTotal,
  TelegramBotAdapter,
} from "@/services/suppliers/adapters/telegram-bot.adapter";

describe("Challenger 2 - Adversarial Stress & Edge Case Probing", () => {
  describe("1. Upstream Telegram Price Parsing Edge Cases", () => {
    it("handles novel price formats: 3,900VND, 3.900 đ, 3.9K, 3.9k, 39.000đ", () => {
      // 3,900VND
      expect(parseNumericPrice("3,900VND")).toBe(3900);
      expect(parseNumericPrice("3,900 VND")).toBe(3900);
      expect(parseNumericPrice("3.900VND")).toBe(3900);

      // 3.900 đ with space
      expect(parseNumericPrice("3.900 đ")).toBe(3900);
      expect(parseNumericPrice("3,900 đ")).toBe(3900);
      expect(parseNumericPrice("3.900đ")).toBe(3900);
      expect(parseNumericPrice("3.900 ₫")).toBe(3900);
      expect(parseNumericPrice("3.900 VNĐ")).toBe(3900);

      // Uppercase 3.9K vs lowercase 3.9k
      expect(parseNumericPrice("3.9K")).toBe(3900);
      expect(parseNumericPrice("3.9k")).toBe(3900);
      expect(parseNumericPrice("3,9K")).toBe(3900);
      expect(parseNumericPrice("3,9k")).toBe(3900);

      // 39.000đ vs 39k vs 39K
      expect(parseNumericPrice("39.000đ")).toBe(39000);
      expect(parseNumericPrice("39,000đ")).toBe(39000);
      expect(parseNumericPrice("39k")).toBe(39000);
      expect(parseNumericPrice("39K")).toBe(39000);
      expect(parseNumericPrice("39.000 VND")).toBe(39000);

      // Millions: 3.900.000đ, 3,900,000 VND
      expect(parseNumericPrice("3.900.000đ")).toBe(3900000);
      expect(parseNumericPrice("3,900,000 VND")).toBe(3900000);
    });

    it("handles buttons with no price or weird non-price text safely", () => {
      expect(parseNumericPrice("Capcut Pro 7 day BHF")).toBeNull();
      expect(parseNumericPrice("Capcut Pro 7 day BHF • SL 10")).toBeNull();
      expect(parseNumericPrice("Capcut Pro 7 day BHF • No Price")).toBeNull();
      expect(parseNumericPrice("FREE")).toBeNull();
      expect(parseNumericPrice("0đ")).toBeNull();
      // Negative prices must be rejected as null
      expect(parseNumericPrice("-3900đ")).toBeNull();
      expect(parseNumericPrice("-3.9k")).toBeNull();
      expect(parseNumericPrice("")).toBeNull();
      expect(parseNumericPrice("   ")).toBeNull();
      expect(parseNumericPrice(null as any)).toBeNull();
      expect(parseNumericPrice(undefined as any)).toBeNull();
      expect(parseNumericPrice({} as any)).toBeNull();
    });

    it("parses prices embedded in realistic Telegram button variations", () => {
      expect(parseNumericPrice("Capcut Pro 7 day • 3,900VND • SL 10")).toBe(3900);
      expect(parseNumericPrice("Capcut Pro 7 day • 3.900 đ • SL 10")).toBe(3900);
      expect(parseNumericPrice("Capcut Pro 7 day • 3.9K • SL 10")).toBe(3900);
      expect(parseNumericPrice("Capcut Pro 7 day • 3.9k • SL 10")).toBe(3900);
      expect(parseNumericPrice("Capcut Pro 30d • 39.000đ • SL 5")).toBe(39000);
      expect(parseNumericPrice("MUSE AI 31 TỶ TOKEN KBH • 9.800đ • SL 51")).toBe(9800);
    });
  });

  describe("2. Out-of-Stock and Stock 0 Safety Probing", () => {
    it("buyXoaiNon safely rejects buttons with 'hết hàng' (case-insensitive)", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • HẾT HÀNG • SL 0",
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: clickSpy,
      };

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([mockCatalogMsg]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_STRESS_OOS_1",
        { expectedPrice: 3900, mockClient }
      );

      expect(result.success).toBe(false);
      expect(result.deliveredKeys).toEqual([]);
      expect(result.error).toContain("hết hàng");
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("buyXoaiNon safely rejects buttons with stock 0 (SL 0)", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • 3.9k • SL 0",
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: clickSpy,
      };

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([mockCatalogMsg]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_STRESS_OOS_2",
        { expectedPrice: 3900, mockClient }
      );

      expect(result.success).toBe(false);
      expect(result.deliveredKeys).toEqual([]);
      expect(result.error).toContain("hết hàng");
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("buyXoaiNon does NOT remap to another product when item is out of stock", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      // Catalog contains #21 (SL 0) and #35 (SL 50)
      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • 3.9k • SL 0",
                  data: Buffer.from("product:view:21"),
                },
                {
                  text: "Capcut Pro 30d full Date - BHF • 32.9k • SL 50",
                  data: Buffer.from("product:view:35"),
                },
              ],
            },
          ],
        },
        click: clickSpy,
      };

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([mockCatalogMsg]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_STRESS_OOS_3",
        { expectedPrice: 3900, mockClient }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("hết hàng");
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe("2b. Price Safety Checkpoint Probing", () => {
    it("buyXoaiNon catches price increase at Checkpoint 2 when catalog button has no price", async () => {
      const adapter = new TelegramBotAdapter();
      (adapter as any).delay = vi.fn();
      const clickedActions: string[] = [];

      // Step 1: Catalog button has NO price
      const catalogMsg = {
        message: "Danh mục sản phẩm",
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • SL 10",
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: vi.fn().mockImplementation(async (opts) => {
          clickedActions.push(opts.data.toString());
        }),
      };

      // Step 2: Detail screen displays higher price (32.900đ)
      const detailMsg = {
        message: "Thông tin chi tiết:\nCapcut Pro 7 day BHF\nGiá: 32.900đ\nBảo hành: 7 ngày",
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Mua 1",
                  data: Buffer.from("buyqty:21:1"),
                },
              ],
            },
          ],
        },
        click: vi.fn().mockImplementation(async (opts) => {
          clickedActions.push(opts.data.toString());
        }),
      };

      let callCount = 0;
      const mockClient: any = {
        getMessages: vi.fn().mockImplementation(async () => {
          callCount++;
          // First call is preMsgs, second is catalog, third is detail
          if (callCount <= 2) return [catalogMsg];
          return [detailMsg];
        }),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await (adapter as any).buyXoaiNon(
        mockClient,
        "shopxoainon_bot",
        "21",
        1,
        "ORD_STRESS_NO_BTN_PRICE",
        3900
      );

      // Must abort at Checkpoint 2
      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.error).toContain("32.900");
      expect(result.error).toContain("3.900");
      // Checked view button clicked, but buyqty or pay:wallet was NEVER clicked
      expect(clickedActions).toEqual(["product:view:21"]);
    });

  describe("3. Missing / Undefined extra.expectedPrice Fallback Scenarios", () => {
    it("safely falls back to known catalog price when extra is undefined", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      // Button has price 32.9k for #21 (catalog price is 3900)
      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • 32.9k • SL 10",
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: clickSpy,
      };

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([mockCatalogMsg]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      // Call buyXoaiNon directly with expectedPrice = undefined
      const result = await (adapter as any).buyXoaiNon(
        mockClient,
        "shopxoainon_bot",
        "21",
        1,
        "ORD_STRESS_FALLBACK_1",
        undefined
      );

      // Known price for "21" is 3900. Button is 32900. Must abort!
      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.error).toContain("32.900");
      expect(result.error).toContain("3.900");
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("safely falls back to known catalog price via alias when extra has no price", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      // Alias #34 maps to #21 (price 3900). Button has 32.9k.
      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • 32.9k • SL 10",
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: clickSpy,
      };

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([mockCatalogMsg]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await (adapter as any).buyXoaiNon(
        mockClient,
        "shopxoainon_bot",
        "34",
        1,
        "ORD_STRESS_FALLBACK_2",
        undefined
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("evaluates behavior when product is completely unknown and expectedPrice is 0 or undefined", async () => {
      const adapter = new TelegramBotAdapter();
      (adapter as any).delay = vi.fn();
      const clickedActions: string[] = [];

      const mockCatalogMsg = {
        message: "Xác nhận đơn hàng: Custom Mystery Product\nĐơn giá: 50.000đ\nTổng thanh toán: 50.000đ",
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Custom Mystery Product • 50.000đ • SL 10",
                  data: Buffer.from("product:view:99999"),
                },
              ],
            },
          ],
        },
        click: vi.fn().mockImplementation(async (opts) => {
          clickedActions.push(opts.data.toString());
        }),
      };

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([mockCatalogMsg]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      (adapter as any).extractSecretFromRecentMessages = vi.fn().mockResolvedValue({
        success: true,
        deliveredKeys: ["UNAUTHORIZED_PURCHASE_KEY"],
      });

      // An unknown SKU "99999" where expectedPrice is 0 or undefined
      const result = await (adapter as any).buyXoaiNon(
        mockClient,
        "shopxoainon_bot",
        "99999",
        1,
        "ORD_STRESS_ZERO_PRICE",
        0
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(clickedActions).toEqual([]);
    });
  });

  describe("4. Keyword Strictness and Adversarial Input Stress", () => {
    it("verifies every product code produces strictly multi-word or non-brand-only token groups", () => {
      const forbiddenSingles = new Set([
        "chatgpt", "gpt", "muse", "office", "365", "gemini",
        "canva", "duolingo", "meitu", "wink", "nord", "figma",
        "memrise", "capcut", "bhf"
      ]);

      const activeRegisteredCodes = [
        "21", "34", "49", "35", "70", "51", "37", "33", "10",
        "1", "71", "28", "60", "73", "55", "56", "65", "72",
        "75", "76", "42"
      ];

      for (const code of activeRegisteredCodes) {
        const groups = determineKeywords(code);
        expect(groups.length).toBeGreaterThan(0);

        for (const group of groups) {
          expect(group.length).toBeGreaterThanOrEqual(1);
          if (group.length === 1) {
            expect(forbiddenSingles.has(group[0].toLowerCase().trim())).toBe(false);
          }
          // No single token in a multi-token group should match alone
          expect(group.join(" ").trim().length).toBeGreaterThan(2);
        }
      }
    });

    it("verifies behavior of matchesProductStrictly on non-string or unusual string inputs", () => {
      // 1. Strings: empty, whitespace, symbols, unicode, large strings
      const weirdStrings = [
        "",
        " ",
        "   \t\n  ",
        "???!!!***",
        "([{\\^$|)?+*",
        "<html><body>XSS</body></html>",
        "DROP TABLE products;--",
        "🔥✨🎉💯",
        "a".repeat(10000),
      ];

      for (const input of weirdStrings) {
        expect(() => matchesProductStrictly("21", input)).not.toThrow();
        expect(matchesProductStrictly("21", input)).toBe(false);
      }

      // 2. Falsy inputs
      expect(matchesProductStrictly("21", null as any)).toBe(false);
      expect(matchesProductStrictly("21", undefined as any)).toBe(false);
      expect(matchesProductStrictly(null as any, "Capcut Pro 7 day")).toBe(false);
      expect(matchesProductStrictly(undefined as any, "Capcut Pro 7 day")).toBe(false);

      // 3. Edge Case: Non-string truthy input should be safely rejected without throwing
      expect(matchesProductStrictly("21", 12345 as any)).toBe(false);
      expect(matchesProductStrictly("21", {} as any)).toBe(false);
      expect(() => matchesProductStrictly("21", 12345 as any)).not.toThrow();
      expect(() => matchesProductStrictly("21", {} as any)).not.toThrow();
    });

    it("strictly isolates negative assertions across duration and tier boundaries", () => {
      // CapCut 7d should not match any duration >= 30d
      expect(matchesProductStrictly("21", "Capcut Pro 7 day 30d")).toBe(false);
      expect(matchesProductStrictly("21", "Capcut Pro 7d 1 tháng")).toBe(false);
      expect(matchesProductStrictly("21", "Capcut Pro 7d month")).toBe(false);

      // CapCut 30d should not match any 7d
      expect(matchesProductStrictly("35", "Capcut Pro 30d 7d")).toBe(false);
      expect(matchesProductStrictly("35", "Capcut Pro 30d 7 ngày")).toBe(false);
      expect(matchesProductStrictly("35", "Capcut Pro 30d 7 day")).toBe(false);

      // Muse 1B vs 31B
      expect(matchesProductStrictly("75", "Muse AI 1B 31B")).toBe(false);
      expect(matchesProductStrictly("75", "Muse AI 1 tỷ 31 tỷ")).toBe(false);
      expect(matchesProductStrictly("76", "Muse AI 31B 1B")).toBe(true); // contains 31B!
      expect(matchesProductStrictly("76", "Muse AI 1B token")).toBe(false);

      // Office 365 vs VPN / Canva
      expect(matchesProductStrictly("73", "Office 365 VPN")).toBe(false);
      expect(matchesProductStrictly("73", "Office 365 Canva")).toBe(false);
      expect(matchesProductStrictly("73", "Office 2021")).toBe(false);
      expect(matchesProductStrictly("73", "VPN 365 Pro")).toBe(false);

      // ChatGPT Tiers
      expect(matchesProductStrictly("37", "ChatGPT Apple PIX")).toBe(false);
      expect(matchesProductStrictly("33", "ChatGPT PIX Gmail")).toBe(false);
      expect(matchesProductStrictly("33", "ChatGPT PIX Apple")).toBe(false);
      expect(matchesProductStrictly("1", "ChatGPT Private Apple")).toBe(false);
      expect(matchesProductStrictly("1", "ChatGPT Private PIX")).toBe(false);
    });
  });
});
});
