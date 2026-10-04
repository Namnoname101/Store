import { describe, it, expect, beforeEach } from "vitest";
import { prisma, CouponType } from "@/lib/prisma";
import { validateCoupon, calculateDiscount } from "@/services/coupon.service";

describe("Coupon Service", () => {
  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.coupon.deleteMany();
  });

  it("should calculate fixed discount and enforce 1,000 VND floor", async () => {
    await prisma.coupon.create({
      data: {
        code: "SALE20K",
        type: CouponType.FIXED,
        value: 20000,
        minOrderValue: 50000,
      },
    });

    // Valid case
    const resValid = await validateCoupon("sale20k", 100000);
    expect(resValid.valid).toBe(true);
    expect(resValid.discountAmount).toBe(20000);
    expect(resValid.finalTotal).toBe(80000);

    // Below minimum order value
    const resBelowMin = await validateCoupon("SALE20K", 30000);
    expect(resBelowMin.valid).toBe(false);
    expect(resBelowMin.message).toContain("tối thiểu");

    // Floor safeguard: if order is 20,500 and coupon is 20,000, final is 1,000 VND min floor if over-discounted
    const resFloor = await validateCoupon("SALE20K", 20500);
    expect(resFloor.valid).toBe(false); // because 20,500 < minOrderValue 50,000
  });

  it("should enforce 1,000 VND minimum floor when discount would reduce total below 1,000", async () => {
    await prisma.coupon.create({
      data: {
        code: "SUPER50K",
        type: CouponType.FIXED,
        value: 50000,
        minOrderValue: 10000,
      },
    });

    const res = await validateCoupon("SUPER50K", 40000);
    expect(res.valid).toBe(true);
    expect(res.finalTotal).toBe(1000);
    expect(res.discountAmount).toBe(39000);
  });

  it("should calculate percentage discount with maxDiscount ceiling", async () => {
    await prisma.coupon.create({
      data: {
        code: "GIAM10PCT",
        type: CouponType.PERCENT,
        value: 10,
        maxDiscount: 15000,
      },
    });

    const res = await validateCoupon("GIAM10PCT", 200000);
    expect(res.valid).toBe(true);
    expect(res.discountAmount).toBe(15000); // 10% of 200k = 20k, capped at 15k
    expect(res.finalTotal).toBe(185000);
  });

  it("should reject expired, inactive, or exhausted coupons", async () => {
    await prisma.coupon.create({
      data: {
        code: "EXPIRED",
        type: CouponType.FIXED,
        value: 10000,
        expiresAt: new Date(Date.now() - 100000), // past
      },
    });

    await prisma.coupon.create({
      data: {
        code: "PAUSED",
        type: CouponType.FIXED,
        value: 10000,
        isActive: false,
      },
    });

    await prisma.coupon.create({
      data: {
        code: "EXHAUSTED",
        type: CouponType.FIXED,
        value: 10000,
        usageLimit: 3,
        usedCount: 3,
      },
    });

    const resExp = await validateCoupon("EXPIRED", 50000);
    expect(resExp.valid).toBe(false);
    expect(resExp.message).toContain("hết hạn");

    const resPaused = await validateCoupon("PAUSED", 50000);
    expect(resPaused.valid).toBe(false);
    expect(resPaused.message).toContain("tạm ngưng");

    const resExh = await validateCoupon("EXHAUSTED", 50000);
    expect(resExh.valid).toBe(false);
    expect(resExh.message).toContain("hết lượt");

    const resNotFound = await validateCoupon("NONEXISTENT", 50000);
    expect(resNotFound.valid).toBe(false);
    expect(resNotFound.message).toContain("không tồn tại");
  });
});
