import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const BASE_DIR = path.resolve(__dirname, "../../src");

const TARGET_FILES = [
  "app/page.tsx",
  "components/Hero.tsx",
  "components/BrandFilterNavigator.tsx",
  "components/CatalogExplorer.tsx",
  "components/ProductCard.tsx",
  "components/GroupedProductCard.tsx",
  "components/QuickViewModal.tsx",
  "app/products/[slug]/page.tsx",
  "components/ProductDetailTabs.tsx",
  "components/ProductPurchaseBox.tsx",
];

describe("M2 Challenger: Empirical Verification & Adversarial Audit", () => {
  describe("Dimension 1: Anti-Fake Policy Compliance", () => {
    it("should ensure no simulated live purchase tickers exist in modified files", () => {
      const tickerPatterns = [
        /vừa mua/i,
        /đã đặt hàng thành công/i,
        /người đang xem/i,
        /khách đang xem/i,
        /vừa đặt/i,
      ];

      for (const relativePath of TARGET_FILES) {
        const fullPath = path.join(BASE_DIR, relativePath);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, "utf-8");

        for (const pattern of tickerPatterns) {
          const match = content.match(pattern);
          expect(
            match,
            `File ${relativePath} contains simulated live purchase ticker pattern: ${pattern}`
          ).toBeNull();
        }
      }
    });

    it("should ensure no fake customer review ratings or static stars exist", () => {
      const fakeReviewPatterns = [
        /4\.9\s*\/\s*5/i,
        /4\.8\s*\/\s*5/i,
        /5\.0\s*\/\s*5/i,
        /124\s*đánh giá/i,
        /128\s*đánh giá/i,
        /nhận xét từ khách hàng/i,
      ];

      for (const relativePath of TARGET_FILES) {
        const fullPath = path.join(BASE_DIR, relativePath);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, "utf-8");

        for (const pattern of fakeReviewPatterns) {
          const match = content.match(pattern);
          expect(
            match,
            `File ${relativePath} contains fake review pattern: ${pattern}`
          ).toBeNull();
        }
      }
    });
  });

  describe("Dimension 2: Frontier AI Models Registry SSOT", () => {
    it("should verify Hero.tsx displays current frontier models", () => {
      const heroPath = path.join(BASE_DIR, "components/Hero.tsx");
      const heroContent = fs.readFileSync(heroPath, "utf-8");

      expect(heroContent).toContain("Gemini 4 Argon");
      expect(heroContent).toContain("OpenAI GPT-6");
      expect(heroContent).toContain("Claude 5.5/5.6");
      expect(heroContent).not.toMatch(/Claude 3\.5/i);
      expect(heroContent).not.toMatch(/Gemini 2\.0/i);
    });

    it("should verify BrandFilterNavigator.tsx displays current frontier badges", () => {
      const brandNavPath = path.join(BASE_DIR, "components/BrandFilterNavigator.tsx");
      const content = fs.readFileSync(brandNavPath, "utf-8");

      expect(content).toContain('"5.5/5.6"');
      expect(content).toContain('"GPT-6/o3"');
      expect(content).toContain('"ARGON 4"');
      expect(content).toContain('"PRO"');
      expect(content).toContain('"CREDIT"');
    });

    it("should check if ProductDetailTabs.tsx contains legacy Claude 3.5 in code snippets", () => {
      const tabsPath = path.join(BASE_DIR, "components/ProductDetailTabs.tsx");
      const content = fs.readFileSync(tabsPath, "utf-8");

      // Verify table content has frontier models
      expect(content).toContain("Gemini 4 Argon");
      expect(content).toMatch(/Claude 5\.5 (&amp;|&) 5\.6/);
      expect(content).toMatch(/GPT-6 series (&amp;|&) o3/);

      // Adversarial Check: Does codeSnippets contain legacy Claude 3.5 Sonnet?
      const hasLegacyClaude35InSnippets = content.includes("claude-3-5-sonnet-20241022");
      expect(hasLegacyClaude35InSnippets).toBe(false);
      expect(content).toContain("claude-sonnet-5-5");
    });

    it("should check SSOT import status in Hero.tsx, BrandFilterNavigator.tsx, ProductDetailTabs.tsx", () => {
      const hero = fs.readFileSync(path.join(BASE_DIR, "components/Hero.tsx"), "utf-8");
      const brandNav = fs.readFileSync(path.join(BASE_DIR, "components/BrandFilterNavigator.tsx"), "utf-8");
      const tabs = fs.readFileSync(path.join(BASE_DIR, "components/ProductDetailTabs.tsx"), "utf-8");

      const heroImportsSSOT = hero.includes("ai-models");
      const brandNavImportsSSOT = brandNav.includes("ai-models");
      const tabsImportsSSOT = tabs.includes("ai-models");

      expect(heroImportsSSOT).toBe(true);
      expect(brandNavImportsSSOT).toBe(true);
      expect(tabsImportsSSOT).toBe(true);
    });
  });

  describe("Dimension 3: Live Stock Badge Logic (3 Tiers)", () => {
    it("should verify ProductCard implements 3-tier stock badge logic", () => {
      const cardPath = path.join(BASE_DIR, "components/ProductCard.tsx");
      const content = fs.readFileSync(cardPath, "utf-8");

      // Tier 1: stockCount > 5 -> Sẵn hàng
      expect(content).toMatch(/stockCount\s*>\s*5[\s\S]*?Sẵn hàng/);

      // Tier 2: 1 <= stockCount <= 5 -> Còn ít ({stockCount})
      expect(content).toMatch(/stockCount\s*>\s*0[\s\S]*?Còn ít/);

      // Tier 3: stockCount <= 0 -> Hết hàng
      expect(content).toMatch(/Hết hàng/);
    });

    it("should verify GroupedProductCard implements 3-tier stock badge logic", () => {
      const cardPath = path.join(BASE_DIR, "components/GroupedProductCard.tsx");
      const content = fs.readFileSync(cardPath, "utf-8");

      // Tier 1: activeVariant.stockCount > 5 -> Sẵn hàng
      expect(content).toMatch(/activeVariant\.stockCount\s*>\s*5[\s\S]*?Sẵn hàng/);

      // Tier 2: activeVariant.stockCount > 0 -> Còn ít
      expect(content).toMatch(/activeVariant\.stockCount\s*>\s*0[\s\S]*?Còn ít/);

      // Tier 3: <= 0 -> Hết hàng
      expect(content).toMatch(/Hết hàng/);
    });

    it("should verify ProductPurchaseBox implements 3-tier stock status banner", () => {
      const boxPath = path.join(BASE_DIR, "components/ProductPurchaseBox.tsx");
      const content = fs.readFileSync(boxPath, "utf-8");

      // Tier 1: effectiveStock > 5 -> Sẵn hàng
      expect(content).toMatch(/effectiveStock\s*>\s*5[\s\S]*?Sẵn hàng/);

      // Tier 2: Còn ít
      expect(content).toMatch(/Còn ít/);

      // Tier 3: Hết hàng
      expect(content).toMatch(/Hết hàng/);
    });

    it("should verify QuickViewModal implements the tier 2 'Còn ít' amber warning badge", () => {
      const qvPath = path.join(BASE_DIR, "components/QuickViewModal.tsx");
      const content = fs.readFileSync(qvPath, "utf-8");

      // In QuickViewModal.tsx:
      // It has the "Còn ít ({count})" tier with amber indicator
      const hasConItTier = content.includes("Còn ít");
      expect(hasConItTier).toBe(true);
    });
  });
});
