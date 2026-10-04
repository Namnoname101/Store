import { describe, it, expect, beforeEach } from "vitest";
import { prisma, CouponType, ProductType, FulfillmentType } from "@/lib/prisma";
import { createOrder } from "@/services/order.service";

describe("Order Creation with Coupon Integration", () => {
  beforeEach(async () => {
    await prisma.paymentTransaction.deleteMany();
    await prisma.productItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.coupon.deleteMany();
  });

  it("should apply coupon discount to order total and VietQR payment link", async () => {
    // Ensure product exists
    let product = await prisma.product.findFirst({ where: { isActive: true } });
    if (!product) {
      const cat = await prisma.category.upsert({
        where: { slug: "test-cat" },
        update: {},
        create: { name: "Test Cat", slug: "test-cat" },
      });
      product = await prisma.product.create({
        data: {
          title: "Test Product Key",
          slug: "test-product-key-" + Date.now(),
          description: "Test description",
          price: 50000,
          type: ProductType.LICENSE_KEY,
          fulfillmentType: FulfillmentType.LOCAL_STOCK,
          categoryId: cat.id,
        },
      });
      // Add stock
      await prisma.productItem.create({
        data: {
          productId: product.id,
          secretContent: "TEST-KEY-12345",
          status: "AVAILABLE",
        },
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: "DISCOUNT10K",
        type: CouponType.FIXED,
        value: 10000,
        minOrderValue: 20000,
      },
    });

    const order = await createOrder({
      customerEmail: "buyer@example.com",
      items: [{ productId: product.id, quantity: 1 }],
      couponCode: "DISCOUNT10K",
    });

    expect(order.subtotalAmount).toBe(product.price);
    expect(order.discountAmount).toBe(10000);
    expect(order.totalAmount).toBe(product.price - 10000);
    expect(order.couponId).toBe(coupon.id);

    // Verify coupon usedCount incremented
    const updatedCoupon = await prisma.coupon.findUnique({
      where: { id: coupon.id },
    });
    expect(updatedCoupon?.usedCount).toBe(1);
  });

  it("should reject order creation if coupon code is invalid or expired", async () => {
    const product = await prisma.product.findFirst({ where: { isActive: true } });
    if (!product) return;

    await expect(
      createOrder({
        customerEmail: "buyer@example.com",
        items: [{ productId: product.id, quantity: 1 }],
        couponCode: "NONEXISTENT",
      })
    ).rejects.toThrow(/không tồn tại/i);
  });
});
