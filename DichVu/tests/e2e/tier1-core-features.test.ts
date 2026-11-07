import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  ItemStatus,
  OrderStatus,
  FulfillmentType,
  CouponType,
} from "@/lib/prisma";
import { POST as validateCartRoute } from "@/app/api/cart/validate/route";
import { POST as validateCouponRoute } from "@/app/api/coupons/validate/route";
import { POST as createOrderRoute } from "@/app/api/orders/route";
import { GET as getOrderStatusRoute } from "@/app/api/orders/[orderCode]/status/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import {
  processSectionProducts,
  resolveProductThumbnail,
} from "@/lib/catalog-grouping";
import { parseSecretItem } from "@/components/SecretDisplay";

describe("Tier 1: Core Feature Coverage (KhoDEE V2 Baseline)", () => {
  const PREFIX = "tier1-e2e-";
  const CAT_SLUG = `${PREFIX}category`;
  const KEY_PROD_SLUG = `${PREFIX}key-product`;
  const ACC_PROD_SLUG = `${PREFIX}acc-product`;
  const COUPON_CODE = "TIER1PROMO10K";

  let categoryId: string;
  let keyProductId: string;
  let accProductId: string;
  let couponId: string;
  let createdOrderCode: string;
  let createdAccessToken: string;

  beforeAll(async () => {
    // 1. Cascading clean up of any prior runs
    const testSlugs = [KEY_PROD_SLUG, ACC_PROD_SLUG];
    await prisma.coupon.deleteMany({ where: { code: COUPON_CODE } }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: testSlugs } } },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: testSlugs } } },
    }).catch(() => {});
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: testSlugs } } } } } },
    }).catch(() => {});
    await prisma.paymentTransaction.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: testSlugs } } } } } },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: { in: testSlugs } } } } },
    }).catch(() => {});
    await prisma.product.deleteMany({ where: { slug: { in: testSlugs } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: CAT_SLUG } }).catch(() => {});

    // 2. Create test category
    const cat = await prisma.category.create({
      data: {
        name: "Tier 1 Software & API",
        slug: CAT_SLUG,
      },
    });
    categoryId = cat.id;

    // 3. Create digital key product (5 units in stock, 50,000 VND)
    const keyProduct = await prisma.product.create({
      data: {
        title: "API Claude 3.5 Sonnet Tier 1",
        slug: KEY_PROD_SLUG,
        description: "Bản quyền API Claude chính hãng bảo hành 1-đổi-1",
        price: 50000,
        originalPrice: 70000,
        categoryId: cat.id,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        type: "LICENSE_KEY",
      },
    });
    keyProductId = keyProduct.id;

    for (let i = 1; i <= 5; i++) {
      await prisma.productItem.create({
        data: {
          productId: keyProductId,
          secretContent: `sk-ant-tier1-token-${i}-secret-key`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    // 4. Create account product (username|password credentials, 80,000 VND)
    const accProduct = await prisma.product.create({
      data: {
        title: "Tài khoản CapCut Pro 1 Năm Tier 1",
        slug: ACC_PROD_SLUG,
        description: "Tài khoản CapCut Pro riêng tư không đổi pass",
        price: 80000,
        originalPrice: 120000,
        categoryId: cat.id,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        type: "ACCOUNT",
      },
    });
    accProductId = accProduct.id;

    await prisma.productItem.create({
      data: {
        productId: accProductId,
        secretContent: "capcut_user_tier1@store.vn|P@ssw0rdTier1!2026",
        status: ItemStatus.AVAILABLE,
      },
    });

    // 5. Create valid test coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: COUPON_CODE,
        type: CouponType.FIXED,
        value: 10000,
        minOrderValue: 40000,
        isActive: true,
        usageLimit: 100,
        usedCount: 0,
      },
    });
    couponId = coupon.id;
  });

  afterAll(async () => {
    const testSlugs = [KEY_PROD_SLUG, ACC_PROD_SLUG];
    await prisma.coupon.deleteMany({ where: { code: COUPON_CODE } }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: testSlugs } } },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: testSlugs } } },
    }).catch(() => {});
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: testSlugs } } } } } },
    }).catch(() => {});
    await prisma.paymentTransaction.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: testSlugs } } } } } },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: { in: testSlugs } } } } },
    }).catch(() => {});
    await prisma.product.deleteMany({ where: { slug: { in: testSlugs } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: CAT_SLUG } }).catch(() => {});
  });

  // --------------------------------------------------------------------------
  // Feature 1 & 2: Semantic Design Tokens, Typography & Iconography System
  // --------------------------------------------------------------------------
  it("F1 & F2: should have semantic design tokens and typography defined in globals.css", () => {
    const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
    expect(fs.existsSync(globalsCssPath)).toBe(true);
    const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

    // Must define IBM Plex Sans (Vietnamese diacritics) and JetBrains Mono (code/keys)
    expect(cssContent).toContain("IBM+Plex+Sans");
    expect(cssContent).toContain("JetBrains+Mono");

    // Must define semantic tokens (--bg-primary, --text-primary)
    expect(cssContent).toContain("--bg-primary");
    expect(cssContent).toContain("--text-primary");
    expect(cssContent).toContain("color-scheme: light");
    expect(cssContent).toContain("color-scheme: dark");
  });

  // --------------------------------------------------------------------------
  // Feature 6, 7, 8: Navigation, Hero & Brand Shortcut Filtering
  // --------------------------------------------------------------------------
  it("F6, F7, F8: should resolve brand shortcuts and catalog grouping", () => {
    // Brand thumbnail resolver check
    const claudeThumb = resolveProductThumbnail("API Claude 3.5 Sonnet", "api-claude-35-sonnet");
    expect(claudeThumb).toMatch(/(\/images\/brands\/|https?:\/\/)/);

    const cursorThumb = resolveProductThumbnail("Cursor Pro 1 Tháng", "cursor-pro-1-thang");
    expect(cursorThumb).toMatch(/(\/images\/brands\/|https?:\/\/)/);

    // Grouping processor test
    const rawItems = [
      {
        id: "mock-claude-10",
        title: "API Claude 10$ Max",
        price: 15000,
        slug: "claude-10-usd",
        category: { slug: "ai-api" },
        stockCount: 10,
      },
      {
        id: "mock-claude-50",
        title: "API Claude 50$ Max",
        price: 75000,
        slug: "claude-50-usd",
        category: { slug: "ai-api" },
        stockCount: 5,
      },
    ];

    const { items } = processSectionProducts(rawItems);
    expect(items.length).toBeGreaterThan(0);
    const claudeGroup = items.find((i) => i.groupKey === "claude");
    expect(claudeGroup).toBeDefined();
    expect(claudeGroup?.type).toBe("grouped");
    expect(claudeGroup?.groupedData?.variants.length).toBe(2);
    const minPrice = Math.min(...claudeGroup!.groupedData!.variants.map((v) => v.price));
    expect(minPrice).toBe(15000);
  });

  // --------------------------------------------------------------------------
  // Feature 9, 10, 11, 12: Standalone Product Card & Detail Data Contract
  // --------------------------------------------------------------------------
  it("F9, F10, F11, F12: should verify standalone product card and detail specs", async () => {
    const product = await prisma.product.findUnique({
      where: { id: keyProductId },
      include: { category: true, items: true },
    });

    expect(product).toBeDefined();
    expect(product?.title).toBe("API Claude 3.5 Sonnet Tier 1");
    expect(product?.price).toBe(50000);
    expect(product?.originalPrice).toBe(70000);
    expect(product?.items.length).toBe(5);

    // Calculate discount percentage
    const discount = Math.round(
      ((product!.originalPrice! - product!.price) / product!.originalPrice!) * 100
    );
    expect(discount).toBe(29);
  });

  // --------------------------------------------------------------------------
  // Feature 13 & 14: Server-Side Cart & Coupon Validation
  // --------------------------------------------------------------------------
  it("F13 & F14: should validate cart and coupons authoritatively via server API", async () => {
    // 1. Cart Validation
    const cartReq = new NextRequest("http://localhost:3000/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          { productId: keyProductId, quantity: 2 },
          { productId: accProductId, quantity: 1 },
        ],
      }),
    });

    const cartRes = await validateCartRoute(cartReq);
    expect(cartRes.status).toBe(200);
    const cartData = await cartRes.json();

    expect(cartData.valid).toBe(true);
    expect(cartData.subtotalAmount).toBe(50000 * 2 + 80000 * 1); // 180,000 VND
    expect(cartData.items.length).toBe(2);
    expect(cartData.items[0].hasError).toBe(false);
    expect(cartData.items[1].hasError).toBe(false);

    // 2. Coupon Validation
    const couponReq = new NextRequest("http://localhost:3000/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: COUPON_CODE,
        cartTotal: cartData.subtotalAmount,
      }),
    });

    const couponRes = await validateCouponRoute(couponReq);
    expect(couponRes.status).toBe(200);
    const couponData = await couponRes.json();

    expect(couponData.valid).toBe(true);
    expect(couponData.code).toBe(COUPON_CODE);
    expect(couponData.discountAmount).toBe(10000);
    expect(couponData.finalTotal).toBe(170000);
  });

  // --------------------------------------------------------------------------
  // Feature 15: VietQR Order Creation API
  // --------------------------------------------------------------------------
  it("F15: should create an order and generate a dynamic NAPAS VietQR link", async () => {
    const orderReq = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify({
        items: [{ productId: keyProductId, quantity: 1 }],
        customerEmail: "tier1_guest@gmail.com",
        customerNote: "Giao dịch kiểm thử Tier 1 VietQR",
        couponCode: COUPON_CODE,
      }),
    });

    const orderRes = await createOrderRoute(orderReq);
    expect(orderRes.status).toBe(201);
    const orderData = await orderRes.json();

    expect(orderData.success).toBe(true);
    expect(orderData.order).toBeDefined();
    expect(orderData.order.orderCode).toMatch(/^ORD\d{6}$/);
    expect(orderData.order.subtotalAmount).toBe(50000);
    expect(orderData.order.discountAmount).toBe(10000);
    expect(orderData.order.totalAmount).toBe(40000);

    // VietQR check
    expect(orderData.order.vietQrUrl).toContain("https://img.vietqr.io/image/");
    expect(orderData.order.vietQrUrl).toContain("40000");
    expect(orderData.order.vietQrUrl).toContain(orderData.order.orderCode);

    createdOrderCode = orderData.order.orderCode;

    // Fetch the access token directly from DB for subsequent test steps
    const dbOrder = await prisma.order.findUnique({
      where: { orderCode: createdOrderCode },
    });
    expect(dbOrder).toBeDefined();
    expect(dbOrder?.accessToken).toBeDefined();
    expect(dbOrder?.status).toBe(OrderStatus.PENDING);
    createdAccessToken = dbOrder!.accessToken as string;
  });

  // --------------------------------------------------------------------------
  // Feature 16: Real-Time Payment Status Polling
  // --------------------------------------------------------------------------
  it("F16: should poll order status and respect state transitions", async () => {
    const statusReq = new NextRequest(
      `http://localhost:3000/api/orders/${createdOrderCode}/status?token=${createdAccessToken}`,
      { method: "GET" }
    );

    const statusRes = await getOrderStatusRoute(statusReq, {
      params: { orderCode: createdOrderCode },
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();

    expect(statusData.status).toBe("PENDING");
    expect(statusData.totalAmount).toBe(40000);
    expect(statusData.expiresAt).toBeDefined();
    expect(statusData.vietQrUrl).toContain("img.vietqr.io");
    // While pending, deliveredItems must be empty
    expect(statusData.deliveredItems).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Feature 19: Post-Purchase Handover & Secret Display Security
  // --------------------------------------------------------------------------
  it("F19: should securely reveal credentials when PAID with valid token, and redact when token is missing", async () => {
    // 1. Mark order as PAID and its reserved item as SOLD
    const order = await prisma.order.findUnique({
      where: { orderCode: createdOrderCode },
      include: { orderItems: true },
    });

    await prisma.productItem.updateMany({
      where: { orderId: order!.id },
      data: { status: ItemStatus.SOLD },
    });

    await prisma.order.update({
      where: { id: order!.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      },
    });

    // 2. Request status WITH valid accessToken
    const authedReq = new NextRequest(
      `http://localhost:3000/api/orders/${createdOrderCode}/status?token=${createdAccessToken}`,
      { method: "GET" }
    );
    const authedRes = await getOrderStatusRoute(authedReq, {
      params: { orderCode: createdOrderCode },
    });
    expect(authedRes.status).toBe(200);
    const authedData = await authedRes.json();

    expect(authedData.status).toBe("PAID");
    expect(authedData.deliveredItems.length).toBe(1);
    expect(authedData.deliveredItems[0].secretContent).toMatch(/^sk-ant-tier1-token-/);

    // 3. Request status WITHOUT token (or invalid token)
    const unauthedReq = new NextRequest(
      `http://localhost:3000/api/orders/${createdOrderCode}/status`,
      { method: "GET" }
    );
    const unauthedRes = await getOrderStatusRoute(unauthedReq, {
      params: { orderCode: createdOrderCode },
    });
    expect(unauthedRes.status).toBe(200);
    const unauthedData = await unauthedRes.json();

    expect(unauthedData.status).toBe("PAID");
    // Credentials MUST be completely redacted to protect guest customers
    expect(unauthedData.deliveredItems).toEqual([]);

    // 4. Test credential parsing for account format vs key format
    const parsedKey = parseSecretItem("sk-ant-sample-secret-key-12345", "LICENSE_KEY");
    expect(parsedKey.isAccount).toBe(false);
    expect(parsedKey.raw).toBe("sk-ant-sample-secret-key-12345");

    const parsedAcc = parseSecretItem("customer@netflix.com|SecretP@ss999", "ACCOUNT");
    expect(parsedAcc.isAccount).toBe(true);
    expect(parsedAcc.username).toBe("customer@netflix.com");
    expect(parsedAcc.password).toBe("SecretP@ss999");
  });
});
