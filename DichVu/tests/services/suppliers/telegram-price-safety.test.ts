import { describe, it, expect, vi } from "vitest";
import {
  parseNumericPrice,
  checkPriceSafety,
  extractDetailPrice,
  extractCheckoutTotal,
  TelegramBotAdapter,
} from "@/services/suppliers/adapters/telegram-bot.adapter";

describe("Telegram Supplier Bot - Price Safety Guard", () => {
  describe("1. Numeric Price Parsing", () => {
    it("correctly parses decimal 'k' unit shorthand", () => {
      expect(parseNumericPrice("3.9k")).toBe(3900);
      expect(parseNumericPrice("32.9k")).toBe(32900);
      expect(parseNumericPrice("119.5k")).toBe(119500);
      expect(parseNumericPrice("2k")).toBe(2000);
      expect(parseNumericPrice("0.5k")).toBe(500);
      expect(parseNumericPrice("15k")).toBe(15000);
    });

    it("correctly parses decimal 'k' unit with Vietnamese comma separator", () => {
      expect(parseNumericPrice("3,9k")).toBe(3900);
      expect(parseNumericPrice("32,9k")).toBe(32900);
      expect(parseNumericPrice("119,5k")).toBe(119500);
    });

    it("correctly parses 'đ', '₫', 'VND' unit with thousands separator", () => {
      expect(parseNumericPrice("3.900đ")).toBe(3900);
      expect(parseNumericPrice("32.900đ")).toBe(32900);
      expect(parseNumericPrice("3.900 ₫")).toBe(3900);
      expect(parseNumericPrice("32,900 VND")).toBe(32900);
      expect(parseNumericPrice("3.900 VNĐ")).toBe(3900);
      expect(parseNumericPrice("2000đ")).toBe(2000);
    });

    it("correctly extracts prices from real Telegram button titles", () => {
      expect(parseNumericPrice("Capcut Pro 7 day BHF • 3.9k • SL 13")).toBe(3900);
      expect(
        parseNumericPrice("Capcut Pro 30d full Date - BHF • 32.9k • SL 11")
      ).toBe(32900);
      expect(
        parseNumericPrice(
          "Chatgpt Plus pay Apple Gmail 1 thg - BH 24H • 119.5k • SL 9"
        )
      ).toBe(119500);
      expect(parseNumericPrice("MUSE AI 1 TỶ TOKEN KBH • 2.000đ • SL 195")).toBe(
        2000
      );
      expect(parseNumericPrice("MUSE AI 31 TỶ TOKEN KBH • 9.800đ • SL 51")).toBe(
        9800
      );
    });

    it("returns null for unparseable or invalid price strings", () => {
      expect(parseNumericPrice("")).toBeNull();
      expect(parseNumericPrice("hết hàng")).toBeNull();
      expect(parseNumericPrice("Capcut Pro 7 day")).toBeNull();
      expect(parseNumericPrice(null as any)).toBeNull();
      expect(parseNumericPrice(undefined as any)).toBeNull();
    });

    it("rejects negative price strings and non-finite numbers", () => {
      expect(parseNumericPrice("-3900đ")).toBeNull();
      expect(parseNumericPrice("-3.9k")).toBeNull();
      expect(parseNumericPrice("-32.900đ")).toBeNull();
      expect(parseNumericPrice("-100")).toBeNull();
      expect(parseNumericPrice(-100 as any)).toBeNull();
      expect(parseNumericPrice(Infinity as any)).toBeNull();
      expect(parseNumericPrice(-Infinity as any)).toBeNull();
    });

    it("parses combined shorthand currency representations like 3.9kvnd", () => {
      expect(parseNumericPrice("3.9kvnd")).toBe(3900);
      expect(parseNumericPrice("3.9k vnd")).toBe(3900);
    });
  });

  describe("2. checkPriceSafety Zero-Tolerance Guard", () => {
    it("passes when actualPrice <= expectedPrice", () => {
      // Exact price match
      const exact = checkPriceSafety(3900, 3900);
      expect(exact.safe).toBe(true);
      expect(exact.reason).toBeUndefined();

      // Cheaper price (discount/promotion)
      const cheaper = checkPriceSafety(3500, 3900);
      expect(cheaper.safe).toBe(true);
      expect(cheaper.reason).toBeUndefined();
    });

    it("aborts when actualPrice > expectedPrice (zero tolerance)", () => {
      const result = checkPriceSafety(32900, 3900);
      expect(result.safe).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.reason).toContain("32.900");
      expect(result.reason).toContain("3.900");
    });

    it("boundary test: aborts when actualPrice exceeds by exactly +1 VND", () => {
      const boundary = checkPriceSafety(3901, 3900);
      expect(boundary.safe).toBe(false);
      expect(boundary.reason).toContain("PRICE_SAFETY_VIOLATION");

      // Exactly equal passes
      const exact = checkPriceSafety(3900, 3900);
      expect(exact.safe).toBe(true);

      // 1 VND under passes
      const under = checkPriceSafety(3899, 3900);
      expect(under.safe).toBe(true);
    });

    it("fails safe when actualPrice or expectedPrice is invalid or zero", () => {
      expect(checkPriceSafety(0, 3900).safe).toBe(false);
      expect(checkPriceSafety(-100, 3900).safe).toBe(false);
      expect(checkPriceSafety(NaN, 3900).safe).toBe(false);
      expect(checkPriceSafety(3900, 0).safe).toBe(false);
      expect(checkPriceSafety(3900, -500).safe).toBe(false);
      expect(checkPriceSafety(3900, NaN).safe).toBe(false);
      expect(checkPriceSafety(null as any, 3900).safe).toBe(false);
      expect(checkPriceSafety(3900, null as any).safe).toBe(false);
    });
  });

  describe("3. Message Price Extractors", () => {
    it("extractDetailPrice extracts price from product detail messages", () => {
      const detailMsg = `
Thông tin sản phẩm:
Tên: Capcut Pro 7 day BHF
Giá bán: 3.900đ
Bảo hành: 7 ngày
      `.trim();
      expect(extractDetailPrice(detailMsg)).toBe(3900);

      const detailMsgK = `
Tên: Capcut Pro 30d
Giá: 32.9k
SL: 11
      `.trim();
      expect(extractDetailPrice(detailMsgK)).toBe(32900);
    });

    it("extractCheckoutTotal extracts total order amount on checkout screen", () => {
      const checkoutMsg = `
Xác nhận đơn hàng:
Sản phẩm: Capcut Pro 7 day BHF
Đơn giá: 3.900đ
Số lượng: 2
Tổng thanh toán: 7.800đ
      `.trim();
      expect(extractCheckoutTotal(checkoutMsg)).toBe(7800);

      const checkoutMsgK = `
Xác nhận đơn hàng
Đơn giá: 32.9k
Số lượng: 1
Tổng: 32.9k
      `.trim();
      expect(extractCheckoutTotal(checkoutMsgK)).toBe(32900);
    });
  });

  describe("4. End-to-End buyXoaiNon Price Safety Enforcement", () => {
    it("aborts at Checkpoint 1 (Catalog Button) when button price exceeds expectedPrice", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

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

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Order CapCut 7d (expectedPrice: 3900), but button price is 32.9k (32900)
      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_TEST_PRICE_1",
        {
          expectedPrice: 3900,
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.deliveredKeys).toEqual([]);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.error).toContain("32.900");
      expect(result.error).toContain("3.900");

      // Verify no clicks were performed (transaction aborted before navigation)
      expect(clickSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("aborts at Checkpoint 2 (Detail Screen) when detail screen price exceeds expectedPrice", async () => {
      const adapter = new TelegramBotAdapter();

      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              // Button does not have price or has 3900
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • 3.9k • SL 10",
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: vi.fn().mockResolvedValue(true),
      };

      const mockDetailMsg = {
        message: "Capcut Pro 7 day BHF\nGiá: 32.900đ\nSL: 10",
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
        click: vi.fn(),
      };

      const mockClient: any = {
        getMessages: vi
          .fn()
          .mockResolvedValueOnce([mockCatalogMsg]) // preMsgs
          .mockResolvedValueOnce([mockCatalogMsg]) // after /buy
          .mockResolvedValueOnce([mockDetailMsg]), // after clicking product view
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_TEST_PRICE_2",
        {
          expectedPrice: 3900,
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.error).toContain("32.900");
      // Detail message click (buyqty) must NOT have been called
      expect(mockDetailMsg.click).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("aborts at Checkpoint 3 (Checkout Screen) before clicking pay:wallet", async () => {
      const adapter = new TelegramBotAdapter();

      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • 3.9k • SL 10",
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: vi.fn().mockResolvedValue(true),
      };

      const mockDetailMsg = {
        message: "Capcut Pro 7 day BHF\nGiá: 3.9k\nSL: 10",
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
        click: vi.fn().mockResolvedValue(true),
      };

      const mockCheckoutMsg = {
        // Unexpectedly high total on checkout screen
        message: "Xác nhận đơn hàng\nSố lượng: 1\nTổng thanh toán: 32.900đ",
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Thanh toán ví",
                  data: Buffer.from("pay:wallet:21:1"),
                },
              ],
            },
          ],
        },
        click: vi.fn(),
      };

      const mockClient: any = {
        getMessages: vi
          .fn()
          .mockResolvedValueOnce([mockCatalogMsg]) // preMsgs
          .mockResolvedValueOnce([mockCatalogMsg]) // after /buy
          .mockResolvedValueOnce([mockDetailMsg]) // after clicking product view
          .mockResolvedValueOnce([mockCheckoutMsg]), // after clicking quantity
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_TEST_PRICE_3",
        {
          expectedPrice: 3900,
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.error).toContain("32.900");
      // Payment button must NEVER have been clicked!
      expect(mockCheckoutMsg.click).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("aborts pre-flight without clicking any buttons when expectedPrice is zero", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • 3.9k • SL 10",
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
        "ORD_TEST_ZERO_EXPECTED",
        {
          expectedPrice: 0,
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.deliveredKeys).toEqual([]);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.error).toContain("không hợp lệ hoặc chưa được thiết lập");
      // Pre-flight abort must NOT invoke any button clicks
      expect(clickSpy).not.toHaveBeenCalled();
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it("aborts pre-flight without clicking any buttons when expectedPrice is negative", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_TEST_NEGATIVE_EXPECTED",
        {
          expectedPrice: -500,
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("aborts pre-flight on unknown SKU with no catalog price and undefined expectedPrice", async () => {
      const adapter = new TelegramBotAdapter();
      const clickSpy = vi.fn();

      const mockClient: any = {
        getMessages: vi.fn().mockResolvedValue([]),
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "99999",
        1,
        "ORD_TEST_UNKNOWN_NO_EXPECTED",
        {
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("aborts at Checkpoint 3 (No Blind Payment) when button, detail, and checkout prices are all unparseable", async () => {
      const adapter = new TelegramBotAdapter();
      (adapter as any).delay = vi.fn();

      const mockCatalogMsg = {
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Capcut Pro 7 day BHF • SL 10", // No price on button
                  data: Buffer.from("product:view:21"),
                },
              ],
            },
          ],
        },
        click: vi.fn().mockResolvedValue(true),
      };

      const mockDetailMsg = {
        message: "Capcut Pro 7 day BHF\nSL: 10", // No price in detail message
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
        click: vi.fn().mockResolvedValue(true),
      };

      const payClickSpy = vi.fn();
      const mockCheckoutMsg = {
        message: "Xác nhận đơn hàng\nSố lượng: 1\nTrạng thái: Đang xử lý", // No price in checkout message
        replyMarkup: {
          rows: [
            {
              buttons: [
                {
                  text: "Thanh toán ví",
                  data: Buffer.from("pay:wallet:21:1"),
                },
              ],
            },
          ],
        },
        click: payClickSpy,
      };

      const mockClient: any = {
        getMessages: vi
          .fn()
          .mockResolvedValueOnce([mockCatalogMsg]) // preMsgs
          .mockResolvedValueOnce([mockCatalogMsg]) // after /buy
          .mockResolvedValueOnce([mockDetailMsg]) // after clicking product view
          .mockResolvedValueOnce([mockCheckoutMsg]), // after clicking quantity
        sendMessage: vi.fn().mockResolvedValue({}),
      };

      const result = await adapter.buyProduct(
        { baseUrl: "@shopxoainon_bot", apiKey: "test" },
        "21",
        1,
        "ORD_TEST_UNPARSEABLE_FAILSAFE",
        {
          expectedPrice: 3900,
          mockClient,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("PRICE_SAFETY_VIOLATION");
      expect(result.error).toContain("Không thể xác định giá");
      // Payment button must NEVER be clicked blindly
      expect(payClickSpy).not.toHaveBeenCalled();
    });
  });
});
