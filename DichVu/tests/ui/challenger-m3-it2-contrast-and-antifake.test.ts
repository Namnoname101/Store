import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { AI_FRONTIER_MODELS } from "@/lib/constants/ai-models";

/**
 * Adversarial Contrast & Anti-Fake Empirical Challenge Suite
 * Milestone 3 Iteration 2 (Purchase Flow & Handover)
 */
describe("Challenger M3-IT2-2: Contrast, Touch Targets, Anti-Fake & SSOT Integrity", () => {
  const rootDir = resolve(__dirname, "../..");
  const secretDisplaySource = readFileSync(
    resolve(rootDir, "src/components/SecretDisplay.tsx"),
    "utf-8"
  );
  const checkoutClientSource = readFileSync(
    resolve(rootDir, "src/components/CheckoutClient.tsx"),
    "utf-8"
  );
  const cartPageSource = readFileSync(
    resolve(rootDir, "src/app/cart/page.tsx"),
    "utf-8"
  );
  const cartDrawerSource = readFileSync(
    resolve(rootDir, "src/components/CartDrawer.tsx"),
    "utf-8"
  );

  // ---------------------------------------------------------------------------
  // 1. Contrast & Invisible Text Stress Test
  // ---------------------------------------------------------------------------
  describe("1. Zero Invisible Text & Semantic Token Compliance", () => {
    it("proves 0 occurrences of white text on light backgrounds in SecretDisplay.tsx", () => {
      // White-on-white defect patterns identified in M3-IT1
      expect(secretDisplaySource).not.toMatch(/bg-white[^\s"]*\s+[^"]*text-white/);
      expect(secretDisplaySource).not.toMatch(/text-white[^"]*bg-white/);
      expect(secretDisplaySource).not.toContain("bg-white/95");
      expect(secretDisplaySource).not.toContain("dark:bg-[#0b0f19]");

      // Extract every line containing 'text-white' in SecretDisplay
      const lines = secretDisplaySource.split("\n");
      const textWhiteLines = lines.filter((l) => l.includes("text-white"));

      // Every text-white occurrence MUST be accompanied by a solid colored dark background
      for (const line of textWhiteLines) {
        const hasSolidColoredBg =
          line.includes("bg-emerald-600") ||
          line.includes("bg-[#0088cc]") ||
          line.includes("bg-primary");
        expect(hasSolidColoredBg).toBe(true);
      }
    });

    it("proves 0 occurrences of white text on light backgrounds in CheckoutClient.tsx", () => {
      expect(checkoutClientSource).not.toMatch(/bg-white[^\s"]*\s+[^"]*text-white/);
      expect(checkoutClientSource).not.toMatch(/text-white[^"]*bg-white/);
      expect(checkoutClientSource).not.toContain("#0b0f19");

      // Extract every line containing 'text-white' in CheckoutClient
      const lines = checkoutClientSource.split("\n");
      const textWhiteLines = lines.filter((l) => l.includes("text-white"));

      for (const line of textWhiteLines) {
        const hasSolidColoredBg =
          line.includes("bg-emerald-600") ||
          line.includes("bg-emerald-500") ||
          line.includes("bg-amber-500") ||
          line.includes("bg-[#0088cc]") ||
          line.includes("bg-primary");
        expect(hasSolidColoredBg).toBe(true);
      }
    });

    it("verifies adaptive contrast pairs for alert containers across themes", () => {
      // Destructive alerts must have dark mode rose text
      expect(checkoutClientSource).toContain("text-destructive dark:text-rose-300");
      expect(checkoutClientSource).toContain("border-destructive/30 bg-destructive/10");

      // Amber warning alerts must have text-amber-800 dark:text-amber-300
      expect(checkoutClientSource).toContain("text-amber-800 dark:text-amber-300");
      expect(checkoutClientSource).toContain("bg-amber-500/10");

      // Stepper active states must have high-contrast text
      expect(checkoutClientSource).toContain("text-amber-700 dark:text-amber-400");
      expect(checkoutClientSource).toContain("text-emerald-700 dark:text-emerald-400");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Touch Target Compliance (WCAG 2.1 AA >= 44px)
  // ---------------------------------------------------------------------------
  describe("2. Touch Target Invariants (>= 44px)", () => {
    it("empirically asserts 0 occurrences of min-h-[40px] across all purchase components", () => {
      expect(cartPageSource).not.toContain("min-h-[40px]");
      expect(cartDrawerSource).not.toContain("min-h-[40px]");
      expect(checkoutClientSource).not.toContain("min-h-[40px]");
      expect(secretDisplaySource).not.toContain("min-h-[40px]");
    });

    it("verifies cart/page.tsx action controls satisfy min-h-[44px]", () => {
      // Coupon buttons
      expect(cartPageSource).toContain("min-h-[44px] rounded-xl border border-border px-4 py-2.5");
      expect(cartPageSource).toContain("min-h-[44px] rounded-xl bg-primary px-4 py-2.5");

      // Quantity stepper buttons
      expect(cartPageSource).toContain("flex min-h-[44px] min-w-[44px] items-center justify-center");

      // Item delete button
      expect(cartPageSource).toContain("min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2");

      // Select all button
      expect(cartPageSource).toContain("min-h-[44px] flex items-center gap-2 font-medium");

      // Inputs
      expect(cartPageSource).toContain("flex-1 min-h-[44px] rounded-xl border border-border");
      expect(cartPageSource).toContain("w-full min-h-[44px] rounded-xl border border-border");
    });

    it("verifies CheckoutClient.tsx action controls satisfy min-h-[44px]", () => {
      // Regenerate QR button & browse other products link
      expect(checkoutClientSource).toContain('min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-primary');
      expect(checkoutClientSource).toContain('min-h-[44px] inline-flex items-center justify-center rounded-xl border border-border');

      // Delta copy buttons
      expect(checkoutClientSource).toContain('min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border');

      // Telegram support link
      expect(checkoutClientSource).toContain('min-h-[44px] flex items-center gap-2 rounded-xl bg-primary');

      // Refund submit button
      expect(checkoutClientSource).toContain('min-h-[44px] flex w-full items-center justify-center gap-2 rounded-xl bg-primary');
    });

    it("verifies SecretDisplay.tsx refund form and actions satisfy min-h-[44px]", () => {
      expect(secretDisplaySource).toContain('min-h-[44px] w-full rounded-xl border border-input');
      expect(secretDisplaySource).toContain('min-h-[44px] flex w-full items-center justify-center gap-2 rounded-xl bg-primary');
      expect(secretDisplaySource).toContain('min-h-[44px] flex items-center gap-2 rounded-xl bg-[#0088cc]');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Anti-Fake Compliance
  // ---------------------------------------------------------------------------
  describe("3. Anti-Fake Compliance & Authentic Information", () => {
    it("proves 0 fake reviews or ratings in purchase and cart components", () => {
      const allPurchaseSource =
        secretDisplaySource + checkoutClientSource + cartPageSource + cartDrawerSource;

      // Must not contain mock rating texts
      expect(allPurchaseSource).not.toMatch(/124\s*đánh\s*giá/i);
      expect(allPurchaseSource).not.toMatch(/5\.0\s*\(\d+\s*đánh\s*giá\)/i);
      expect(allPurchaseSource).not.toMatch(/★★★★★/);

      // Must not contain fake order tickers
      expect(allPurchaseSource).not.toMatch(/vừa\s+mua\s+cách\s+đây/i);
      expect(allPurchaseSource).not.toMatch(/người\s+đang\s+xem\s+sản\s+phẩm\s+này/i);
    });

    it("proves 0 mock support phone/Zalo numbers in customer-facing links", () => {
      const allPurchaseSource =
        secretDisplaySource + checkoutClientSource + cartPageSource + cartDrawerSource;

      expect(allPurchaseSource).not.toContain("tel:0987654321");
      expect(allPurchaseSource).not.toContain("zalo.me/0987654321");
      expect(allPurchaseSource).not.toContain("tel:0123456789");
      expect(allPurchaseSource).not.toContain("zalo.me/0123456789");
    });

    it("verifies authentic customer support links use official Telegram", () => {
      expect(secretDisplaySource).toContain("https://t.me/daitruongstore");
      expect(checkoutClientSource).toContain("https://t.me/daitruongstore");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. SSOT Frontier AI Models Compliance
  // ---------------------------------------------------------------------------
  describe("4. Frontier AI Models SSOT Alignment", () => {
    it("verifies SSOT definitions strictly follow GEMINI.md rules", () => {
      // OpenAI Frontier Models
      expect(AI_FRONTIER_MODELS.openai.latestGeneration).toContain("GPT-6 series & o3");
      expect(AI_FRONTIER_MODELS.openai.defaultModelId).toBe("gpt-6-astra");
      const openaiModelsStr = AI_FRONTIER_MODELS.openai.flagshipModels.join(" ");
      expect(openaiModelsStr).toContain("GPT-6 series");
      expect(openaiModelsStr).toContain("Astra");
      expect(openaiModelsStr).toContain("Sol");
      expect(openaiModelsStr).toContain("Luna");
      expect(openaiModelsStr).toContain("o3");
      expect(openaiModelsStr).toContain("o1");
      expect(openaiModelsStr).toContain("GPT-4.5");

      // Google Gemini Frontier Models
      expect(AI_FRONTIER_MODELS.gemini.latestGeneration).toBe("Gemini 4 Argon");
      expect(AI_FRONTIER_MODELS.gemini.defaultModelId).toBe("gemini-4-argon");
      const geminiModelsStr = AI_FRONTIER_MODELS.gemini.flagshipModels.join(" ");
      expect(geminiModelsStr).toContain("Gemini 4 Argon");
      expect(geminiModelsStr).toContain("Gemini 3.8 Flash");
      expect(geminiModelsStr).toContain("Gemini 3.5 Flash");

      // Anthropic Claude Frontier Models
      expect(AI_FRONTIER_MODELS.claude.latestGeneration).toBe("Claude 5.5 & 5.6");
      expect(AI_FRONTIER_MODELS.claude.defaultModelId).toBe("claude-sonnet-5-5");
      const claudeModelsStr = AI_FRONTIER_MODELS.claude.flagshipModels.join(" ");
      expect(claudeModelsStr).toContain("Claude Opus 5.5");
      expect(claudeModelsStr).toContain("Claude Sonnet 5.5");
      expect(claudeModelsStr).toContain("Claude Haiku 5.5");
      expect(claudeModelsStr).toContain("Claude Code");
    });

    it("verifies ZERO customer-facing purchase flow files contain legacy model strings", () => {
      const purchaseFiles = [
        secretDisplaySource,
        checkoutClientSource,
        cartPageSource,
        cartDrawerSource,
      ];

      for (const src of purchaseFiles) {
        expect(src).not.toContain("claude-3-5");
        expect(src).not.toContain("claude-3.5");
        expect(src).not.toContain("Claude 3.5");
        expect(src).not.toContain("gemini-1.5");
        expect(src).not.toContain("gemini-2.0");
        expect(src).not.toContain("Gemini 1.5");
        expect(src).not.toContain("Gemini 2.0");
      }
    });
  });
});
