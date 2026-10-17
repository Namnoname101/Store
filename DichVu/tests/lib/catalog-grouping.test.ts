import { describe, it, expect } from "vitest";
import {
  isDisallowedShortTermApiPackage,
  processSectionProducts,
  extractVariantLabel,
} from "@/lib/catalog-grouping";

describe("Short-Term API Package Filter (isDisallowedShortTermApiPackage)", () => {
  it("should filter out 1 day, 3 day, and 7 day Cursor packages", () => {
    expect(
      isDisallowedShortTermApiPackage({
        title: "API Cursor 1 Ngày",
        description: "200 - 400 tin nhắn 1 ngày reset 7h AM",
        slug: "cur-0013-api-cursor-1-ngay",
      })
    ).toBe(true);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Cursor 3 Ngày",
        description: "200 - 400 tin nhắn 1 ngày reset 7h AM",
        slug: "cur-0034-api-cursor-3-ngay",
      })
    ).toBe(true);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Cursor 7 Ngày",
        description: "200 - 400 tin nhắn 1 ngày reset 7h AM",
        slug: "cur-0014-api-cursor-7-ngay",
      })
    ).toBe(true);
  });

  it("should filter out daily reset / daily message cap packages", () => {
    expect(
      isDisallowedShortTermApiPackage({
        title: "API Cursor 30 Ngày",
        description: "200 - 400 tin nhắn 1 ngày reset 7h AM",
        slug: "cur-0015-api-cursor-30-ngay",
      })
    ).toBe(true);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Claude 1 tháng Max",
        description: "150$ credit/ngày, reset 7h sáng",
        slug: "cla-0043-api-claude-1-thang-max",
      })
    ).toBe(true);
  });

  it("should filter out hourly, shift, or random quota packages", () => {
    expect(
      isDisallowedShortTermApiPackage({
        title: "API Random hạn 12h - 2 ngày (Random 700 - 13000 quota)",
        slug: "cur-0102-api-random-han-12h",
      })
    ).toBe(true);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Claude 19h - 23h00p mua xong ib tele hoặc zalo",
        description: "450$ hạn 20h - 23h59p",
        slug: "cla-0051-api-claude-19h",
      })
    ).toBe(true);
  });

  it("should filter out 1 week and short-term Claude packages", () => {
    expect(
      isDisallowedShortTermApiPackage({
        title: "API Claude Unlimited 1 Ngày",
        slug: "cla-0084-api-claude-1-ngay",
      })
    ).toBe(true);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Claude 1 tuần Max",
        description: "20$ Credit/1 ngày",
        slug: "cla-0086-api-claude-1-tuan",
      })
    ).toBe(true);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Claude 20 ngày",
        description: "5000$ đã dùng được 890$",
        slug: "cla-0104-api-claude-20-ngay",
      })
    ).toBe(true);
  });

  it("should ALLOW standard credit and request packages", () => {
    // Normal Codex packages
    expect(
      isDisallowedShortTermApiPackage({
        title: "Gói Codex 10$ Credit",
        description: "5.000.000 Quota Points",
        slug: "codex-credit-10usd",
      })
    ).toBe(false);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Codex AI- tốc độ nhanh (10$ Credit)",
        description: "10.000 VNĐ = 10$ Credit",
        slug: "cdx-0055-api-codex-ai",
      })
    ).toBe(false);

    // Normal Claude packages
    expect(
      isDisallowedShortTermApiPackage({
        title: "API Claude 10$ Max",
        description: "15.000 VNĐ = 10$ Credit",
        slug: "cla-0036-api-claude-10-max",
      })
    ).toBe(false);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Claude 100$ Max",
        description: "150.000 VNĐ = 100$ Credit",
        slug: "cla-0037-api-claude-100-max",
      })
    ).toBe(false);

    // Normal Cursor request packages (30 Days)
    expect(
      isDisallowedShortTermApiPackage({
        title: "API Cursor 30 Ngày (700 Request)",
        description: "700 Request",
        slug: "cur-0009-api-cursor-30-ngay-700-request",
      })
    ).toBe(false);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API Cursor 30 Ngày (1300 Request)",
        description: "1300 Request",
        slug: "cur-0010-api-cursor-30-ngay-1300-request",
      })
    ).toBe(false);

    // Normal Gemini / DeepSeek / Grok / Kimi packages
    expect(
      isDisallowedShortTermApiPackage({
        title: "API Gemini 50$",
        description: "75.000 VNĐ = 50$ Credit",
        slug: "gem-0099-api-gemini-50",
      })
    ).toBe(false);

    expect(
      isDisallowedShortTermApiPackage({
        title: "API DeepSeek - tốc độ nhanh (100$ Credit)",
        description: "100.000 VNĐ = 100$ Credit",
        slug: "dsk-0075-api-deepseek",
      })
    ).toBe(false);
  });
});

