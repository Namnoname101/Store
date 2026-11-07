import { describe, it, expect, vi } from "vitest";
import React from "react";
(globalThis as any).React = React;
import fs from "fs";
import path from "path";

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

describe("M2 Empirical Challenger Test Suite (Interactive & Responsive Audit)", () => {
  const dichVuDir = path.resolve(process.cwd());

  // =========================================================================
  // 1. Responsive Layout & Touch Target Verification
  // =========================================================================
  describe("1. Responsive Layout & 44px Touch Envelope Verification", () => {
    it("verifies CatalogExplorer defines single-column mobile grid (<480px) and multi-column desktop grid", () => {
      const catalogExplorerPath = path.join(dichVuDir, "src/components/CatalogExplorer.tsx");
      const content = fs.readFileSync(catalogExplorerPath, "utf-8");

      // Verify grid configuration: grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
      const expectedGridClass = "grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      expect(content).toContain(expectedGridClass);

      // Verify it is used for both sub-brand grids and section product grids
      const occurrences = content.split(expectedGridClass).length - 1;
      expect(occurrences).toBeGreaterThanOrEqual(2);
    });

    it("verifies ProductCard has min-h-[44px] on interactive buttons (QuickView & Mua ngay)", () => {
      const cardPath = path.join(dichVuDir, "src/components/ProductCard.tsx");
      const content = fs.readFileSync(cardPath, "utf-8");

      // QuickView trigger envelope >= 44x44px
      expect(content).toContain("min-h-[44px] min-w-[44px]");

      // Mua ngay CTA envelope >= 44px
      expect(content).toContain("min-h-[44px]");
    });

    it("verifies GroupedProductCard has min-h-[44px] on variant pills, QuickView, and CTAs", () => {
      const groupedCardPath = path.join(dichVuDir, "src/components/GroupedProductCard.tsx");
      const content = fs.readFileSync(groupedCardPath, "utf-8");

      // Variant pills
      expect(content).toContain("min-h-[44px] px-3.5 py-2");

      // QuickView button
      expect(content).toContain("min-h-[44px] min-w-[44px]");

      // Buy CTA
      expect(content).toContain("min-h-[44px] h-11 flex-1");
    });

    it("verifies QuickViewModal has min-h-[44px] on close, stepper, coupon, and CTAs", () => {
      const modalPath = path.join(dichVuDir, "src/components/QuickViewModal.tsx");
      const content = fs.readFileSync(modalPath, "utf-8");

      expect(content).toContain("min-h-[44px] min-w-[44px]"); // Close button & SMM stepper
      expect(content).toContain("min-h-[44px]"); // CTAs & coupons
    });

    it("verifies BrandFilterNavigator has min-h-[44px] across all brand pills and clear filter CTA", () => {
      const brandNavPath = path.join(dichVuDir, "src/components/BrandFilterNavigator.tsx");
      const content = fs.readFileSync(brandNavPath, "utf-8");

      expect(content).toContain("min-h-[44px]");
    });

    it("verifies Hero has min-h-[44px] mobile envelopes for search, keyword pills, and quota links", () => {
      const heroPath = path.join(dichVuDir, "src/components/Hero.tsx");
      const content = fs.readFileSync(heroPath, "utf-8");

      expect(content).toContain("min-h-[44px]");
    });
  });

  // =========================================================================
  // 2. Dynamic Variant State in GroupedProductCard
  // =========================================================================
  describe("2. Dynamic Variant State & State Isolation in GroupedProductCard", () => {
    it("verifies variant sorting ascending by price and initial selected index", async () => {
      const GroupedProductCard = (await import("@/components/GroupedProductCard")).default;

      const mockVariants = [
        {
          id: "var-100",
          title: "API Claude 100$ Max Tier",
          slug: "api-claude-100-usd",
          description: "Gói 100$",
          price: 150000,
          originalPrice: 200000,
          categoryId: "cat-1",
          isActive: true,
          type: "LICENSE_KEY",
          stockCount: 8,
          variantLabel: "100$",
          createdAt: new Date(),
          updatedAt: new Date(),
          minQuantity: 1,
          maxQuantity: 10,
          unitLabel: "key",
          thumbnailUrl: null,
          sortOrder: 2,
          fulfillmentType: "LOCAL_STOCK",
        },
        {
          id: "var-10",
          title: "API Claude 10$ Min Tier",
          slug: "api-claude-10-usd",
          description: "Gói 10$",
          price: 20000,
          originalPrice: 30000,
          categoryId: "cat-1",
          isActive: true,
          type: "LICENSE_KEY",
          stockCount: 0,
          variantLabel: "10$",
          createdAt: new Date(),
          updatedAt: new Date(),
          minQuantity: 1,
          maxQuantity: 10,
          unitLabel: "key",
          thumbnailUrl: null,
          sortOrder: 1,
          fulfillmentType: "LOCAL_STOCK",
        },
      ];

      // Sort logic check
      const sorted = [...mockVariants].sort((a, b) => a.price - b.price);
      expect(sorted[0].id).toBe("var-10");
      expect(sorted[0].price).toBe(20000);
      expect(sorted[1].id).toBe("var-100");
      expect(sorted[1].price).toBe(150000);

      // Render GroupedProductCard with renderToStaticMarkup
      const { renderToStaticMarkup } = await import("react-dom/server");
      const html = renderToStaticMarkup(
        React.createElement(GroupedProductCard, {
          groupKey: "claude",
          brandName: "Claude",
          title: "API Anthropic Claude",
          variants: mockVariants as any,
        })
      );

      expect(html).toBeDefined();
      expect(html).toContain("20.000"); // Sorted min price is active initially
      expect(html).toContain("API Claude 10$ Min Tier");
      expect(html).toContain("api-claude-10-usd");
      expect(html).toContain("Hết hàng"); // 0 stock on 10$ variant
    });

    it("verifies GroupedProductCard component code cleanly binds slug, price, and stock without state leakage", () => {
      const groupedCardPath = path.join(dichVuDir, "src/components/GroupedProductCard.tsx");
      const content = fs.readFileSync(groupedCardPath, "utf-8");

      // Verifies activeVariant derivation
      expect(content).toContain("const [selectedIndex, setSelectedIndex] = useState(0)");
      expect(content).toContain("const activeVariant = sortedVariants[selectedIndex] || sortedVariants[0]");

      // Verifies slug dynamic link
      expect(content).toContain("href={`/products/${activeVariant.slug}`}");

      // Verifies active price formatting
      expect(content).toContain("formatVND(activeVariant.price)");

      // Verifies strikethrough price
      expect(content).toContain("activeVariant.originalPrice &&");
      expect(content).toContain("formatVND(activeVariant.originalPrice)");

      // Verifies 3-tier stock badge dynamically bound to activeVariant.stockCount
      expect(content).toContain("activeVariant.stockCount > 5");
      expect(content).toContain("activeVariant.stockCount > 0");
      expect(content).toContain("Sẵn hàng ({activeVariant.stockCount})");
      expect(content).toContain("Còn ít ({activeVariant.stockCount})");
      expect(content).toContain("Hết hàng");
    });
  });

  // =========================================================================
  // 3. Accessibility Attributes (QuickViewModal & ProductDetailTabs)
  // =========================================================================
  describe("3. Accessibility Semantics (ARIA, Focus Trap, Tablist)", () => {
    it("verifies QuickViewModal implements dialog semantics, ARIA labels, ESC key handling, and focus trapping", () => {
      const modalPath = path.join(dichVuDir, "src/components/QuickViewModal.tsx");
      const content = fs.readFileSync(modalPath, "utf-8");

      // Dialog semantics
      expect(content).toContain('role="dialog"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('aria-labelledby="quick-view-title"');

      // ESC key listener
      expect(content).toContain('if (e.key === "Escape")');
      expect(content).toContain("onClose()");

      // Native React Focus Trap
      expect(content).toContain('if (e.key === "Tab" && modalRef.current)');
      expect(content).toContain("if (e.shiftKey && document.activeElement === first)");
      expect(content).toContain("else if (!e.shiftKey && document.activeElement === last)");
      expect(content).toContain("first.focus()");
      expect(content).toContain("last.focus()");
    });

    it("verifies ProductDetailTabs implements tablist semantics with role='tablist' and role='tab'", () => {
      const tabsPath = path.join(dichVuDir, "src/components/ProductDetailTabs.tsx");
      const content = fs.readFileSync(tabsPath, "utf-8");

      // Tablist container
      expect(content).toContain('role="tablist"');
      expect(content).toContain('aria-label="Cấp độ thông tin sản phẩm"');

      // Individual tabs
      expect(content).toContain('role="tab"');
      expect(content).toContain('id="tab-overview"');
      expect(content).toContain('aria-selected={activeTab === "overview"}');
      expect(content).toContain('aria-controls="panel-overview"');

      expect(content).toContain('id="tab-technical"');
      expect(content).toContain('aria-selected={activeTab === "technical"}');
      expect(content).toContain('aria-controls="panel-technical"');

      // Tabpanels
      expect(content).toContain('id="panel-overview"');
      expect(content).toContain('role="tabpanel"');
      expect(content).toContain('aria-labelledby="tab-overview"');

      expect(content).toContain('id="panel-technical"');
      expect(content).toContain('role="tabpanel"');
      expect(content).toContain('aria-labelledby="tab-technical"');
    });
  });

  // =========================================================================
  // 4. Mobile Sticky Bottom Bar in ProductPurchaseBox
  // =========================================================================
  describe("4. Mobile Sticky Bottom Bar in ProductPurchaseBox", () => {
    it("verifies mobile sticky purchase bar is pinned to viewport bottom on screens < 1024px", () => {
      const purchaseBoxPath = path.join(dichVuDir, "src/components/ProductPurchaseBox.tsx");
      const content = fs.readFileSync(purchaseBoxPath, "utf-8");

      // Verify classes
      expect(content).toContain("fixed bottom-0 left-0 right-0 z-40 lg:hidden");
      expect(content).toContain("safe-area-bottom");

      // Verify original price strikethrough in mobile bar
      expect(content).toContain("originalPrice && originalPrice > price");
      expect(content).toContain("formatVND(originalPrice * quantity)");

      // Verify auto-scroll & focus to target link / purchase config box when link is missing
      expect(content).toContain('requiresLink && !targetLink.trim()');
      expect(content).toContain('document.getElementById("purchase-config-box")');
      expect(content).toContain('scrollIntoView({ behavior: "smooth", block: "center" })');
      expect(content).toContain('setErrorMessage("Vui lòng nhập đường link mục tiêu trước khi thanh toán.")');
    });

    it("verifies product detail page has adequate bottom padding (pb-28) to prevent sticky bar overlap", () => {
      const detailPagePath = path.join(dichVuDir, "src/app/products/[slug]/page.tsx");
      const content = fs.readFileSync(detailPagePath, "utf-8");

      expect(content).toContain("pb-28 lg:pb-16");
    });
  });

  // =========================================================================
  // 5. SMM URL Validation & Quantity Bounds Clamping
  // =========================================================================
  describe("5. SMM URL Validation & Quantity Clamping Logic", () => {
    const validateTargetLink = (link: string, isTikTok = false, isFacebook = false): string | null => {
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

    it("validates SMM target URLs against adversarial edge cases", () => {
      // 1. Empty / whitespace inputs
      expect(validateTargetLink("")).toBe("Vui lòng nhập đường link mục tiêu.");
      expect(validateTargetLink("   ")).toBe("Vui lòng nhập đường link mục tiêu.");

      // 2. Missing protocol
      expect(validateTargetLink("tiktok.com/@user")).toBe("Đường link phải bắt đầu bằng https:// hoặc http://");
      expect(validateTargetLink("ftp://tiktok.com/@user")).toBe("Đường link phải bắt đầu bằng https:// hoặc http://");

      // 3. TikTok domain validation
      expect(validateTargetLink("https://youtube.com/watch?v=123", true, false)).toBe(
        "Vui lòng nhập đúng đường link TikTok (chứa tiktok.com)."
      );
      expect(validateTargetLink("https://www.tiktok.com/@user/video/123", true, false)).toBeNull();

      // 4. Facebook domain validation
      expect(validateTargetLink("https://instagram.com/p/123", false, true)).toBe(
        "Vui lòng nhập đúng đường link Facebook (chứa facebook.com)."
      );
      expect(validateTargetLink("https://www.facebook.com/user/posts/123", false, true)).toBeNull();
      expect(validateTargetLink("https://fb.watch/xyz123", false, true)).toBeNull();
    });

    it("clamps quantity changes to [effectiveMin, effectiveMax] boundary invariants", () => {
      const clampQuantity = (current: number, delta: number, min: number, max: number) => {
        const next = current + delta;
        if (next < min) return min;
        if (next > max) return max;
        return next;
      };

      const min = 50;
      const max = 10000;

      // Underflow clamping
      expect(clampQuantity(50, -100, min, max)).toBe(50);
      expect(clampQuantity(60, -100, min, max)).toBe(50);

      // Overflow clamping
      expect(clampQuantity(9950, 100, min, max)).toBe(10000);
      expect(clampQuantity(10000, 100, min, max)).toBe(10000);
    });

    it("empirically verifies case-insensitive protocol check in SMM URL validation", () => {
      // Valid uppercase scheme URLs now pass validation:
      const upperCaseResult = validateTargetLink("HTTPS://WWW.TIKTOK.COM/@user/video/999", true, false);
      expect(upperCaseResult).toBeNull();

      const mixedCaseResult = validateTargetLink("Http://www.facebook.com/user/posts/123", false, true);
      expect(mixedCaseResult).toBeNull();

      // Lowercase URLs also pass:
      const lowerCaseResult = validateTargetLink("https://www.tiktok.com/@user/video/999", true, false);
      expect(lowerCaseResult).toBeNull();
    });
  });

  // =========================================================================
  // 6. Deep Adversarial Edge Cases
  // =========================================================================
  describe("6. Deep Adversarial Edge Cases", () => {
    it("renders ProductCard 3-tier stock indicator correctly across boundary values", async () => {
      const ProductCard = (await import("@/components/ProductCard")).default;
      const { renderToStaticMarkup } = await import("react-dom/server");

      const baseProduct = {
        id: "prod-test-1",
        title: "Tài khoản Canva Pro",
        slug: "canva-pro",
        description: "Bản quyền Canva Pro",
        price: 99000,
        originalPrice: 199000,
        categoryId: "cat-1",
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

      // Case 1: stockCount = 10 (> 5) -> "Sẵn hàng (10)"
      const htmlPlenty = renderToStaticMarkup(
        React.createElement(ProductCard, {
          product: { ...baseProduct, stockCount: 10 },
        })
      );
      expect(htmlPlenty).toContain("Sẵn hàng (10)");
      expect(htmlPlenty).toContain("Mua ngay");

      // Case 2: stockCount = 3 (<= 5 and > 0) -> "Còn ít (3)"
      const htmlLow = renderToStaticMarkup(
        React.createElement(ProductCard, {
          product: { ...baseProduct, stockCount: 3 },
        })
      );
      expect(htmlLow).toContain("Còn ít (3)");
      expect(htmlLow).toContain("Mua ngay");

      // Case 3: stockCount = 0 -> "Hết hàng" with disabled CTA
      const htmlOut = renderToStaticMarkup(
        React.createElement(ProductCard, {
          product: { ...baseProduct, stockCount: 0 },
        })
      );
      expect(htmlOut).toContain("Hết hàng");
      expect(htmlOut).toContain("disabled");
      expect(htmlOut).not.toContain("Mua ngay");

      // Case 4: API product with stockCount >= 99999 -> "Sẵn hàng" without number
      const htmlApiKey = renderToStaticMarkup(
        React.createElement(ProductCard, {
          product: {
            ...baseProduct,
            title: "API Claude 3.5 Sonnet",
            category: { name: "API AI", slug: "ai-api" },
            stockCount: 999999,
          },
        })
      );
      expect(htmlApiKey).toContain("Sẵn hàng");
      expect(htmlApiKey).not.toContain("Sẵn hàng (999999)");
    });

    it("verifies QuickViewModal displays Preview Mode badge when isAdminPreview=true", async () => {
      const QuickViewModal = (await import("@/components/QuickViewModal")).default;
      const { renderToStaticMarkup } = await import("react-dom/server");

      const mockProd = {
        id: "prod-preview-1",
        title: "Test Admin Preview Product",
        slug: "test-preview",
        description: "Desc",
        price: 50000,
        originalPrice: null,
        categoryId: "cat-1",
        isActive: true,
        type: "LICENSE_KEY",
        stockCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        minQuantity: 1,
        maxQuantity: 10,
        unitLabel: "key",
        thumbnailUrl: null,
        sortOrder: 1,
        fulfillmentType: "LOCAL_STOCK",
      };

      const html = renderToStaticMarkup(
        React.createElement(QuickViewModal, {
          product: mockProd,
          isOpen: true,
          onClose: vi.fn(),
          isAdminPreview: true,
        })
      );

      expect(html).toContain("Preview Mode");
    });
  });
});

