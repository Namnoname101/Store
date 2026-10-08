import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  ItemStatus,
  OrderStatus,
  FulfillmentType,
  CouponType,
} from "@/lib/prisma";
import { createOrder, getOrderDetails } from "@/services/order.service";
import { POST as validateCartRoute } from "@/app/api/cart/validate/route";
import { POST as createOrderRoute } from "@/app/api/orders/route";

describe("Phase 4: Cart & Checkout End-to-End QA (10 Mandated Journeys)", () => {
  const TEST_CAT_SLUG = "p4-cart-cat";
  const PROD_KEY_SLUG = "p4-prod-key";
  const PROD_SMM_1_SLUG = "p4-prod-smm1";
  const PROD_SMM_2_SLUG = "p4-prod-smm2";
  const PROD_INACTIVE_SLUG = "p4-prod-inactive";
  const COUPON_CODE = "P4DISCOUNT20K";

  let catId: string;
  let keyProdId: string;
  let smm1ProdId: string;
  let smm2ProdId: string;
  let inactiveProdId: string;
  let couponId: string;

  beforeAll(async () => {
    // Cleanup residual
    const slugs = [
      PROD_KEY_SLUG,
      PROD_SMM_1_SLUG,
      PROD_SMM_2_SLUG,
      PROD_INACTIVE_SLUG,
    ];
    await prisma.coupon.deleteMany({ where: { code: COUPON_CODE } });
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: { in: slugs } } } } },
    });
    await prisma.product.deleteMany({ where: { slug: { in: slugs } } });
    await prisma.category.deleteMany({ where: { slug: TEST_CAT_SLUG } });

    const cat = await prisma.category.create({
      data: { name: "Phase 4 Category", slug: TEST_CAT_SLUG },
    });
    catId = cat.id;

    // 1. Digital Key Product (3 items in stock, 50,000 VND)
    const keyProd = await prisma.product.create({
      data: {
        title: "P4 Key Product",
        slug: PROD_KEY_SLUG,
        description: "Test description for key",
        price: 50000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    keyProdId = keyProd.id;

    for (let i = 1; i <= 20; i++) {
      await prisma.productItem.create({
        data: {
          productId: keyProdId,
          secretContent: `KEY-P4-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    // 2. SMM Product 1 (TikTok Follower - API_DROPSHIP, 200 VND/unit, min 50, max 5000)
    const smm1Prod = await prisma.product.create({
      data: {
        title: "P4 TikTok Followers",
        slug: PROD_SMM_1_SLUG,
        description: "Test description for tiktok",
        price: 200,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        minQuantity: 50,
        maxQuantity: 5000,
      },
    });
    smm1ProdId = smm1Prod.id;

    // 3. SMM Product 2 (Facebook Like - API_DROPSHIP, 100 VND/unit, min 100, max 10000)
    const smm2Prod = await prisma.product.create({
      data: {
        title: "P4 Facebook Likes",
        slug: PROD_SMM_2_SLUG,
        description: "Test description for fb",
        price: 100,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        minQuantity: 100,
        maxQuantity: 10000,
      },
    });
    smm2ProdId = smm2Prod.id;

    // 4. Inactive Product
    const inactiveProd = await prisma.product.create({
      data: {
        title: "P4 Disabled Product",
        slug: PROD_INACTIVE_SLUG,
        description: "Test description for inactive",
        price: 30000,
        categoryId: catId,
        isActive: false,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    inactiveProdId = inactiveProd.id;

    // 5. Coupon (20,000 VND off, min order 60,000 VND)
    const coupon = await prisma.coupon.create({
      data: {
        code: COUPON_CODE,
        type: CouponType.FIXED,
        value: 20000,
        minOrderValue: 60000,
        isActive: true,
      },
    });
    couponId = coupon.id;
  });

  afterAll(async () => {
    const slugs = [
      PROD_KEY_SLUG,
      PROD_SMM_1_SLUG,
      PROD_SMM_2_SLUG,
      PROD_INACTIVE_SLUG,
    ];
    await prisma.coupon.deleteMany({ where: { code: COUPON_CODE } });
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: slugs } } } } } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: { in: slugs } } } } },
    });
    await prisma.product.deleteMany({ where: { slug: { in: slugs } } });
    await prisma.category.deleteMany({ where: { slug: TEST_CAT_SLUG } });
  });

  // Journey 1: Guest without login buys single item
  it("Journey 1: Guest without login purchases a single item successfully with unique accessToken", async () => {
    const order = await createOrder({
      customerEmail: "guest-single@example.com",
      items: [{ productId: keyProdId, quantity: 1 }],
    });

    expect(order.userId).toBeNull();
    expect(order.accessToken).toBeDefined();
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.totalAmount).toBe(50000);
  });

  // Journey 2: Guest without email buys item
  it("Journey 2: Guest without email purchases successfully; customerEmail is null and lookup succeeds", async () => {
    const order = await createOrder({
      items: [{ productId: keyProdId, quantity: 1 }],
      customerNote: "No email provided",
    });

    expect(order.customerEmail).toBeNull();
    expect(order.userId).toBeNull();
    expect(order.totalAmount).toBe(50000);

    const details = await getOrderDetails(order.orderCode);
    expect(details).not.toBeNull();
    expect(details?.customerEmail).toBeNull();
  });

  // Journey 3: Multi-product cart checkout
  it("Journey 3: Customer buys multiple products in a single order with correct subtotal calculation", async () => {
    const order = await createOrder({
      customerEmail: "multi-cart@example.com",
      items: [
        { productId: keyProdId, quantity: 1 }, // 50,000 VND
        { productId: smm1ProdId, quantity: 100, targetLink: "https://tiktok.com/@test" }, // 100 * 200 = 20,000 VND
      ],
    });

    expect(order.orderItems).toHaveLength(2);
    expect(order.totalAmount).toBe(70000);
  });

  // Journey 4: Cart item modification and validation via /api/cart/validate
  it("Journey 4: Cart validation API verifies quantities, stock availability, and prices dynamically", async () => {
    const req = new Request("http://localhost/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          { productId: keyProdId, quantity: 1 },
          { productId: smm1ProdId, quantity: 50 },
        ],
      }),
    });

    const res = await validateCartRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.items).toHaveLength(2);
    // 50,000 + (50 * 200) = 60,000 VND
    expect(data.subtotalAmount).toBe(60000);
  });

  // Journey 5: Applying voucher with minOrderValue
  it("Journey 5: Voucher applies discount correctly and validates minOrderValue ceiling", async () => {
    const order = await createOrder({
      customerEmail: "coupon-user@example.com",
      items: [
        { productId: keyProdId, quantity: 1 }, // 50,000
        { productId: smm1ProdId, quantity: 100 }, // 20,000 -> subtotal 70,000 >= 60,000
      ],
      couponCode: COUPON_CODE,
    });

    expect(order.subtotalAmount).toBe(70000);
    expect(order.discountAmount).toBe(20000);
    expect(order.totalAmount).toBe(50000);
    expect(order.couponId).toBe(couponId);
  });

  // Journey 6: Server ignores client-supplied prices and uses live DB price
  it("Journey 6: Order calculation strictly uses live database prices even if product price updated", async () => {
    // Temporarily update product price
    await prisma.product.update({
      where: { id: keyProdId },
      data: { price: 55000 },
    });

    try {
      const order = await createOrder({
        customerEmail: "price-update@example.com",
        items: [{ productId: keyProdId, quantity: 1 }],
      });
      // Must use new price 55,000 VND
      expect(order.totalAmount).toBe(55000);
    } finally {
      // Revert price back
      await prisma.product.update({
        where: { id: keyProdId },
        data: { price: 50000 },
      });
    }
  });

  // Journey 7: Out of stock rejected before checkout
  it("Journey 7: Ordering more than available local stock is strictly rejected with stock error", async () => {
    await expect(
      createOrder({
        customerEmail: "out-of-stock@example.com",
        items: [{ productId: keyProdId, quantity: 999 }], // only 20 in stock
      })
    ).rejects.toThrow(/(Insufficient stock available|không đủ|Kho chỉ còn)/i);
  });

  // Journey 8: Product deactivated by Admin is rejected
  it("Journey 8: Attempting to checkout disabled product throws inactive error", async () => {
    await expect(
      createOrder({
        customerEmail: "inactive-buyer@example.com",
        items: [{ productId: inactiveProdId, quantity: 1 }],
      })
    ).rejects.toThrow(/Product is not active/i);
  });

  // Journey 9: Duplicate requests with same idempotencyKey return existing order
  it("Journey 9: Duplicate checkout requests with identical idempotencyKey return cached order", async () => {
    const key = `IDEMP_P4_${Date.now()}`;
    const payload = {
      customerEmail: "idemp@example.com",
      items: [{ productId: keyProdId, quantity: 1 }],
      idempotencyKey: key,
    };

    const first = await createOrder(payload);
    const second = await createOrder(payload);

    expect(first.id).toBe(second.id);
    expect(first.orderCode).toBe(second.orderCode);
  });

  // Journey 10: Individual product information (targetLink, customerNote) is preserved per OrderItem
  it("Journey 10: Individual product targetLink and customerNote are stored per OrderItem for upstream routing", async () => {
    const order = await createOrder({
      customerEmail: "individual-items@example.com",
      items: [
        {
          productId: smm1ProdId,
          quantity: 100,
          targetLink: "https://www.tiktok.com/@channel_alpha",
          customerNote: "Tăng follow tự nhiên",
        },
        {
          productId: smm2ProdId,
          quantity: 200,
          targetLink: "https://www.facebook.com/post_beta",
          customerNote: "Like từ từ trong 2 tiếng",
        },
      ],
      customerNote: "Ghi chú chung cho toàn bộ đơn hàng",
    });

    expect(order.orderItems).toHaveLength(2);

    const item1 = order.orderItems.find((i) => i.productId === smm1ProdId);
    expect(item1?.targetLink).toBe("https://www.tiktok.com/@channel_alpha");
    expect(item1?.customerNote).toBe("Tăng follow tự nhiên");

    const item2 = order.orderItems.find((i) => i.productId === smm2ProdId);
    expect(item2?.targetLink).toBe("https://www.facebook.com/post_beta");
    expect(item2?.customerNote).toBe("Like từ từ trong 2 tiếng");

    expect(order.customerNote).toBe("Ghi chú chung cho toàn bộ đơn hàng");
  });
});