describe("Catalog Grouping & Codex Variant Deduplication", () => {
  it("should deduplicate variants with the same label on Codex brand card", () => {
    const rawProducts = [
      {
        id: "codex-local-10",
        title: "Gói Codex 10$ Credit",
        price: 12000,
        originalPrice: 15000,
        slug: "codex-credit-10usd",
        description: "5.000.000 Quota Points",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cdx-0055-old",
        title: "API Codex AI- tốc độ nhanh",
        price: 22000,
        originalPrice: 28000,
        slug: "cdx-0055-api-codex-ai-toc-o-nhanh",
        description: "10.000 VNĐ = 10$ Credit",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cdx-0055-new",
        title: "API Codex AI- tốc độ nhanh (10$ Credit)",
        price: 22000,
        originalPrice: 28000,
        slug: "cdx-0055-api-codex-ai-toc-o-nhanh-10-credit",
        description: "10.000 VNĐ = 10$ Credit",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cdx-0056-old",
        title: "API Codex AI - tốc độ nhanh",
        price: 60000,
        originalPrice: 75000,
        slug: "cdx-0056-api-codex-ai-toc-o-nhanh",
        description: "50.000 VNĐ = 50$ Credit",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cdx-0056-new",
        title: "API Codex AI - tốc độ nhanh (50$ Credit)",
        price: 110000,
        originalPrice: 130000,
        slug: "cdx-0056-api-codex-ai-toc-o-nhanh-50-credit",
        description: "50.000 VNĐ = 50$ Credit",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cdx-0057-old",
        title: "API Codex AI - tốc độ nhanh",
        price: 120000,
        originalPrice: 150000,
        slug: "cdx-0057-api-codex-ai-toc-o-nhanh",
        description: "100.000 VNĐ = 100$ Credit",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cdx-0058-old",
        title: "API Codex AI - tốc độ nhanh",
        price: 240000,
        originalPrice: 300000,
        slug: "cdx-0058-api-codex-ai-toc-o-nhanh",
        description: "200.000 VNĐ = 200$ Credit",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cdx-0060-old",
        title: "API Codex AI - tốc độ nhanh",
        price: 540000,
        originalPrice: 650000,
        slug: "cdx-0060-api-codex-ai-toc-o-nhanh",
        description: "450.000 VNĐ = 500$ Credit",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      // Short-term packages mixed in
      {
        id: "cur-short-1",
        title: "API Cursor 1 Ngày",
        price: 24000,
        slug: "cur-0013-api-cursor-1-ngay",
        description: "200 - 400 tin nhắn 1 ngày reset 7h AM",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "cur-short-2",
        title: "API Random hạn 12h - 2 ngày (Random 700 - 13000 quota)",
        price: 36000,
        slug: "cur-0102-api-random-han-12h",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
    ];

    const { items } = processSectionProducts(rawProducts);

    // Short-term products should be excluded completely
    const allProductsInResult = items.flatMap((it) =>
      it.type === "grouped" ? it.groupedData!.variants : [it.singleProduct]
    );
    expect(allProductsInResult.some((p) => p.title.includes("1 Ngày"))).toBe(false);
    expect(allProductsInResult.some((p) => p.title.includes("12h"))).toBe(false);

    // Codex card should be grouped
    const codexCard = items.find(
      (it) => it.type === "grouped" && it.groupKey === "codex"
    );
    expect(codexCard).toBeDefined();
    expect(codexCard?.groupedData).toBeDefined();

    const variants = codexCard!.groupedData!.variants;
    const variantLabels = variants.map((v) => v.variantLabel);

    // There should be NO duplicate variant labels
    const uniqueLabels = new Set(variantLabels);
    expect(variantLabels.length).toBe(uniqueLabels.size);

    // Variants should be the standard credit packages: $10, $50, $100, $200, $500
    expect(variantLabels).toEqual(["$10", "$50", "$100", "$200", "$500"]);

    // Lowest price for $10 should be 12000 (from local package)
    const v10 = variants.find((v) => v.variantLabel === "$10");
    expect(v10?.price).toBe(12000);

    // Lowest price for $50 should be 60000
    const v50 = variants.find((v) => v.variantLabel === "$50");
    expect(v50?.price).toBe(60000);

    // Grouped card MUST have a valid thumbnail (fallback from other variants or brand fallback)
    expect(codexCard!.groupedData!.thumbnailUrl).toBeTruthy();
    expect(codexCard!.groupedData!.thumbnailUrl).toContain("http");
  });
});
