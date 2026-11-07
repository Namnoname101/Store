import { describe, it, expect, vi } from "vitest";
import {
  determineKeywords,
  matchesProductStrictly,
  TelegramBotAdapter,
} from "@/services/suppliers/adapters/telegram-bot.adapter";

describe("Telegram Supplier Bot - Strict Keyword & SKU Mapping", () => {
  describe("1. CapCut 7-Day (#21, #34, #49) vs 30-Day (#35) Strict Isolation", () => {
    it("CapCut 7-day strictly matches only 7-day tokens", () => {
      expect(
        matchesProductStrictly("21", "Capcut Pro 7 day BHF • 3.9k • SL 13")
      ).toBe(true);
      expect(matchesProductStrictly("21", "Capcut Pro 7d")).toBe(true);
      expect(matchesProductStrictly("21", "CapCut Pro 7 ngày")).toBe(true);
      expect(matchesProductStrictly("21", "Capcut Pro 7 d BHF")).toBe(true);

      // Aliases #34 and #49 map to #21 behavior
      expect(matchesProductStrictly("34", "Capcut Pro 7 day BHF")).toBe(true);
      expect(matchesProductStrictly("49", "Capcut Pro 7 ngày 500 Credit")).toBe(
        true
      );
    });

    it("CapCut 7-day NEVER matches CapCut 30-day tokens or variants", () => {
      expect(
        matchesProductStrictly(
          "21",
          "Capcut Pro 30d full Date - BHF • 32.9k • SL 11"
        )
      ).toBe(false);
      expect(matchesProductStrictly("21", "Capcut Pro 30 ngày")).toBe(false);
      expect(matchesProductStrictly("21", "CapCut Pro 1 tháng")).toBe(false);
      expect(matchesProductStrictly("21", "Capcut Pro 30 day")).toBe(false);
      expect(matchesProductStrictly("34", "Capcut Pro 30d full Date")).toBe(
        false
      );
      expect(matchesProductStrictly("49", "Capcut Pro 30d full Date")).toBe(
        false
      );
    });

    it("CapCut 30-day strictly matches only 30-day tokens", () => {
      expect(
        matchesProductStrictly(
          "35",
          "Capcut Pro 30d full Date - BHF • 32.9k • SL 11"
        )
      ).toBe(true);
      expect(matchesProductStrictly("35", "Capcut Pro 30 ngày")).toBe(true);
      expect(matchesProductStrictly("35", "CapCut Pro 1 tháng")).toBe(true);
      expect(matchesProductStrictly("35", "Capcut Pro 30 day")).toBe(true);
      expect(matchesProductStrictly("35", "Capcut Pro 1 month")).toBe(true);
    });

    it("CapCut 30-day NEVER matches CapCut 7-day tokens or variants", () => {
      expect(
        matchesProductStrictly("35", "Capcut Pro 7 day BHF • 3.9k • SL 13")
      ).toBe(false);
      expect(matchesProductStrictly("35", "Capcut Pro 7d")).toBe(false);
      expect(matchesProductStrictly("35", "CapCut Pro 7 ngày")).toBe(false);
    });
  });

  describe("2. Muse AI 1B (#75) vs 31B (#76) Strict Isolation", () => {
    it("Muse 1B (#75) matches only 1B tokens and rejects 31B", () => {
      expect(
        matchesProductStrictly("75", "MUSE AI 1 TỶ TOKEN KBH • 2.000đ • SL 195")
      ).toBe(true);
      expect(matchesProductStrictly("75", "MUSE AI 1 ty")).toBe(true);
      expect(matchesProductStrictly("75", "Muse 1B Token")).toBe(true);

      // Rejects 31B
      expect(
        matchesProductStrictly("75", "MUSE AI 31 TỶ TOKEN KBH • 9.800đ • SL 51")
      ).toBe(false);
      expect(matchesProductStrictly("75", "MUSE AI 31 ty")).toBe(false);
      expect(matchesProductStrictly("75", "Muse 31B Token")).toBe(false);
    });

    it("Muse 31B (#76) matches only 31B tokens and rejects 1B", () => {
      expect(
        matchesProductStrictly("76", "MUSE AI 31 TỶ TOKEN KBH • 9.800đ • SL 51")
      ).toBe(true);
      expect(matchesProductStrictly("76", "MUSE AI 31 ty")).toBe(true);
      expect(matchesProductStrictly("76", "Muse 31B Token")).toBe(true);

      // Rejects 1B
      expect(
        matchesProductStrictly("76", "MUSE AI 1 TỶ TOKEN KBH • 2.000đ • SL 195")
      ).toBe(false);
      expect(matchesProductStrictly("76", "MUSE AI 1 ty")).toBe(false);
      expect(matchesProductStrictly("76", "Muse 1B Token")).toBe(false);
    });
  });

  describe("3. ChatGPT Tiers Strict Isolation (#37, #33, #1)", () => {
    it("ChatGPT Apple Gmail (#37) matches only its tier", () => {
      expect(
        matchesProductStrictly(
          "37",
          "Chatgpt Plus pay Apple Gmail 1 thg - BH 24H • 119.5k • SL 9"
        )
      ).toBe(true);
      expect(matchesProductStrictly("37", "ChatGPT Apple 1 thg")).toBe(true);

      // Does not match PIX (#33) or Private BHF (#1)
      expect(
        matchesProductStrictly(
          "37",
          "Chatgpt plus 1 tháng pay PIX riêng tư - Bh24h"
        )
      ).toBe(false);
      expect(
        matchesProductStrictly("37", "ChatGPT Plus 1 tháng riêng tư - BHF")
      ).toBe(false);
    });

    it("ChatGPT PIX (#33, #10) matches only its tier", () => {
      expect(
        matchesProductStrictly(
          "33",
          "Chatgpt plus 1 tháng pay PIX riêng tư - Bh24h • 135.4k • SL 11"
        )
      ).toBe(true);
      expect(matchesProductStrictly("10", "Chatgpt pay PIX")).toBe(true);

      // Does not match Apple (#37) or Private BHF (#1)
      expect(
        matchesProductStrictly("33", "Chatgpt Plus pay Apple Gmail 1 thg")
      ).toBe(false);
      expect(
        matchesProductStrictly("33", "ChatGPT Plus 1 tháng riêng tư - BHF")
      ).toBe(false);
    });

    it("ChatGPT Private BHF (#1) matches only its tier", () => {
      expect(
        matchesProductStrictly(
          "1",
          "ChatGPT Plus 1 tháng riêng tư - BHF • 219k • SL 10"
        )
      ).toBe(true);
      expect(matchesProductStrictly("1", "ChatGPT Plus BHF 1")).toBe(true);

      // Does not match Apple (#37) or PIX (#33)
      expect(
        matchesProductStrictly("1", "Chatgpt Plus pay Apple Gmail 1 thg")
      ).toBe(false);
      expect(matchesProductStrictly("1", "Chatgpt plus pay PIX")).toBe(false);
    });
  });

  describe("4. Microsoft Office 365 Isolation (#73)", () => {
    it("requires both 'office' and '365'", () => {
      expect(
        matchesProductStrictly(
          "73",
          "Microsoft Office 365 Plus 1 năm riêng tư • 16.800đ"
        )
      ).toBe(true);
      expect(matchesProductStrictly("73", "Office 365 1y")).toBe(true);
      expect(matchesProductStrictly("73", "Office 365 1 year")).toBe(true);
      expect(matchesProductStrictly("73", "Office 365 riêng tư")).toBe(true);
    });

    it("does NOT match unrelated products containing '365' or 'office'", () => {
      expect(matchesProductStrictly("73", "VPN 365 ngày")).toBe(false);
      expect(matchesProductStrictly("73", "Canva Pro 365 ngày")).toBe(false);
      expect(matchesProductStrictly("73", "Nord VPN 365")).toBe(false);
      expect(matchesProductStrictly("73", "Office 2021 Pro Plus")).toBe(false);
      expect(matchesProductStrictly("73", "Microsoft Office 2019 Key")).toBe(
        false
      );
    });
  });

  describe("5. Elimination of Loose Single-Word Keywords", () => {
    const supportedCodes = [
      "21",
      "35",
      "70",
      "37",
      "33",
      "1",
      "71",
      "60",
      "73",
      "55",
      "56",
      "65",
      "72",
      "75",
      "76",
      "42",
    ];

    it("ensures no code contains loose single-word brand-only keywords", () => {
      const forbiddenSingleTokens = [
        "chatgpt",
        "gpt",
        "muse",
        "office",
        "365",
        "gemini",
        "canva",
        "duolingo",
        "meitu",
        "wink",
        "nord",
        "figma",
        "memrise",
        "capcut",
      ];

      for (const code of supportedCodes) {
        const groups = determineKeywords(code);
        expect(groups.length).toBeGreaterThan(0);

        for (const group of groups) {
          // If group has only 1 element, it must not be a bare brand name
          if (group.length === 1) {
            expect(forbiddenSingleTokens).not.toContain(
              group[0].toLowerCase().trim()
            );
          }
          // Must not contain loose 'capcut, bhf'
          if (group.includes("capcut") && group.includes("bhf")) {
            expect(group).not.toEqual(["capcut", "bhf"]);
          }
        }
      }
    });
  });

  describe("6. Out-of-Stock and Unknown Fallback Behavior", () => {
    it("fetchProductInfo returns inStock: 0 without auto-remapping when item is out of stock", async () => {
      const adapter = new TelegramBotAdapter();

      // Spy on getLiveCatalog to simulate a catalog where #21 is out of stock (0) and #35 has stock (11)
      vi.spyOn(adapter as any, "getLiveCatalog").mockResolvedValue({
        "21": {
          code: "21",
          name: "Capcut Pro 7 day BHF",
          price: 3900,
          inStock: 0,
        },
        "35": {
          code: "35",
          name: "Capcut Pro 30d full Date - BHF",
          price: 32900,
          inStock: 11,
        },
      });

      const info = await adapter.fetchProductInfo(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21"
      );

      // Must report inStock: 0 for #21 and NOT auto-remap to #35
      expect(info.supplierProductCode).toBe("21");
      expect(info.inStock).toBe(0);
      expect(info.name).toContain("Capcut Pro 7");
      expect(info.price).toBe(3900);
    });

    it("fetchProductInfo fails safely for unknown product codes (no fake Gemini fallback)", async () => {
      const adapter = new TelegramBotAdapter();
      vi.spyOn(adapter as any, "getLiveCatalog").mockResolvedValue({});

      const info = await adapter.fetchProductInfo(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "UNKNOWN_SKU_999"
      );

      expect(info.name).toBe("Sản phẩm không khả dụng");
      expect(info.price).toBe(0);
      expect(info.inStock).toBe(0);
    });

    it("buyXoaiNon safely aborts when target product button is out of stock ('hết hàng')", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • Hết hàng • SL 0",
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
        "ORD_TEST_OOS_1",
        {
          expectedPrice: 3900,
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.deliveredKeys).toEqual([]);
      expect(result.error).toContain("hết hàng");
      // Must not click view or payment
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe("7. Canva Pro 1M (#71, alias #28) Strict Duration Isolation", () => {
    it("strictly matches only Canva 1-month tokens", () => {
      expect(matchesProductStrictly("71", "Canva Pro 1 tháng • 30k")).toBe(true);
      expect(matchesProductStrictly("71", "Canva Pro 1 thg")).toBe(true);
      expect(matchesProductStrictly("71", "Canva Pro 1m")).toBe(true);
      expect(matchesProductStrictly("71", "Canva Pro 1 Tháng Chính Chủ")).toBe(true);
    });

    it("NEVER matches Canva Pro annual, multi-month, or lifetime variants", () => {
      expect(matchesProductStrictly("71", "Canva Pro 1 năm • 300k")).toBe(false);
      expect(matchesProductStrictly("71", "Canva Pro 12 tháng")).toBe(false);
      expect(matchesProductStrictly("71", "Canva Pro 1 year")).toBe(false);
      expect(matchesProductStrictly("71", "Canva Pro 1y")).toBe(false);
      expect(matchesProductStrictly("71", "Canva Pro 365")).toBe(false);
      expect(matchesProductStrictly("71", "Canva Pro vĩnh viễn")).toBe(false);
      expect(matchesProductStrictly("71", "Canva Pro lifetime")).toBe(false);
    });

    it("alias #28 correctly maps to #71 and enforces strict Canva 1M isolation", () => {
      expect(matchesProductStrictly("28", "Canva Pro 1 tháng • 30k")).toBe(true);
      expect(matchesProductStrictly("28", "Canva Pro 1 thg")).toBe(true);
      expect(matchesProductStrictly("28", "Canva Pro 1m")).toBe(true);
      expect(matchesProductStrictly("28", "Canva Pro 1 năm • 300k")).toBe(false);
      expect(matchesProductStrictly("28", "Canva Pro 12 tháng")).toBe(false);
      expect(determineKeywords("28").length).toBeGreaterThan(0);
      expect(determineKeywords("28")).toEqual(determineKeywords("71"));
    });
  });

  describe("8. NordVPN 3M (#65) Strict Duration Isolation", () => {
    it("strictly matches only NordVPN 3-month tokens", () => {
      expect(matchesProductStrictly("65", "Nord VPN 3 tháng • 50k")).toBe(true);
      expect(matchesProductStrictly("65", "Nord VPN 3 thg")).toBe(true);
      expect(matchesProductStrictly("65", "Nord VPN 3m")).toBe(true);
      expect(matchesProductStrictly("65", "NordVPN 3 tháng")).toBe(true);
    });

    it("NEVER matches NordVPN annual or multi-year variants", () => {
      expect(matchesProductStrictly("65", "Nord VPN 3 năm • 500k")).toBe(false);
      expect(matchesProductStrictly("65", "Nord VPN 3 years")).toBe(false);
      expect(matchesProductStrictly("65", "Nord VPN 1 năm")).toBe(false);
      expect(matchesProductStrictly("65", "Nord VPN 2 năm")).toBe(false);
      expect(matchesProductStrictly("65", "Nord VPN 3y")).toBe(false);
    });
  });

  describe("9. Type Safety and Untrusted Input Resilience", () => {
    it("safely returns false without throwing on non-string text inputs", () => {
      expect(matchesProductStrictly("21", 12345 as any)).toBe(false);
      expect(matchesProductStrictly("21", {} as any)).toBe(false);
      expect(matchesProductStrictly("21", [] as any)).toBe(false);
      expect(matchesProductStrictly("21", true as any)).toBe(false);
      expect(() => matchesProductStrictly("21", 12345 as any)).not.toThrow();
      expect(() => matchesProductStrictly("21", {} as any)).not.toThrow();
    });

    it("safely returns false without throwing on non-string code inputs", () => {
      expect(matchesProductStrictly(12345 as any, "Capcut Pro 7d")).toBe(false);
      expect(matchesProductStrictly({} as any, "Capcut Pro 7d")).toBe(false);
      expect(matchesProductStrictly([] as any, "Capcut Pro 7d")).toBe(false);
      expect(matchesProductStrictly(null as any, "Capcut Pro 7d")).toBe(false);
      expect(matchesProductStrictly(undefined as any, "Capcut Pro 7d")).toBe(false);
      expect(() => matchesProductStrictly(12345 as any, "Capcut Pro 7d")).not.toThrow();
    });
  });
});
