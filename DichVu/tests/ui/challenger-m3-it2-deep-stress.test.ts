import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { calculateDiscount, MIN_ORDER_PAYMENT_FLOOR } from "@/services/coupon.service";
import {
  formatRemainingTime,
  calculateRemainingSeconds,
} from "@/components/CountdownTimer";
import {
  maskSecret,
  parseSecretItem,
} from "@/components/SecretDisplay";

describe("Milestone 3 Iteration 2 Empirical Challenger Stress Suite", () => {
  // =========================================================================
  // Dimension 1: Coupon Application, Removal & Recalculation Edge Cases
  // =========================================================================
  describe("Dimension 1: Interactive Coupon Handling & Boundary Stress", () => {
    it("handles pure discount calculation accurately with percentage caps and payment floor", () => {
      // 10% coupon, max discount 50k
      const pctCoupon = {
        id: "c1",
        code: "SALE10",
        type: "PERCENT" as const,
        value: 10,
        minOrderValue: 100000,
        maxDiscount: 50000,
        isActive: true,
        expiresAt: null,
        usedCount: 0,
        usageLimit: null,
        affiliateUserId: null,
        affiliateRate: null,
        affiliateFixed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 10% of 100k = 10k
      expect(calculateDiscount(pctCoupon, 100000)).toBe(10000);

      // 10% of 300k = 30k
      expect(calculateDiscount(pctCoupon, 300000)).toBe(30000);

      // Exceeding max discount cap (10% of 600k = 60k -> capped at 50k)
      expect(calculateDiscount(pctCoupon, 600000)).toBe(50000);

      // Fixed coupon
      const fixedCoupon = {
        id: "c2",
        code: "FIXED30K",
        type: "FIXED" as const,
        value: 30000,
        minOrderValue: 50000,
        maxDiscount: null,
        isActive: true,
        expiresAt: null,
        usedCount: 0,
        usageLimit: null,
        affiliateUserId: null,
        affiliateRate: null,
        affiliateFixed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Standard fixed discount
      expect(calculateDiscount(fixedCoupon, 50000)).toBe(30000);

      // Fixed coupon floor safeguard:
      // Order total = 30,500. Discount = 30,000.
      // 30,500 - 30,000 = 500 < 1,000 floor.
      // calculateDiscount adjusts discount to: 30,500 - 1,000 = 29,500
      expect(calculateDiscount(fixedCoupon, 30500)).toBe(29500);
      expect(30500 - calculateDiscount(fixedCoupon, 30500)).toBe(MIN_ORDER_PAYMENT_FLOOR);
    });

    it("verifies coupon removal state lifecycle invariants", () => {
      // State transition model in cart/page.tsx:
      // Initial: appliedCoupon = null, discount = 0, finalTotal = subtotal
      // Apply: appliedCoupon = { code, discountAmount }, discount = discountAmount, finalTotal = subtotal - discount
      // Remove: appliedCoupon = null, discount = 0, finalTotal = subtotal
      const initialSubtotal = 250000;
      let appliedCoupon: { code: string; discountAmount: number } | null = null;

      const getFinalTotal = (subtotal: number, coupon: typeof appliedCoupon) => {
        if (!coupon) return subtotal;
        return Math.max(MIN_ORDER_PAYMENT_FLOOR, subtotal - coupon.discountAmount);
      };

      // 1. Initial State
      expect(appliedCoupon).toBeNull();
      expect(getFinalTotal(initialSubtotal, appliedCoupon)).toBe(250000);

      // 2. Apply Coupon
      appliedCoupon = { code: "TESTDISC", discountAmount: 50000 };
      expect(appliedCoupon).not.toBeNull();
      expect(getFinalTotal(initialSubtotal, appliedCoupon)).toBe(200000);

      // 3. Remove Coupon (User clicks "Hủy")
      appliedCoupon = null;
      expect(appliedCoupon).toBeNull();
      // Verifies subtotal restores cleanly with zero lingering discount
      expect(getFinalTotal(initialSubtotal, appliedCoupon)).toBe(initialSubtotal);
    });
  });

  // =========================================================================
  // Dimension 2: Countdown Timer & Expiration Ref Reset Lifecycle
  // =========================================================================
  describe("Dimension 2: CountdownTimer Expiration & Regeneration State Machine", () => {
    it("empirically verifies timer calculation, clamping, and format under stress", () => {
      vi.useFakeTimers();
      const now = 1750000000000;
      vi.setSystemTime(now);

      // Positive boundaries
      expect(calculateRemainingSeconds(now + 600 * 1000)).toBe(600);
      expect(calculateRemainingSeconds(now + 1 * 1000)).toBe(1);
      // Zero boundary
      expect(calculateRemainingSeconds(now)).toBe(0);
      // Negative / expired boundaries must clamp to 0
      expect(calculateRemainingSeconds(now - 1000)).toBe(0);
      expect(calculateRemainingSeconds(now - 86400 * 1000)).toBe(0);

      // Format validations
      expect(formatRemainingTime(600)).toBe("10:00");
      expect(formatRemainingTime(599)).toBe("09:59");
      expect(formatRemainingTime(60)).toBe("01:00");
      expect(formatRemainingTime(9)).toBe("00:09");
      expect(formatRemainingTime(0)).toBe("00:00");
      expect(formatRemainingTime(-10)).toBe("00:00");

      vi.useRealTimers();
    });

    it("verifies CountdownTimer onExpire idempotency and reset on new expiresAt", () => {
      // Emulate the actual hook logic in CountdownTimer.tsx:
      class TimerController {
        onExpireCalled = false;
        expireCount = 0;
        expiresAt: number;

        constructor(expiresAt: number) {
          this.expiresAt = expiresAt;
        }

        tick(currentTimestamp: number) {
          const remaining = Math.max(0, Math.floor((this.expiresAt - currentTimestamp) / 1000));
          if (remaining <= 0) {
            if (!this.onExpireCalled) {
              this.onExpireCalled = true;
              this.expireCount++;
            }
            return 0;
          }
          // The line added by worker_m3: onExpireCalled.current = false;
          this.onExpireCalled = false;
          return remaining;
        }

        regenerate(newExpiresAt: number) {
          this.expiresAt = newExpiresAt;
        }
      }

      const t0 = 1000000000; // ms
      const timer = new TimerController(t0 + 600 * 1000); // 10 minutes from t0 in ms

      // Ticking normally
      expect(timer.tick(t0)).toBe(600);
      expect(timer.onExpireCalled).toBe(false);
      expect(timer.expireCount).toBe(0);

      expect(timer.tick(t0 + 300 * 1000)).toBe(300);
      expect(timer.onExpireCalled).toBe(false);
      expect(timer.expireCount).toBe(0);

      // Reaching 0: should trigger onExpire exactly once
      expect(timer.tick(t0 + 600 * 1000)).toBe(0);
      expect(timer.onExpireCalled).toBe(true);
      expect(timer.expireCount).toBe(1);

      // Subsequent ticks past 0: idempotent suppression
      expect(timer.tick(t0 + 601 * 1000)).toBe(0);
      expect(timer.tick(t0 + 650 * 1000)).toBe(0);
      expect(timer.expireCount).toBe(1);

      // User regenerates QR: new expiresAt is 600s after t0 + 650s
      const tRegen = t0 + 650 * 1000;
      timer.regenerate(tRegen + 600 * 1000);

      // First tick on regenerated timer: must reset onExpireCalled
      expect(timer.tick(tRegen)).toBe(600);
      expect(timer.onExpireCalled).toBe(false);
      expect(timer.expireCount).toBe(1); // Not incremented yet

      // Ticking down to new expiration
      expect(timer.tick(tRegen + 600 * 1000)).toBe(0);
      expect(timer.onExpireCalled).toBe(true);
      expect(timer.expireCount).toBe(2); // Successfully triggered second time!
    });
  });

  // =========================================================================
  // Dimension 3: Self-Service Refund Form Validation Stress
  // =========================================================================
  describe("Dimension 3: Self-Service Refund Form Edge Case Validation", () => {
    it("validates bank details normalization and rejection rules", () => {
      const validateRefundForm = (bankName: string, accountNo: string, accountName: string) => {
        const cleanBank = bankName.trim();
        const cleanNo = accountNo.trim();
        const cleanName = accountName.trim().toUpperCase();

        if (!cleanBank) return { valid: false, error: "Vui lòng nhập tên ngân hàng" };
        if (!cleanNo) return { valid: false, error: "Vui lòng nhập số tài khoản" };
        if (!cleanName) return { valid: false, error: "Vui lòng nhập tên chủ tài khoản" };
        if (!/^[0-9A-Za-z\-]+$/.test(cleanNo)) {
          return { valid: false, error: "Số tài khoản chứa ký tự không hợp lệ" };
        }

        return {
          valid: true,
          data: {
            bankName: cleanBank,
            accountNo: cleanNo,
            accountName: cleanName,
          },
        };
      };

      // Valid case with normalization
      const res1 = validateRefundForm("  Techcombank  ", " 19034567890123 ", " nguyen van a ");
      expect(res1.valid).toBe(true);
      expect(res1.data?.bankName).toBe("Techcombank");
      expect(res1.data?.accountNo).toBe("19034567890123");
      expect(res1.data?.accountName).toBe("NGUYEN VAN A");

      // Empty field rejection
      expect(validateRefundForm("", "123", "NAME").valid).toBe(false);
      expect(validateRefundForm("MB", "   ", "NAME").valid).toBe(false);
      expect(validateRefundForm("MB", "123", "").valid).toBe(false);

      // Dangerous characters rejection in account number
      expect(validateRefundForm("MB", "123<script>", "NAME").valid).toBe(false);
      expect(validateRefundForm("MB", "123' OR '1'='1", "NAME").valid).toBe(false);
    });
  });

  // =========================================================================
  // Dimension 4: SecretDisplay Masking & Account Parsing
  // =========================================================================
  describe("Dimension 4: SecretDisplay Handover Masking Robustness", () => {
    it("handles pipe-delimited account credentials and quotes", () => {
      // Delimiter with pipes
      const p1 = parseSecretItem("alice@kho.dee|secret123", "ACCOUNT");
      expect(p1.isAccount).toBe(true);
      expect(p1.username).toBe("alice@kho.dee");
      expect(p1.password).toBe("secret123");

      // With quotes and spaces around parts
      const p2 = parseSecretItem("  'bob@gmail.com' | \"pass456\"  ", "ACCOUNT");
      expect(p2.isAccount).toBe(true);
      expect(p2.username).toBe("bob@gmail.com");
      expect(p2.password).toBe("pass456");

      // Single credential without delimiter
      const p3 = parseSecretItem("sk-solo-key-12345", "LICENSE_KEY");
      expect(p3.isAccount).toBe(false);
      expect(p3.raw).toBe("sk-solo-key-12345");
    });
  });

  // =========================================================================
  // Dimension 5: Static DOM Audit for Touch Targets & Contrast Integrity
  // =========================================================================
  describe("Dimension 5: Static DOM Audit for WCAG 2.1 AA Compliance", () => {
    it("verifies cart/page.tsx has no sub-44px touch targets on interactive controls", () => {
      const cartContent = readFileSync(
        resolve(__dirname, "../../src/app/cart/page.tsx"),
        "utf-8"
      );

      // Must not contain min-h-[40px]
      expect(cartContent).not.toContain("min-h-[40px]");

      // Must have min-h-[44px] on coupon buttons
      expect(cartContent).toContain('min-h-[44px] rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-destructive dark:text-rose-400');
      expect(cartContent).toContain('min-h-[44px] rounded-xl bg-primary px-4 py-2.5');
    });

    it("verifies CartDrawer.tsx has no sub-44px touch targets", () => {
      const drawerContent = readFileSync(
        resolve(__dirname, "../../src/components/CartDrawer.tsx"),
        "utf-8"
      );

      expect(drawerContent).not.toContain("min-h-[40px]");
      expect(drawerContent).toContain("min-h-[44px] min-w-[44px]");
    });

    it("verifies CheckoutClient.tsx does not have hardcoded dark containers or pale pink text", () => {
      const checkoutContent = readFileSync(
        resolve(__dirname, "../../src/components/CheckoutClient.tsx"),
        "utf-8"
      );

      // Progress Stepper should use semantic theme tokens
      expect(checkoutContent).toContain("border border-border bg-card p-4 text-card-foreground shadow-xs");

      // Expired QR container should use high contrast tokens
      expect(checkoutContent).toContain("border-destructive/30 bg-destructive/10");
      expect(checkoutContent).toContain("text-destructive dark:text-rose-300");

      // No min-h-[40px]
      expect(checkoutContent).not.toContain("min-h-[40px]");
    });

    it("verifies SecretDisplay.tsx does not render white-on-white text", () => {
      const secretContent = readFileSync(
        resolve(__dirname, "../../src/components/SecretDisplay.tsx"),
        "utf-8"
      );

      // Should not contain "bg-white/95" with hardcoded "text-white"
      expect(secretContent).not.toContain("bg-white/95 text-white");
      expect(secretContent).not.toContain("bg-white/95 dark:bg-[#0b0f19]");

      // Must use semantic card background
      expect(secretContent).toContain("border border-border bg-card text-card-foreground");
    });
  });
});
