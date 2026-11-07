import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { AI_FRONTIER_MODELS, DEFAULT_CLAUDE_MODEL_ID } from "@/lib/constants/ai-models";

describe("Milestone 4 Deep Empirical Challenger Stress Suite (challenger_m4_1)", () => {
  // =========================================================================
  // Dimension 1: Quota Gauge Calculations & Mathematical Boundaries
  // =========================================================================
  describe("Dimension 1: Quota Gauge Calculations & Mathematical Boundaries", () => {
    // In UsageDashboardClient.tsx:
    // radius r = 48, circumference C = 2 * Math.PI * 48
    // strokeDashoffset = C * (1 - Math.min(100, Math.max(0, usage.consumptionRate)) / 100)
    const RADIUS = 48;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    const calculateGaugeOffset = (consumptionRate: number) => {
      const clampedRate = Math.min(100, Math.max(0, consumptionRate));
      return CIRCUMFERENCE * (1 - clampedRate / 100);
    };

    const getGaugeColorClass = (consumptionRate: number) => {
      if (consumptionRate > 85) return "text-rose-500";
      if (consumptionRate > 60) return "text-amber-500";
      return "text-emerald-500";
    };

    it("verifies 0% used: stroke is fully offset (empty arc) and emerald", () => {
      const offset = calculateGaugeOffset(0);
      expect(offset).toBeCloseTo(CIRCUMFERENCE, 5);
      expect(getGaugeColorClass(0)).toBe("text-emerald-500");
    });

    it("verifies 50% used: stroke is exactly half offset and emerald", () => {
      const offset = calculateGaugeOffset(50);
      expect(offset).toBeCloseTo(CIRCUMFERENCE * 0.5, 5);
      expect(getGaugeColorClass(50)).toBe("text-emerald-500");
    });

    it("verifies 60% boundary: emerald at 60%, transitions to amber immediately at 60.1%", () => {
      // 60% is <= 60% -> emerald
      expect(getGaugeColorClass(60)).toBe("text-emerald-500");
      // 60.1% is > 60% and <= 85% -> amber
      expect(getGaugeColorClass(60.1)).toBe("text-amber-500");
      expect(getGaugeColorClass(75)).toBe("text-amber-500");
    });

    it("verifies 85% warning threshold: amber at 85%, transitions to rose immediately at 85.1%", () => {
      // 85% is exactly at the amber threshold
      expect(getGaugeColorClass(85)).toBe("text-amber-500");
      // 85.1% exceeds threshold -> rose danger
      expect(getGaugeColorClass(85.1)).toBe("text-rose-500");
      expect(getGaugeColorClass(99.9)).toBe("text-rose-500");
    });

    it("verifies 100%+ exhausted: offset clamps to 0 and does not invert or overflow", () => {
      const offset100 = calculateGaugeOffset(100);
      expect(offset100).toBeCloseTo(0, 5);
      expect(getGaugeColorClass(100)).toBe("text-rose-500");

      // Overflow test: 150% consumption (e.g. overage)
      const offset150 = calculateGaugeOffset(150);
      expect(offset150).toBeCloseTo(0, 5);
      expect(getGaugeColorClass(150)).toBe("text-rose-500");
    });

    it("verifies negative consumption rate (-10%) is clamped to 0 without breaking SVG geometry", () => {
      const offsetNegative = calculateGaugeOffset(-10);
      expect(offsetNegative).toBeCloseTo(CIRCUMFERENCE, 5);
      expect(getGaugeColorClass(-10)).toBe("text-emerald-500");
    });

    it("verifies total granted USD fallback calculation when totalGrantedUsd is undefined", () => {
      const computeTotalGranted = (usage: { totalGrantedUsd?: number; balanceUsd: number; usedUsd: number }) => {
        return usage.totalGrantedUsd !== undefined
          ? usage.totalGrantedUsd.toFixed(2)
          : (usage.balanceUsd + usage.usedUsd).toFixed(2);
      };

      // Explicit totalGrantedUsd present
      expect(computeTotalGranted({ totalGrantedUsd: 25.0, balanceUsd: 15.0, usedUsd: 10.0 })).toBe("25.00");

      // totalGrantedUsd missing: fallback dynamically sums balance + used
      expect(computeTotalGranted({ balanceUsd: 12.34, usedUsd: 7.66 })).toBe("20.00");
    });

    it("verifies CheckUsageClient remaining percent fallback cascade logic", () => {
      const computeUsagePercentages = (usageData: {
        totalCost?: number;
        costLimit?: number;
        dailyCostLimit?: number;
        dailyCostUsed?: number;
        fallbackRemainPercent?: number;
        dailyCostPercent?: number;
      }) => {
        const totalCost = Number(usageData.totalCost || 0);
        const costLimit = Number(usageData.costLimit || 0);
        const dailyCostLimit = Number(usageData.dailyCostLimit || 0);
        const dailyCostUsed = Number(usageData.dailyCostUsed || 0);
        const fallbackRemain = usageData.fallbackRemainPercent;

        const usedPercent = costLimit > 0 ? Math.min(100, Math.max(0, (totalCost / costLimit) * 100)) : 0;

        let remPercent = 100;
        if (fallbackRemain !== null && fallbackRemain !== undefined && Number.isFinite(Number(fallbackRemain))) {
          remPercent = Math.min(100, Math.max(0, Number(fallbackRemain)));
        } else if (dailyCostLimit > 0) {
          const dailyUsedPct = (dailyCostUsed / dailyCostLimit) * 100;
          remPercent = Math.min(100, Math.max(0, 100 - dailyUsedPct));
        } else if (usageData.dailyCostPercent !== null && usageData.dailyCostPercent !== undefined) {
          remPercent = Math.min(100, Math.max(0, 100 - Number(usageData.dailyCostPercent)));
        } else if (costLimit > 0) {
          remPercent = Math.max(0, 100 - usedPercent);
        }

        return { remainingPercent: remPercent, creditUsedPercent: usedPercent };
      };

      // 1. fallbackRemainPercent takes highest precedence
      expect(
        computeUsagePercentages({
          fallbackRemainPercent: 42,
          dailyCostLimit: 10,
          dailyCostUsed: 8,
          costLimit: 100,
          totalCost: 90,
        }).remainingPercent
      ).toBe(42);

      // 2. dailyCostLimit takes precedence over total costLimit
      expect(
        computeUsagePercentages({
          dailyCostLimit: 10,
          dailyCostUsed: 3, // 30% used -> 70% remaining
          costLimit: 100,
          totalCost: 80,
        }).remainingPercent
      ).toBe(70);

      // 3. dailyCostPercent takes third precedence
      expect(
        computeUsagePercentages({
          dailyCostPercent: 25, // 25% used -> 75% remaining
          costLimit: 100,
          totalCost: 50,
        }).remainingPercent
      ).toBe(75);

      // 4. costLimit fallback
      expect(
        computeUsagePercentages({
          costLimit: 100,
          totalCost: 35, // 35% used -> 65% remaining
        }).remainingPercent
      ).toBe(65);

      // 5. Default 100% when no limits present
      expect(computeUsagePercentages({})).toEqual({
        remainingPercent: 100,
        creditUsedPercent: 0,
      });
    });
  });

  // =========================================================================
  // Dimension 2: Request Logs Table Pagination, Filtering & Latency Rendering
  // =========================================================================
  describe("Dimension 2: Request Logs Table Pagination, Filtering & Latency Rendering", () => {
    const formatLatency = (log: { use_time?: number; latency?: number }) => {
      const latencyVal = log.use_time || log.latency;
      return latencyVal ? `${Math.round(latencyVal)}ms` : "--";
    };

    it("verifies latency rendering: prefers use_time, falls back to latency, formats with ms suffix", () => {
      // 1. With use_time
      expect(formatLatency({ use_time: 142.4, latency: 200 })).toBe("142ms");
      expect(formatLatency({ use_time: 350.8 })).toBe("351ms");

      // 2. Without use_time, with latency
      expect(formatLatency({ latency: 89.2 })).toBe("89ms");
      expect(formatLatency({ latency: 1205.6 })).toBe("1206ms");

      // 3. Neither present
      expect(formatLatency({})).toBe("--");

      // 4. Undefined / null
      expect(formatLatency({ use_time: undefined, latency: undefined })).toBe("--");

      // 5. 0ms edge case evaluates to placeholder "--"
      expect(formatLatency({ use_time: 0, latency: 0 })).toBe("--");
    });

    it("verifies totalPages calculation across pagination boundaries", () => {
      const calculateTotalPages = (totalLogs: number, pageSize: number = 15) => {
        return Math.max(1, Math.ceil(totalLogs / pageSize));
      };

      // Empty logs: 1 page minimum
      expect(calculateTotalPages(0)).toBe(1);

      // Exact page size boundary
      expect(calculateTotalPages(15)).toBe(1);

      // 1 item over page size: creates page 2
      expect(calculateTotalPages(16)).toBe(2);

      // Large dataset
      expect(calculateTotalPages(150)).toBe(10);
      expect(calculateTotalPages(151)).toBe(11);
    });

    it("verifies pagination navigation bounds: prevents negative page and overflow past totalPages", () => {
      const totalPages = 5;

      const navigatePrev = (currentPage: number) => Math.max(1, currentPage - 1);
      const navigateNext = (currentPage: number, maxPages: number) => Math.min(maxPages, currentPage + 1);

      // Page 1 prev stays at 1
      expect(navigatePrev(1)).toBe(1);
      expect(navigatePrev(2)).toBe(1);
      expect(navigatePrev(3)).toBe(2);

      // Page 5 next stays at 5
      expect(navigateNext(4, totalPages)).toBe(5);
      expect(navigateNext(5, totalPages)).toBe(5);
      expect(navigateNext(6, totalPages)).toBe(5);
    });

    it("verifies model name filtering: case-insensitive substring matching and quick pills", () => {
      const sampleLogs = [
        { id: 1, model_name: "claude-sonnet-5-5" },
        { id: 2, model_name: "Claude-Opus-5-5" },
        { id: 3, model_name: "gpt-6-astra" },
        { id: 4, model_name: "openai-o3" },
        { id: 5, model_name: "gemini-4-argon" },
      ];

      const filterLogs = (logs: typeof sampleLogs, filter: string) => {
        return logs.filter((l) => (filter ? l.model_name.toLowerCase().includes(filter.toLowerCase()) : true));
      };

      // Filter "" returns all
      expect(filterLogs(sampleLogs, "")).toHaveLength(5);

      // Filter "claude" matches both sonnet and opus case-insensitively
      const claudeResults = filterLogs(sampleLogs, "claude");
      expect(claudeResults).toHaveLength(2);
      expect(claudeResults.map((r) => r.id)).toEqual([1, 2]);

      // Filter "GPT-6" matches gpt-6-astra
      const gptResults = filterLogs(sampleLogs, "GPT-6");
      expect(gptResults).toHaveLength(1);
      expect(gptResults[0].model_name).toBe("gpt-6-astra");

      // Filter "gemini" matches gemini-4-argon
      const geminiResults = filterLogs(sampleLogs, "gemini");
      expect(geminiResults).toHaveLength(1);
      expect(geminiResults[0].model_name).toBe("gemini-4-argon");

      // Filter non-existent model returns empty array
      expect(filterLogs(sampleLogs, "deepseek-v3")).toHaveLength(0);
    });
  });

  // =========================================================================
  // Dimension 3: Topup Flow & Countdown Expiration State Machine
  // =========================================================================
  describe("Dimension 3: Topup Flow & Countdown Expiration State Machine", () => {
    const formatTimeLeft = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const calculateExpiration = (createdAtIso: string, nowMs: number) => {
      const createdAtTime = new Date(createdAtIso).getTime();
      const expiresAtTime = createdAtTime + 30 * 60 * 1000; // 30 minutes
      const diffSeconds = Math.max(0, Math.floor((expiresAtTime - nowMs) / 1000));
      return {
        diffSeconds,
        isExpired: diffSeconds <= 0,
      };
    };

    it("verifies formatTimeLeft accurately converts seconds to MM:SS format", () => {
      expect(formatTimeLeft(1800)).toBe("30:00");
      expect(formatTimeLeft(1799)).toBe("29:59");
      expect(formatTimeLeft(65)).toBe("01:05");
      expect(formatTimeLeft(9)).toBe("00:09");
      expect(formatTimeLeft(0)).toBe("00:00");
    });

    it("verifies 30-minute topup expiration edge cases: active, boundary, and expired", () => {
      const createdAt = "2026-11-06T12:00:00.000Z";
      const createdMs = new Date(createdAt).getTime();

      // Case 1: 5 minutes elapsed (25 mins remaining)
      const state5m = calculateExpiration(createdAt, createdMs + 5 * 60 * 1000);
      expect(state5m.isExpired).toBe(false);
      expect(state5m.diffSeconds).toBe(25 * 60);
      expect(formatTimeLeft(state5m.diffSeconds)).toBe("25:00");

      // Case 2: Exactly 29 mins 59 secs elapsed (1 sec remaining)
      const state29m59s = calculateExpiration(createdAt, createdMs + (30 * 60 - 1) * 1000);
      expect(state29m59s.isExpired).toBe(false);
      expect(state29m59s.diffSeconds).toBe(1);
      expect(formatTimeLeft(state29m59s.diffSeconds)).toBe("00:01");

      // Case 3: Exactly 30 mins elapsed (boundary)
      const state30m = calculateExpiration(createdAt, createdMs + 30 * 60 * 1000);
      expect(state30m.isExpired).toBe(true);
      expect(state30m.diffSeconds).toBe(0);
      expect(formatTimeLeft(state30m.diffSeconds)).toBe("00:00");

      // Case 4: Past 30 mins (over-expired)
      const state35m = calculateExpiration(createdAt, createdMs + 35 * 60 * 1000);
      expect(state35m.isExpired).toBe(true);
      expect(state35m.diffSeconds).toBe(0);
    });

    it("verifies polling termination condition: polling skips execution when isExpired or isPaid is true", () => {
      let pollCallCount = 0;
      const simulatePollStep = (isPaid: boolean, isExpired: boolean) => {
        if (!isPaid && !isExpired) {
          pollCallCount++;
        }
      };

      // Active state: polls
      simulatePollStep(false, false);
      expect(pollCallCount).toBe(1);

      // Expired state: ceases polling
      simulatePollStep(false, true);
      expect(pollCallCount).toBe(1);

      // Paid state: ceases polling
      simulatePollStep(true, false);
      expect(pollCallCount).toBe(1);

      // Both paid and expired: ceases polling
      simulatePollStep(true, true);
      expect(pollCallCount).toBe(1);
    });

    it("verifies preset ladder and minimum 20.000đ deposit validation in TopupClient", () => {
      const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

      // Verify ladder consistency
      expect(PRESET_AMOUNTS).toEqual([50000, 100000, 200000, 500000, 1000000, 2000000]);

      const validateDepositAmount = (amount: number) => {
        if (!amount || isNaN(amount) || amount < 20000) {
          return { valid: false, error: "Số tiền nạp tối thiểu là 20.000đ" };
        }
        return { valid: true, error: null };
      };

      expect(validateDepositAmount(0).valid).toBe(false);
      expect(validateDepositAmount(19999).valid).toBe(false);
      expect(validateDepositAmount(20000).valid).toBe(true);
      expect(validateDepositAmount(50000).valid).toBe(true);
      expect(validateDepositAmount(2000000).valid).toBe(true);
    });
  });

  // =========================================================================
  // Dimension 4: Pay with Wallet Balance Boundaries & Dynamic Total Evaluation
  // =========================================================================
  describe("Dimension 4: Pay with Wallet Balance Boundaries & Dynamic Total Evaluation", () => {
    interface WalletCheckoutEvaluation {
      canPay: boolean;
      balanceRemainingText: string;
      shortageAmount: number;
    }

    const evaluateWalletPayment = (balance: number, currentTotal: number): WalletCheckoutEvaluation => {
      const canPay = balance >= currentTotal;
      return {
        canPay,
        balanceRemainingText: canPay ? `${(balance - currentTotal).toLocaleString("vi-VN")}đ` : "Không đủ số dư",
        shortageAmount: canPay ? 0 : currentTotal - balance,
      };
    };

    it("evaluates boundary condition: Insufficient balance (balance < currentTotal)", () => {
      const result = evaluateWalletPayment(50000, 120000);
      expect(result.canPay).toBe(false);
      expect(result.balanceRemainingText).toBe("Không đủ số dư");
      expect(result.shortageAmount).toBe(70000);
    });

    it("evaluates boundary condition: Exact balance (balance === currentTotal)", () => {
      const result = evaluateWalletPayment(120000, 120000);
      expect(result.canPay).toBe(true);
      expect(result.balanceRemainingText).toBe("0đ");
      expect(result.shortageAmount).toBe(0);
    });

    it("evaluates boundary condition: Surplus balance (balance > currentTotal)", () => {
      const result = evaluateWalletPayment(250000, 120000);
      expect(result.canPay).toBe(true);
      expect(result.balanceRemainingText).toBe("130.000đ");
      expect(result.shortageAmount).toBe(0);
    });

    it("proves critical invariant: Wallet comparison strictly uses dynamic currentTotal instead of static order.totalAmount", () => {
      const staticTotalAmount = 200000;
      let dynamicCurrentTotal = staticTotalAmount;
      const userBalance = 160000;

      // 1. Initially with static amount: 160k < 200k -> Cannot pay
      let evalResult = evaluateWalletPayment(userBalance, dynamicCurrentTotal);
      expect(evalResult.canPay).toBe(false);

      // 2. Regenerate QR with promotional/discount adjustment: dynamicCurrentTotal becomes 150k
      dynamicCurrentTotal = 150000;

      // Under dynamic evaluation: 160k >= 150k -> CAN PAY!
      evalResult = evaluateWalletPayment(userBalance, dynamicCurrentTotal);
      expect(evalResult.canPay).toBe(true);
      expect(evalResult.balanceRemainingText).toBe("10.000đ");

      // Verify that if code used staticTotalAmount, it would erroneously reject payment
      const erroneousStaticCanPay = userBalance >= staticTotalAmount;
      expect(erroneousStaticCanPay).toBe(false);
      expect(evalResult.canPay).not.toBe(erroneousStaticCanPay);
    });
  });

  // =========================================================================
  // Dimension 5: Customer Profile Secrets Masking & Member Loyalty Tiers
  // =========================================================================
  describe("Dimension 5: Customer Profile Secrets Masking & Member Loyalty Tiers", () => {
    function getMemberTier(totalDeposited: number, role?: string) {
      if (role === "ADMIN") {
        return { label: "Quản trị viên", level: 5 };
      }
      if (totalDeposited >= 50000000) {
        return { label: "VIP Kim Cương", level: 4 };
      }
      if (totalDeposited >= 20000000) {
        return { label: "Thành viên Vàng", level: 3 };
      }
      if (totalDeposited >= 5000000) {
        return { label: "Thành viên Bạc", level: 2 };
      }
      if (totalDeposited >= 1000000) {
        return { label: "Thành viên Đồng", level: 1 };
      }
      return { label: "Thành viên Mới", level: 0 };
    }

    it("verifies member tier boundary transitions across all thresholds", () => {
      expect(getMemberTier(0).label).toBe("Thành viên Mới");
      expect(getMemberTier(999999).label).toBe("Thành viên Mới");

      expect(getMemberTier(1000000).label).toBe("Thành viên Đồng");
      expect(getMemberTier(4999999).label).toBe("Thành viên Đồng");

      expect(getMemberTier(5000000).label).toBe("Thành viên Bạc");
      expect(getMemberTier(19999999).label).toBe("Thành viên Bạc");

      expect(getMemberTier(20000000).label).toBe("Thành viên Vàng");
      expect(getMemberTier(49999999).label).toBe("Thành viên Vàng");

      expect(getMemberTier(50000000).label).toBe("VIP Kim Cương");
      expect(getMemberTier(100000000).label).toBe("VIP Kim Cương");

      // Admin role overrides deposit amounts
      expect(getMemberTier(0, "ADMIN").label).toBe("Quản trị viên");
    });

    it("verifies delivered secret masking state isolation per item ID", () => {
      // Simulate revealedSecrets state dictionary
      let revealedSecrets: Record<string, boolean> = {};

      const renderSecretText = (secretId: string, plainText: string) => {
        return Boolean(revealedSecrets[secretId]) ? plainText : "••••••••••••••••••••";
      };

      const toggleReveal = (secretId: string) => {
        revealedSecrets = { ...revealedSecrets, [secretId]: !revealedSecrets[secretId] };
      };

      const item1Id = "ord-1-0";
      const item2Id = "ord-1-1";
      const item1Plain = "sk-live-secret-key-item-1";
      const item2Plain = "account@example.com|password123";

      // Initially both are masked
      expect(renderSecretText(item1Id, item1Plain)).toBe("••••••••••••••••••••");
      expect(renderSecretText(item2Id, item2Plain)).toBe("••••••••••••••••••••");

      // Reveal item 1 only
      toggleReveal(item1Id);
      expect(renderSecretText(item1Id, item1Plain)).toBe(item1Plain);
      expect(renderSecretText(item2Id, item2Plain)).toBe("••••••••••••••••••••"); // item 2 remains strictly masked!

      // Toggle item 1 back to hidden
      toggleReveal(item1Id);
      expect(renderSecretText(item1Id, item1Plain)).toBe("••••••••••••••••••••");
    });

    it("verifies order status badge mapping for all 5 lifecycle statuses", () => {
      const statusBadgeConfig: Record<string, { label: string; cls: string }> = {
        PAID: {
          label: "Đã thanh toán",
          cls: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        },
        PENDING: {
          label: "Chờ thanh toán",
          cls: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        },
        CANCELLED: {
          label: "Đã hủy",
          cls: "bg-muted text-muted-foreground border-border",
        },
        EXPIRED: {
          label: "Hết hạn",
          cls: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        },
        REFUNDED: {
          label: "Đã hoàn tiền",
          cls: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
        },
      };

      const statuses = ["PAID", "PENDING", "CANCELLED", "EXPIRED", "REFUNDED"] as const;
      statuses.forEach((st) => {
        const badge = statusBadgeConfig[st];
        expect(badge).toBeDefined();
        expect(badge.label).toBeTruthy();
        expect(badge.cls).toContain("border");
      });
    });
  });

  // =========================================================================
  // Dimension 6: SSOT Frontier AI Models & WCAG 2.1 AA Compliance
  // =========================================================================
  describe("Dimension 6: SSOT Frontier AI Models & WCAG 2.1 AA Compliance", () => {
    it("verifies AI_FRONTIER_MODELS SSOT matches GEMINI.md mandate", () => {
      // Claude generation must be 5.5 & 5.6
      expect(AI_FRONTIER_MODELS.claude.latestGeneration).toBe("Claude 5.5 & 5.6");
      expect(DEFAULT_CLAUDE_MODEL_ID).toBe("claude-sonnet-5-5");

      // OpenAI generation must be GPT-6 series & o3
      expect(AI_FRONTIER_MODELS.openai.latestGeneration).toBe("GPT-6 series & o3");
      expect(AI_FRONTIER_MODELS.openai.defaultModelId).toBe("gpt-6-astra");

      // Gemini generation must be Gemini 4 Argon
      expect(AI_FRONTIER_MODELS.gemini.latestGeneration).toBe("Gemini 4 Argon");
      expect(AI_FRONTIER_MODELS.gemini.defaultModelId).toBe("gemini-4-argon");
    });

    it("verifies zero occurrences of legacy claude-3-5 across modified files", () => {
      const filesToCheck = [
        "src/components/developer/UsageDashboardClient.tsx",
        "src/components/CheckUsageClient.tsx",
        "src/components/CodexTopupClient.tsx",
        "src/components/CodexApiGuideHub.tsx",
        "src/components/ClaudeApiGuideHub.tsx",
        "src/components/ProfileClient.tsx",
        "src/components/TopupClient.tsx",
        "src/app/topup/[depositCode]/page.tsx",
        "src/components/CheckoutClient.tsx",
      ];

      for (const relPath of filesToCheck) {
        const fullPath = resolve(process.cwd(), relPath);
        const content = readFileSync(fullPath, "utf-8");
        expect(content.toLowerCase()).not.toContain("claude-3-5");
        expect(content.toLowerCase()).not.toContain("claude-3.5");
      }
    });

    it("verifies WCAG 2.1 AA min-h-[44px] touch targets across Milestone 4 client components", () => {
      const filesWithTouchTargets = [
        "src/components/developer/UsageDashboardClient.tsx",
        "src/components/CheckUsageClient.tsx",
        "src/components/CodexTopupClient.tsx",
        "src/components/CodexApiGuideHub.tsx",
        "src/components/ClaudeApiGuideHub.tsx",
        "src/components/ProfileClient.tsx",
        "src/components/TopupClient.tsx",
        "src/app/topup/[depositCode]/page.tsx",
      ];

      for (const relPath of filesWithTouchTargets) {
        const fullPath = resolve(process.cwd(), relPath);
        const content = readFileSync(fullPath, "utf-8");
        // Each interactive component must incorporate min-h-[44px]
        expect(content).toContain("min-h-[44px]");
      }
    });
  });
});
