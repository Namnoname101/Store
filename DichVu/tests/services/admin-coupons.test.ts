import { describe, it, expect, beforeEach } from "vitest";
import { prisma, CouponType } from "@/lib/prisma";

describe("Admin Coupon CRUD", () => {
  beforeEach(async () => {
    await prisma.coupon.deleteMany();
  });

  it("should allow creating, querying and deleting coupons", async () => {
    const c = await prisma.coupon.create({
      data: {
        code: "ADMINTEST",
        type: CouponType.FIXED,
        value: 50000,
        minOrderValue: 100000,
        usageLimit: 20,
      },
    });

    expect(c.id).toBeDefined();
    expect(c.code).toBe("ADMINTEST");

    const list = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    expect(list.length).toBe(1);
    expect(list[0].value).toBe(50000);

    // Update active status
    const updated = await prisma.coupon.update({
      where: { id: c.id },
      data: { isActive: false },
    });
    expect(updated.isActive).toBe(false);

    // Delete
    await prisma.coupon.delete({
      where: { id: c.id },
    });
    const afterDelete = await prisma.coupon.findMany();
    expect(afterDelete.length).toBe(0);
  });
});
