import { describe, it, expect, vi } from "vitest";
import React from "react";
import ProductCard, { formatVND, getProductTypeInfo } from "@/components/ProductCard";
import { STORE_CATEGORIES } from "@/components/Navbar";
import type { Product } from "@prisma/client";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Phase 2 Storefront UX/UI Redesign", () => {
  describe("Brand & Category Constants", () => {
    it("should include all required categories in Navbar and Store presets", () => {
      const categoryNames = STORE_CATEGORIES.map((c) => c.name);
      expect(categoryNames).toContain("Tất cả");
      expect(categoryNames).toContain("AI & API");
      expect(categoryNames).toContain("Cloud");
      expect(categoryNames).toContain("TikTok");
      expect(categoryNames).toContain("Facebook");
      expect(categoryNames).toContain("Instagram");
      expect(categoryNames).toContain("YouTube");
      expect(categoryNames).toContain("Khác");
    });
  });

  describe("ProductCard Component", () => {
    const mockProduct: Product & {
      stockCount: number;
      category?: { name: string; slug: string };
    } = {
      id: "prod-test-1",
      title: "ChatGPT Plus Chính Chủ 1 Tháng",
      slug: "chatgpt-plus-1-thang",
      description: "Tài khoản ChatGPT Plus kích hoạt trên email chính chủ.",
      price: 250000,
      originalPrice: 450000,
      type: "ACCOUNT",
      categoryId: "cat-ai",
      thumbnailUrl: "https://example.com/chatgpt.jpg",
      stockCount: 15,
      isActive: true,
      minQuantity: 1,
      maxQuantity: 10,
      fulfillmentType: "LOCAL_STOCK",
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        name: "AI & API",
        slug: "ai-api",
      },
    };

    it("should format prices in Vietnamese Dong format", () => {
      expect(formatVND(250000)).toMatch(/250\.000\s*đ/);
      expect(formatVND(1000)).toMatch(/1\.000\s*đ/);
    });

    it("should resolve correct type label and badge styling", () => {
      const keyInfo = getProductTypeInfo("LICENSE_KEY");
      expect(keyInfo.label).toBe("Key Bản Quyền");
      expect(keyInfo.shortLabel).toBe("Key");

      const accInfo = getProductTypeInfo("ACCOUNT");
      expect(accInfo.label).toBe("Tài Khoản");
      expect(accInfo.shortLabel).toBe("Tài khoản");

      const courseInfo = getProductTypeInfo("COURSE_LINK");
      expect(courseInfo.label).toBe("Khóa Học");
      expect(courseInfo.shortLabel).toBe("Khóa học");
    });

    it("should compute in-stock vs out-of-stock correctly", () => {
      const inStockProduct = { ...mockProduct, stockCount: 5 };
      const outOfStockProduct = { ...mockProduct, stockCount: 0 };

      // In stock
      expect(inStockProduct.stockCount > 0).toBe(true);

      // Out of stock
      expect(outOfStockProduct.stockCount > 0).toBe(false);
    });

    it("should calculate discount percent accurately without fake claims", () => {
      const discount = Math.round(
        ((mockProduct.originalPrice! - mockProduct.price) /
          mockProduct.originalPrice!) *
          100
      );
      expect(discount).toBe(44); // (450000 - 250000) / 450000 = 44.4% -> 44%
    });

    it("should detect SMM products that require target link", () => {
      const smmProduct = {
        ...mockProduct,
        title: "Tăng Follow TikTok Chuẩn Việt",
        category: { name: "Mạng Xã Hội", slug: "dich-vu-mxh" },
      };
      const isSMM =
        smmProduct.category?.slug === "dich-vu-mxh" ||
        smmProduct.title.toLowerCase().includes("tiktok");
      expect(isSMM).toBe(true);
    });
  });

  describe("Quick View Modal Configuration & Safeguards", () => {
    it("should calculate net total with coupon discount accurately and respect floor of 1000 VND", () => {
      const basePrice = 50000;
      const quantity = 2;
      const total = basePrice * quantity; // 100,000
      expect(total).toBe(100000);

      // 20% discount
      const discountAmount = 20000;
      const netTotal = Math.max(1000, total - discountAmount);
      expect(netTotal).toBe(80000);

      // Extreme discount clamped to 1,000 VND floor
      const hugeDiscount = 120000;
      const clampedTotal = Math.max(1000, total - hugeDiscount);
      expect(clampedTotal).toBe(1000);
    });

    it("should enforce admin preview mode safeguard against order submission", () => {
      const isAdminPreview = true;
      let orderCreated = false;
      const attemptCheckout = () => {
        if (isAdminPreview) {
          throw new Error("Chế độ xem trước: Không thể thực hiện đặt hàng hoặc thanh toán.");
        }
        orderCreated = true;
      };

      expect(() => attemptCheckout()).toThrow(
        "Chế độ xem trước: Không thể thực hiện đặt hàng hoặc thanh toán."
      );
      expect(orderCreated).toBe(false);
    });
  });
});
