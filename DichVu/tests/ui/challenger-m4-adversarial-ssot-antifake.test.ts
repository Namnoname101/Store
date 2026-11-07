import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import { AI_FRONTIER_MODELS, DEFAULT_CLAUDE_MODEL_ID } from "@/lib/constants/ai-models";

/**
 * Adversarial Challenger Suite for Milestone 4 (Developer Zone & Customer Account)
 * Evaluator: challenger_m4_2
 * Focus: SSOT Frontier AI Models Compliance, Anti-Fake / Authentic Support, Touch Target Invariants.
 */
describe("Challenger M4-2: SSOT Frontier AI Models, Anti-Fake & Touch Target Audit", () => {
  const rootDir = resolve(__dirname, "../..");
  const srcDir = resolve(rootDir, "src");

  // Helper function to recursively collect all .ts and .tsx files
  function getAllSourceFiles(dir: string): string[] {
    let results: string[] = [];
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(getAllSourceFiles(fullPath));
      } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allSourceFiles = getAllSourceFiles(srcDir);

  // ---------------------------------------------------------------------------
  // 1. FRONTIER AI MODELS SSOT COMPLIANCE AUDIT (GEMINI.md)
  // ---------------------------------------------------------------------------
  describe("1. Frontier AI Models SSOT Compliance (GEMINI.md)", () => {
    it("asserts SSOT registry in ai-models.ts strictly implements current frontier generations", () => {
      // Anthropic Claude
      expect(AI_FRONTIER_MODELS.claude.latestGeneration).toBe("Claude 5.5 & 5.6");
      expect(AI_FRONTIER_MODELS.claude.defaultModelId).toBe("claude-sonnet-5-5");
      expect(DEFAULT_CLAUDE_MODEL_ID).toBe("claude-sonnet-5-5");
      const claudeModels = AI_FRONTIER_MODELS.claude.flagshipModels;
      expect(claudeModels.some((m) => m.includes("Claude Opus 5.5"))).toBe(true);
      expect(claudeModels.some((m) => m.includes("Claude Sonnet 5.5"))).toBe(true);
      expect(claudeModels.some((m) => m.includes("Claude Haiku 5.5"))).toBe(true);
      expect(claudeModels.some((m) => m.includes("Claude Code"))).toBe(true);

      // Google Gemini
      expect(AI_FRONTIER_MODELS.gemini.latestGeneration).toBe("Gemini 4 Argon");
      expect(AI_FRONTIER_MODELS.gemini.defaultModelId).toBe("gemini-4-argon");
      const geminiModels = AI_FRONTIER_MODELS.gemini.flagshipModels;
      expect(geminiModels.some((m) => m.includes("Gemini 4 Argon"))).toBe(true);
      expect(geminiModels.some((m) => m.includes("Gemini 3.8 Flash"))).toBe(true);
      expect(geminiModels.some((m) => m.includes("Gemini 3.5 Flash"))).toBe(true);

      // OpenAI
      expect(AI_FRONTIER_MODELS.openai.latestGeneration).toBe("GPT-6 series & o3");
      expect(AI_FRONTIER_MODELS.openai.defaultModelId).toBe("gpt-6-astra");
      const openaiModels = AI_FRONTIER_MODELS.openai.flagshipModels;
      expect(openaiModels.some((m) => m.includes("GPT-6 series"))).toBe(true);
      expect(openaiModels.some((m) => m.includes("o3"))).toBe(true);
      expect(openaiModels.some((m) => m.includes("o1"))).toBe(true);
      expect(openaiModels.some((m) => m.includes("GPT-4.5"))).toBe(true);
    });

    it("verifies 0 occurrences of legacy claude-3-5, claude-3.5, claude-3-opus across customer-facing src/components, src/app, src/lib", () => {
      const violations: { file: string; match: string }[] = [];
      const legacyPattern = /claude-3-5|claude-3\.5|claude-3-opus|claude-3-sonnet|claude-3-haiku/i;

      for (const filePath of allSourceFiles) {
        // Exclude test files
        if (filePath.includes("tests") || filePath.includes(".test.")) continue;
        const content = readFileSync(filePath, "utf-8");
        const match = content.match(legacyPattern);
        if (match) {
          violations.push({ file: filePath, match: match[0] });
        }
      }

      expect(violations).toEqual([]);
    });

    it("verifies 0 occurrences of legacy gemini-1.5 or gemini-2.0 across customer-facing code", () => {
      const violations: { file: string; match: string }[] = [];
      const legacyGeminiPattern = /gemini-1\.5|gemini-2\.0|gemini 1\.5|gemini 2\.0/i;

      for (const filePath of allSourceFiles) {
        if (filePath.includes("tests") || filePath.includes(".test.")) continue;
        const content = readFileSync(filePath, "utf-8");
        const match = content.match(legacyGeminiPattern);
        if (match) {
          violations.push({ file: filePath, match: match[0] });
        }
      }

      expect(violations).toEqual([]);
    });

    it("verifies CheckUsageClient.tsx imports and uses DEFAULT_CLAUDE_MODEL_ID fallback", () => {
      const checkUsageSource = readFileSync(
        resolve(rootDir, "src/components/CheckUsageClient.tsx"),
        "utf-8"
      );
      expect(checkUsageSource).toContain('import { DEFAULT_CLAUDE_MODEL_ID } from "@/lib/constants/ai-models"');
      expect(checkUsageSource).toContain("{r.model || DEFAULT_CLAUDE_MODEL_ID}");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ANTI-FAKE & AUTHENTIC SUPPORT VERIFICATION
  // ---------------------------------------------------------------------------
  describe("2. Anti-Fake & Authentic Support Links", () => {
    it("proves LiveOrderTicker has 0 fake purchase transactions and only genuine status", () => {
      const tickerSource = readFileSync(
        resolve(rootDir, "src/components/LiveOrderTicker.tsx"),
        "utf-8"
      );
      expect(tickerSource).not.toMatch(/vừa\s+mua\s+cách\s+đây/i);
      expect(tickerSource).not.toMatch(/124\s*đánh\s*giá/i);
      expect(tickerSource).toContain("Hệ thống VietQR 24/7 NAPAS hoạt động bình thường");
      expect(tickerSource).toContain("Bảo hành 1 đổi 1");
    });

    it("proves 0 fake reviews or mock ratings in M4 components", () => {
      const m4Components = [
        "src/components/CheckUsageClient.tsx",
        "src/components/CodexTopupClient.tsx",
        "src/components/CodexApiGuideHub.tsx",
        "src/components/ClaudeApiGuideHub.tsx",
        "src/components/ProfileClient.tsx",
        "src/components/TopupClient.tsx",
        "src/components/developer/UsageDashboardClient.tsx",
        "src/app/topup/[depositCode]/page.tsx",
      ];

      for (const relPath of m4Components) {
        const content = readFileSync(resolve(rootDir, relPath), "utf-8");
        expect(content).not.toMatch(/5\.0\s*\(\d+\s*đánh\s*giá\)/i);
        expect(content).not.toMatch(/★★★★★/);
        expect(content).not.toContain("tel:0987654321");
        expect(content).not.toContain("tel:0123456789");
      }
    });

    it("verifies official Telegram support link (https://t.me/daitruongstore) in support/fallback CTAs", () => {
      const depositExpiredSource = readFileSync(
        resolve(rootDir, "src/app/topup/[depositCode]/page.tsx"),
        "utf-8"
      );
      expect(depositExpiredSource).toContain("https://t.me/daitruongstore");

      const checkoutSource = readFileSync(
        resolve(rootDir, "src/components/CheckoutClient.tsx"),
        "utf-8"
      );
      expect(checkoutSource).toContain("https://t.me/daitruongstore");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. TOUCH TARGET COMPLIANCE AUDIT (WCAG 2.1 AA >= 44x44px)
  // ---------------------------------------------------------------------------
  describe("3. Touch Target Verification (>= 44x44px)", () => {
    it("verifies all buttons and inputs in ProfileClient.tsx meet min-h-[44px]", () => {
      const profileSource = readFileSync(
        resolve(rootDir, "src/components/ProfileClient.tsx"),
        "utf-8"
      );
      // Tabs
      expect(profileSource).toContain("min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold");
      // Topup CTA
      expect(profileSource).toContain("min-h-[44px] flex items-center gap-1.5 rounded-xl bg-primary");
      // Secret toggle & copy
      expect(profileSource).toContain("min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg");
      expect(profileSource).toContain("min-h-[44px] px-3 inline-flex items-center gap-1 rounded-lg");
    });

    it("verifies all controls in UsageDashboardClient.tsx meet min-h-[44px]", () => {
      const usageSource = readFileSync(
        resolve(rootDir, "src/components/developer/UsageDashboardClient.tsx"),
        "utf-8"
      );
      expect(usageSource).toContain("min-h-[44px] w-full rounded-xl border border-input");
      expect(usageSource).toContain("min-h-[44px] rounded-xl bg-primary px-6");
      expect(usageSource).toContain("min-h-[44px] min-w-[44px] inline-flex items-center justify-center");
    });

    it("verifies all controls in CheckUsageClient.tsx meet min-h-[44px]", () => {
      const checkUsageSource = readFileSync(
        resolve(rootDir, "src/components/CheckUsageClient.tsx"),
        "utf-8"
      );
      expect(checkUsageSource).toContain("min-h-[44px] min-w-[44px] inline-flex items-center justify-center");
      expect(checkUsageSource).toContain("min-h-[44px] inline-flex items-center justify-center gap-2");
    });

    it("verifies all controls in CodexTopupClient.tsx and TopupClient.tsx meet min-h-[44px]", () => {
      const codexTopupSource = readFileSync(
        resolve(rootDir, "src/components/CodexTopupClient.tsx"),
        "utf-8"
      );
      expect(codexTopupSource).toContain("w-full min-h-[44px] rounded-xl border border-input");

      const topupSource = readFileSync(
        resolve(rootDir, "src/components/TopupClient.tsx"),
        "utf-8"
      );
      expect(topupSource).toContain("min-h-[44px] flex items-center justify-center");
      expect(topupSource).toContain("w-full min-h-[44px] rounded-xl border border-input");
    });

    it("verifies all controls in topup/[depositCode]/page.tsx meet min-h-[44px]", () => {
      const depositPageSource = readFileSync(
        resolve(rootDir, "src/app/topup/[depositCode]/page.tsx"),
        "utf-8"
      );
      expect(depositPageSource).toContain("min-h-[44px] min-w-[44px] inline-flex items-center justify-center");
      expect(depositPageSource).toContain("min-h-[44px] px-3.5 inline-flex items-center gap-1.5");
      expect(depositPageSource).toContain("min-h-[44px] px-3 py-1.5 rounded-lg border border-border");
    });

    it("verifies all controls in login/page.tsx and register/page.tsx meet min-h-[44px]", () => {
      const loginSource = readFileSync(
        resolve(rootDir, "src/app/login/page.tsx"),
        "utf-8"
      );
      expect(loginSource).toContain("w-full min-h-[44px] rounded-xl border border-input");
      expect(loginSource).toContain("w-full min-h-[44px] flex items-center justify-center");

      const registerSource = readFileSync(
        resolve(rootDir, "src/app/register/page.tsx"),
        "utf-8"
      );
      expect(registerSource).toContain("w-full min-h-[44px] rounded-xl border border-input");
      expect(registerSource).toContain("w-full min-h-[44px] mt-2 flex items-center justify-center");
    });

    it("audits ClaudeApiGuideHub.tsx for touch target compliance (detects sub-44px targets)", () => {
      const claudeHubSource = readFileSync(
        resolve(rootDir, "src/components/ClaudeApiGuideHub.tsx"),
        "utf-8"
      );

      // Check whether sub-44px targets exist across all 7 defect areas in ClaudeApiGuideHub
      const sub44Matches: string[] = [];
      if (claudeHubSource.includes("min-h-[40px]")) {
        sub44Matches.push("min-h-[40px] found (Eye toggle button line 283)");
      }
      if (claudeHubSource.includes("min-w-[40px]")) {
        sub44Matches.push("min-w-[40px] found (Eye toggle button line 283)");
      }
      if (claudeHubSource.includes("text-[10px] text-slate-700 dark:text-slate-300")) {
        sub44Matches.push("Manual setup copy buttons with px-2 py-0.5 text-[10px] (~20px height) found (lines 646, 660, 674)");
      }
      if (claudeHubSource.includes("text-[11px] text-slate-700 dark:text-slate-300 transition")) {
        sub44Matches.push("Cursor copy buttons with px-2 py-0.5 text-[11px] (~20px height) found (lines 739, 755)");
      }
      if (claudeHubSource.includes("ml-2 px-2.5 py-1 rounded bg-slate-800")) {
        sub44Matches.push("VS Code CLI install copy button with px-2.5 py-1 (~26px height) found (line 815)");
      }
      if (claudeHubSource.includes("px-2.5 py-1 rounded transition")) {
        sub44Matches.push("OS selector pills with px-2.5 py-1 (~26px height) found (lines 858, 869)");
      }
      if (claudeHubSource.includes("px-3.5 py-1.5 rounded-lg transition font-semibold")) {
        sub44Matches.push("Open Design CTA button with px-3.5 py-1.5 (~28px height) found (line 1110)");
      }
      if (claudeHubSource.includes("px-3 py-1.5 rounded-lg text-white font-medium")) {
        sub44Matches.push("Lightbox close button with px-3 py-1.5 (~28px height) found (line 1224)");
      }

      // Adversarially verify zero sub-44px defects remain in ClaudeApiGuideHub
      expect(sub44Matches.length).toBe(0);

      // Verify all 7 controls explicitly feature min-h-[44px]
      expect(claudeHubSource).toContain("min-h-[44px] min-w-[44px] inline-flex items-center justify-center");
      expect(claudeHubSource).toContain("min-h-[44px] px-3.5 inline-flex items-center justify-center rounded-lg bg-slate-200");
      expect(claudeHubSource).toContain("min-h-[44px] px-3.5 inline-flex items-center justify-center rounded-lg bg-slate-100");
      expect(claudeHubSource).toContain("min-h-[44px] ml-2 px-3.5 inline-flex items-center justify-center rounded-lg");
      expect(claudeHubSource).toContain("min-h-[44px] px-4 py-2 inline-flex items-center justify-center rounded-lg");
      expect(claudeHubSource).toContain("min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600");
      expect(claudeHubSource).toContain("min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-800");
    });
  });
});
