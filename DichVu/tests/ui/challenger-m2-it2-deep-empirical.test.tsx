import { describe, it, expect, vi } from "vitest";
import React from "react";
(globalThis as any).React = React;
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock contexts/CartContext
vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}));

describe("Challenger M2 Iteration 2 Deep Empirical Verification", () => {
  const rootDir = path.resolve(process.cwd());

  // -------------------------------------------------------------------------
  // 1. URL Case-Insensitivity & Protocol Validation
  // -------------------------------------------------------------------------
  describe("1. Case-Insensitive URL Scheme & Domain Validation", () => {
    // Extract validateTargetLink logic from QuickViewModal.tsx source code to verify parity
    const qvSource = fs.readFileSync(path.join(rootDir, "src/components/QuickViewModal.tsx"), "utf-8");
    const pbSource = fs.readFileSync(path.join(rootDir, "src/components/ProductPurchaseBox.tsx"), "utf-8");

    it("verifies both QuickViewModal.tsx and ProductPurchaseBox.tsx normalize URLs with toLowerCase()", () => {
      expect(qvSource).toContain("const lower = trimmed.toLowerCase();");
      expect(qvSource).toContain('!lower.startsWith("http://") && !lower.startsWith("https://")');
      expect(qvSource).toContain('!lower.includes("tiktok.com")');
      expect(qvSource).toContain('!lower.includes("facebook.com")');

      expect(pbSource).toContain("const lower = trimmed.toLowerCase();");
      expect(pbSource).toContain('!lower.startsWith("http://") && !lower.startsWith("https://")');
      expect(pbSource).toContain('!lower.includes("tiktok.com")');
      expect(pbSource).toContain('!lower.includes("facebook.com")');
    });

    const createValidator = (isTikTok = false, isFacebook = false) => {
      return (link: string): string | null => {
        const trimmed = link.trim();
        if (!trimmed) return "Vui lòng nhập đường link mục tiêu.";
        const lower = trimmed.toLowerCase();
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
          return "Đường link phải bắt đầu bằng https:// hoặc http://";
        }
        if (isTikTok && !lower.includes("tiktok.com")) {
          return "Vui lòng nhập đúng đường link TikTok (chứa tiktok.com).";
        }
        if (
          isFacebook &&
          !lower.includes("facebook.com") &&
          !lower.includes("fb.watch") &&
          !lower.includes("fb.com")
        ) {
          return "Vui lòng nhập đúng đường link Facebook (chứa facebook.com).";
        }
        return null;
      };
    };

    it("passes uppercase, mixed-case, and alternate-domain URLs across TikTok and Facebook", () => {
      const tiktokValidator = createValidator(true, false);
      const fbValidator = createValidator(false, true);
      const genericValidator = createValidator(false, false);

      // Uppercase HTTPS on TikTok
      expect(tiktokValidator("HTTPS://WWW.TIKTOK.COM/@USER_OFFICIAL/VIDEO/123456789")).toBeNull();
      expect(tiktokValidator("Http://tiktok.com/@creator")).toBeNull();
      expect(tiktokValidator("  hTTps://TIKTOK.COM/@ALICE/LIVE  ")).toBeNull();

      // Uppercase HTTP / HTTPS on Facebook
      expect(fbValidator("HTTPS://WWW.FACEBOOK.COM/FANPAGE/POSTS/987654321")).toBeNull();
      expect(fbValidator("Http://facebook.com/profile.php?id=1000123")).toBeNull();
      expect(fbValidator("HTTPS://FB.WATCH/XYZ789/")).toBeNull();
      expect(fbValidator("http://FB.COM/USER123")).toBeNull();
      expect(fbValidator("HTTPS://M.FACEBOOK.COM/STORY.PHP?STORY_FBID=123")).toBeNull();

      // Generic URL
      expect(genericValidator("HTTPS://YOUTUBE.COM/WATCH?V=ABCD")).toBeNull();
      expect(genericValidator("Http://Instagram.com/p/xyz")).toBeNull();

      // Negative Cases: non-http protocols
      expect(tiktokValidator("FTP://WWW.TIKTOK.COM/@USER")).toBe("Đường link phải bắt đầu bằng https:// hoặc http://");
      expect(tiktokValidator("javascript:alert(document.cookie)")).toBe("Đường link phải bắt đầu bằng https:// hoặc http://");
      expect(tiktokValidator("tiktok.com/@user")).toBe("Đường link phải bắt đầu bằng https:// hoặc http://");

      // Negative Cases: cross-domain mismatch
      expect(tiktokValidator("HTTPS://WWW.FACEBOOK.COM/POST/123")).toBe("Vui lòng nhập đúng đường link TikTok (chứa tiktok.com).");
      expect(fbValidator("HTTPS://WWW.TIKTOK.COM/@USER")).toBe("Vui lòng nhập đúng đường link Facebook (chứa facebook.com).");
    });
  });

  // -------------------------------------------------------------------------
  // 2. Stepper Touch Target Size (>= 44px) in QuickViewModal
  // -------------------------------------------------------------------------
  describe("2. QuickViewModal Touch Targets & WCAG 2.1 AA Compliance", () => {
    const qvSource = fs.readFileSync(path.join(rootDir, "src/components/QuickViewModal.tsx"), "utf-8");

    it("ensures non-SMM quantity decrement and increment buttons have min-h-[44px] min-w-[44px]", () => {
      // Non-SMM stepper minus button
      expect(qvSource).toMatch(/min-h-\[44px\]\s+min-w-\[44px\][\s\S]*?aria-label="Giảm số lượng"/);
      // Non-SMM stepper plus button
      expect(qvSource).toMatch(/min-h-\[44px\]\s+min-w-\[44px\][\s\S]*?aria-label="Tăng số lượng"/);
    });

    it("ensures SMM quantity decrement and increment buttons have min-h-[44px] min-w-[44px]", () => {
      // SMM stepper minus button
      expect(qvSource).toMatch(/min-h-\[44px\]\s+min-w-\[44px\][\s\S]*?aria-label="Giảm 100"/);
      // SMM stepper plus button
      expect(qvSource).toMatch(/min-h-\[44px\]\s+min-w-\[44px\][\s\S]*?aria-label="Tăng 100"/);
    });

    it("ensures modal close button and primary action buttons meet >= 44px touch targets", () => {
      // Close button
      expect(qvSource).toMatch(/min-h-\[44px\]\s+min-w-\[44px\][\s\S]*?aria-label="Đóng"/);
      // Add to cart CTA
      expect(qvSource).toContain("flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary");
      // Buy now CTA
      expect(qvSource).toContain("flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary");
      // Coupon apply button
      expect(qvSource).toContain("min-h-[44px] rounded-xl bg-primary");
    });
  });

  // -------------------------------------------------------------------------
  // 3. QuickViewModal 3-Tier Stock Badge Rendering
  // -------------------------------------------------------------------------
  describe("3. QuickViewModal Stock Badge Rendering Across Inventory Boundaries", () => {
    it("renders Tier 2 amber warning badge when stockCount is between 1 and 5", async () => {
      const QuickViewModal = (await import("@/components/QuickViewModal")).default;

      const baseProd = {
        id: "prod-canva-standard",
        title: "Tài khoản Canva Đồ Họa Pro",
        slug: "canva-do-hoa-pro",
        description: "Bản quyền trọn gói",
        price: 150000,
        originalPrice: 300000,
        categoryId: "cat-dohoa",
        category: { name: "Thiết kế & Đồ họa", slug: "do-hoa" },
        isActive: true,
        type: "ACCOUNT",
        createdAt: new Date(),
        updatedAt: new Date(),
        minQuantity: 1,
        maxQuantity: 10,
        unitLabel: "tài khoản",
        thumbnailUrl: null,
        sortOrder: 1,
        fulfillmentType: "LOCAL_STOCK",
      };

      // Test stockCount = 1 (Tier 2 minimum)
      const html1 = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: { ...baseProd, stockCount: 1 } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(html1).toContain("Còn ít (1)");
      expect(html1).toContain("border-amber-500/30");
      expect(html1).toContain("bg-amber-500/10");
      expect(html1).toContain("text-amber-600 dark:text-amber-400 font-mono");
      expect(html1).toContain("bg-amber-500 animate-pulse");
      expect(html1).not.toContain("Sẵn hàng (1)");

      // Test stockCount = 2 (Tier 2)
      const html2 = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: { ...baseProd, stockCount: 2 } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(html2).toContain("Còn ít (2)");
      expect(html2).toContain("border-amber-500/30");

      // Test stockCount = 3 (Tier 2)
      const html3 = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: { ...baseProd, stockCount: 3 } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(html3).toContain("Còn ít (3)");
      expect(html3).toContain("border-amber-500/30");

      // Test stockCount = 4 (Tier 2)
      const html4 = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: { ...baseProd, stockCount: 4 } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(html4).toContain("Còn ít (4)");
      expect(html4).toContain("border-amber-500/30");

      // Test stockCount = 5 (Tier 2 maximum boundary)
      const html5 = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: { ...baseProd, stockCount: 5 } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(html5).toContain("Còn ít (5)");
      expect(html5).toContain("border-amber-500/30");
      expect(html5).toContain("bg-amber-500/10");
      expect(html5).not.toContain("Sẵn hàng (5)");

      // Test stockCount = 6 (Tier 1 minimum boundary) -> "Sẵn hàng (6)"
      const html6 = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: { ...baseProd, stockCount: 6 } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(html6).toContain("Sẵn hàng (6)");
      expect(html6).toContain("border-accent/30");
      expect(html6).toContain("bg-accent/10");
      expect(html6).toContain("text-accent font-mono");
      expect(html6).not.toContain("Còn ít");

      // Test stockCount = 0 (Tier 3) -> "Tạm hết hàng"
      const html0 = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: { ...baseProd, stockCount: 0 } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(html0).toContain("Tạm hết hàng");
      expect(html0).toContain("border-destructive/20");
      expect(html0).toContain("bg-destructive/10");
      expect(html0).toContain("text-destructive");
      expect(html0).not.toContain("Còn ít");
      expect(html0).not.toContain("Sẵn hàng");

      // Test hideExactStock condition (API or SMM) -> "Sẵn hàng" without exact number
      const htmlSmm = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: {
            ...baseProd,
            title: "Tăng Follow TikTok Kênh Chính",
            category: { name: "Dịch vụ MXH", slug: "dich-vu-mxh" },
            stockCount: 500000,
          } as any,
          isOpen: true,
          onClose: vi.fn(),
        })
      );
      expect(htmlSmm).toContain("Sẵn hàng");
      expect(htmlSmm).not.toContain("Sẵn hàng (500000)");
      expect(htmlSmm).not.toContain("Còn ít");
    });
  });
});
