import { describe, it, expect, beforeAll } from "vitest";
import { prisma, CouponType } from "@/lib/prisma";

describe("Coupon Model & Order Relation", () => {
  beforeAll(async () => {
    // Clean up test coupons
    await prisma.coupon?.deleteMany().catch(() => {});
  });

  it("should create a coupon and associate it with an order", async () => {
    const coupon = await prisma.coupon.create({
      data: {
        code: "TEST10K",
        type: CouponType.FIXED,
        value: 10000,
        minOrderValue: 50000,
        usageLimit: 10,
      },
    });

    expect(coupon.id).toBeDefined();
    expect(coupon.code).toBe("TEST10K");
    expect(coupon.type).toBe("FIXED");
    expect(coupon.value).toBe(10000);
    expect(coupon.minOrderValue).toBe(50000);
    expect(coupon.usageLimit).toBe(10);
    expect(coupon.usedCount).toBe(0);
    expect(coupon.isActive).toBe(true);
  });

  it("should support percent coupon with max discount", async () => {
    const coupon = await prisma.coupon.create({
      data: {
        code: "GIAM20PCT",
        type: CouponType.PERCENT,
        value: 20,
        maxDiscount: 50000,
      },
    });

    expect(coupon.id).toBeDefined();
    expect(coupon.code).toBe("GIAM20PCT");
    expect(coupon.type).toBe("PERCENT");
    expect(coupon.value).toBe(20);
    expect(coupon.maxDiscount).toBe(50000);
  });
});
