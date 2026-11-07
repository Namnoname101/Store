import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  ItemStatus,
  OrderStatus,
  FulfillmentType,
  CouponType,
  PaymentIntentStatus,
  ReconciliationStatus,
} from "@/lib/prisma";
import { POST as validateCartRoute } from "@/app/api/cart/validate/route";
import { POST as validateCouponRoute } from "@/app/api/coupons/validate/route";
import { POST as createOrderRoute } from "@/app/api/orders/route";
import { POST as regenerateQrRoute } from "@/app/api/orders/[orderCode]/regenerate-qr/route";
import { POST as refundRequestRoute, GET as getRefundRoute } from "@/app/api/orders/[orderCode]/refund-request/route";
import { POST as webhookRoute } from "@/app/api/webhooks/payment/route";
import { GET as getOrderStatusRoute } from "@/app/api/orders/[orderCode]/status/route";
import { NextRequest } from "next/server";

describe("Tier 2: Boundary & Corner Cases (KhoDEE V2)", () => {
  const PREFIX = "tier2-e2e-";
  const CAT_SLUG = `${PREFIX}category`;
  const CAT_SMM_SLUG = "dich-vu-mxh";
  const STOCK_PROD_SLUG = `${PREFIX}stock-prod`;
  const OOS_PROD_SLUG = `${PREFIX}oos-prod`;
  const SMM_PROD_SLUG = `${PREFIX}smm-prod`;

  const COUPON_EXPIRED_CODE = "T2EXPIREDCOUPON";
  const COUPON_HIGH_MIN_CODE = "T2HIGHMINCOUPON";

  let catId: string;
  let stockProdId: string;
  let oosProdId: string;
  let smmProdId: string;

  beforeAll(async () => {
    // 1. Cleanup
    const slugs = [STOCK_PROD_SLUG, OOS_PROD_SLUG, SMM_PROD_SLUG];
    await prisma.coupon.deleteMany({
      where: { code: { in: [COUPON_EXPIRED_CODE, COUPON_HIGH_MIN_CODE] } },
    }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    }).catch(() => {});
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: slugs } } } } } },
    }).catch(() => {});
    await prisma.paymentTransaction.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: slugs } } } } } },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: { in: slugs } } } } },
    }).catch(() => {});
    await prisma.product.deleteMany({ where: { slug: { in: slugs } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: CAT_SLUG } }).catch(() => {});

    // Ensure SMM category exists
    let smmCat = await prisma.category.findUnique({ where: { slug: CAT_SMM_SLUG } });
    if (!smmCat) {
      smmCat = await prisma.category.create({
        data: { name: "Dịch Vụ MXH", slug: CAT_SMM_SLUG },
      });
    }

    const cat = await prisma.category.create({
      data: { name: "Tier 2 Category", slug: CAT_SLUG },
    });
    catId = cat.id;

    // 2. Normal Stock Product (2 units, 60,000 VND)
    const stockProd = await prisma.product.create({
      data: {
        title: "P2 Stock Product",
        slug: STOCK_PROD_SLUG,
        description: "Test description",
        price: 60000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    stockProdId = stockProd.id;

    for (let i = 1; i <= 20; i++) {
      await prisma.productItem.create({
        data: {
          productId: stockProdId,
          secretContent: `KEY-T2-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    // 3. Out of stock product (0 units, 100,000 VND)
    const oosProd = await prisma.product.create({
      data: {
        title: "P2 Out Of Stock Product",
        slug: OOS_PROD_SLUG,
        description: "Out of stock test",
        price: 100000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    oosProdId = oosProd.id;

    // 4. SMM Product (min 50, max 5000, 200 VND/unit)
    const smmProd = await prisma.product.create({
      data: {
        title: "Tăng Follower TikTok Tier 2",
        slug: SMM_PROD_SLUG,
        description: "SMM test",
        price: 200,
        categoryId: smmCat.id,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        minQuantity: 50,
        maxQuantity: 5000,
      },
    });
    smmProdId = smmProd.id;

    // 5. Expired Coupon
    await prisma.coupon.create({
      data: {
        code: COUPON_EXPIRED_CODE,
        type: CouponType.FIXED,
        value: 10000,
        minOrderValue: 20000,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        isActive: true,
      },
    });

    // 6. High Minimum Order Coupon
    await prisma.coupon.create({
      data: {
        code: COUPON_HIGH_MIN_CODE,
        type: CouponType.FIXED,
        value: 20000,
        minOrderValue: 500000, // 500k minimum
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    const slugs = [STOCK_PROD_SLUG, OOS_PROD_SLUG, SMM_PROD_SLUG];
    await prisma.coupon.deleteMany({
      where: { code: { in: [COUPON_EXPIRED_CODE, COUPON_HIGH_MIN_CODE] } },
    }).catch(() => {});
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    }).catch(() => {});
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: slugs } } } } } },
    }).catch(() => {});
    await prisma.paymentTransaction.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: { in: slugs } } } } } },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: { in: slugs } } } } },
    }).catch(() => {});
    await prisma.product.deleteMany({ where: { slug: { in: slugs } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: CAT_SLUG } }).catch(() => {});
  });

  // --------------------------------------------------------------------------
  // Edge Case 1: 10-Minute QR Expiration & 1-Click QR Refresh
  // --------------------------------------------------------------------------
  it("F17: should expire after 10 minutes and regenerate a new active PaymentIntent with 1-click", async () => {
    // 1. Create order
    const orderReq = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify({
        items: [{ productId: stockProdId, quantity: 1 }],
        customerEmail: "t2_expiry@test.com",
      }),
    });
    const orderRes = await createOrderRoute(orderReq);
    expect(orderRes.status).toBe(201);
    const orderData = await orderRes.json();
    const orderCode = orderData.order.orderCode;

    // Verify initial intent
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { paymentIntents: true },
    });
    expect(order?.paymentIntents.length).toBe(1);
    const initialIntent = order!.paymentIntents[0];
    expect(initialIntent.status).toBe(PaymentIntentStatus.ACTIVE);

    // Simulate 10-minute expiry by setting expiresAt to the past
    await prisma.order.update({
      where: { id: order!.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await prisma.paymentIntent.update({
      where: { id: initialIntent.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    // 2. Call regenerate-qr API
    const regenReq = new NextRequest(`http://localhost:3000/api/orders/${orderCode}/regenerate-qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: order!.accessToken }),
    });

    const regenRes = await regenerateQrRoute(regenReq, {
      params: { orderCode },
    });
    expect(regenRes.status).toBe(200);
    const regenData = await regenRes.json();

    expect(regenData.success).toBe(true);
    expect(regenData.paymentIntent).toBeDefined();
    expect(regenData.paymentIntent.intentCode).toBe(`PI_${orderCode}_2`);
    expect(new Date(regenData.paymentIntent.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // 3. Verify old intent is marked SUPERSEDED
    const updatedInitialIntent = await prisma.paymentIntent.findUnique({
      where: { id: initialIntent.id },
    });
    expect(updatedInitialIntent?.status).toBe(PaymentIntentStatus.SUPERSEDED);
  });

  // --------------------------------------------------------------------------
  // Edge Case 2: Underpayment Reconciliation Delta QR
  // --------------------------------------------------------------------------
  it("F18 (Underpayment): should mark reconciliation UNDERPAID and provide delta difference", async () => {
    // 1. Create order for 60,000 VND
    const orderReq = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify({
        items: [{ productId: stockProdId, quantity: 1 }],
        customerEmail: "t2_underpaid@test.com",
      }),
    });
    const orderRes = await createOrderRoute(orderReq);
    const { order } = await orderRes.json();
    const orderCode = order.orderCode;

    // 2. Send webhook with only 40,000 VND (underpaid by 20,000 VND)
    const txId = `TX_T2_UNDER_${Date.now()}`;
    const webhookReq = new NextRequest("http://localhost:3000/api/webhooks/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: txId,
        amount: 40000,
        content: `Chuyen khoan ${orderCode}`,
        bankCode: "MB",
      }),
    });

    const webhookRes = await webhookRoute(webhookReq);
    expect(webhookRes.status).toBe(200);
    const webhookData = await webhookRes.json();
    expect(webhookData.success).toBe(true);
    expect(webhookData.message).toContain("Chuyển thiếu tiền");

    // 3. Inspect order status
    const statusReq = new NextRequest(`http://localhost:3000/api/orders/${orderCode}/status`, {
      method: "GET",
    });
    const statusRes = await getOrderStatusRoute(statusReq, {
      params: { orderCode },
    });
    const statusData = await statusRes.json();

    expect(statusData.status).toBe("PENDING");
    expect(statusData.reconciliationStatus).toBe("UNDERPAID");
    expect(statusData.reconciliationNote).toContain("20.000đ");
  });

  // --------------------------------------------------------------------------
  // Edge Case 3: Overpayment Handling & Automated Refund Request Submission
  // --------------------------------------------------------------------------
  it("F18 (Overpayment): should mark OVERPAID and record self-service refund request with bank details", async () => {
    // 1. Create order for 60,000 VND
    const orderReq = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify({
        items: [{ productId: stockProdId, quantity: 1 }],
        customerEmail: "t2_overpaid@test.com",
      }),
    });
    const orderRes = await createOrderRoute(orderReq);
    const { order } = await orderRes.json();
    const orderCode = order.orderCode;

    const dbOrder = await prisma.order.findUnique({ where: { orderCode } });

    // 2. Send webhook with 100,000 VND (overpaid by 40,000 VND)
    const txId = `TX_T2_OVER_${Date.now()}`;
    const webhookReq = new NextRequest("http://localhost:3000/api/webhooks/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: txId,
        amount: 100000,
        content: `Chuyen khoan ${orderCode}`,
        bankCode: "MB",
      }),
    });

    const webhookRes = await webhookRoute(webhookReq);
    expect(webhookRes.status).toBe(200);

    const statusReq = new NextRequest(`http://localhost:3000/api/orders/${orderCode}/status`, {
      method: "GET",
    });
    const statusRes = await getOrderStatusRoute(statusReq, {
      params: { orderCode },
    });
    const statusData = await statusRes.json();

    expect(statusData.reconciliationStatus).toBe("OVERPAID");
    expect(statusData.reconciliationNote).toContain("40.000đ");

    // 3. Customer submits refund request with bank details
    const refundPayload = {
      bankName: "MB Bank",
      accountNumber: "0987654321",
      accountName: "NGUYEN VAN A",
      note: "Yêu cầu hoàn phần tiền thừa 40.000đ",
    };

    const refundReq = new NextRequest(
      `http://localhost:3000/api/orders/${orderCode}/refund-request?token=${dbOrder!.accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundPayload),
      }
    );

    const refundRes = await refundRequestRoute(refundReq, {
      params: { orderCode },
    });
    expect(refundRes.status).toBe(200);
    const refundData = await refundRes.json();
    expect(refundData.success).toBe(true);

    // 4. Verify refund details recorded on order
    const getRefundReq = new NextRequest(
      `http://localhost:3000/api/orders/${orderCode}/refund-request?token=${dbOrder!.accessToken}`,
      { method: "GET" }
    );
    const getRefundRes = await getRefundRoute(getRefundReq, {
      params: { orderCode },
    });
    const getRefundData = await getRefundRes.json();

    expect(getRefundData.hasRefundRequest).toBe(true);
    expect(getRefundData.refundInfo.accountNumber).toBe("0987654321");
    expect(getRefundData.refundInfo.accountName).toBe("NGUYEN VAN A");
  });

  // --------------------------------------------------------------------------
  // Edge Case 4: Expired Coupon Rejection
  // --------------------------------------------------------------------------
  it("F14 (Expired Coupon): should reject expired and below-min-order coupons", async () => {
    // 1. Expired Coupon
    const expReq = new NextRequest("http://localhost:3000/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: COUPON_EXPIRED_CODE,
        cartTotal: 100000,
      }),
    });
    const expRes = await validateCouponRoute(expReq);
    const expData = await expRes.json();

    expect(expData.valid).toBe(false);
    expect(expData.message).toMatch(/(hết hạn|không hợp lệ)/i);

    // 2. High Minimum Order Coupon
    const minReq = new NextRequest("http://localhost:3000/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: COUPON_HIGH_MIN_CODE,
        cartTotal: 100000, // less than 500k min
      }),
    });
    const minRes = await validateCouponRoute(minReq);
    const minData = await minRes.json();

    expect(minData.valid).toBe(false);
    expect(minData.message).toContain("500.000");
  });

  // --------------------------------------------------------------------------
  // Edge Case 5: Out of Stock Disabling
  // --------------------------------------------------------------------------
  it("F10 & F14 (Out of Stock): should flag error on out of stock or excessive quantity items", async () => {
    // 1. Zero stock item
    const cartReq = new NextRequest("http://localhost:3000/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: oosProdId, quantity: 1 }],
      }),
    });
    const cartRes = await validateCartRoute(cartReq);
    const cartData = await cartRes.json();

    expect(cartData.valid).toBe(false);
    expect(cartData.items[0].hasError).toBe(true);
    expect(cartData.items[0].errorMessage).toMatch(/(vượt quá giới hạn tối đa \(0\)|hết hàng|Kho chỉ còn 0)/i);

    // 2. Requesting 50 units when only ~17 exist
    const excessReq = new NextRequest("http://localhost:3000/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: stockProdId, quantity: 50 }],
      }),
    });
    const excessRes = await validateCartRoute(excessReq);
    const excessData = await excessRes.json();

    expect(excessData.valid).toBe(false);
    expect(excessData.items[0].hasError).toBe(true);
    expect(excessData.items[0].errorMessage).toMatch(/(vượt quá giới hạn tối đa|Kho chỉ còn \d+)/i);
  });

  // --------------------------------------------------------------------------
  // Edge Case 6: SMM Missing Target Link & Bound Validation
  // --------------------------------------------------------------------------
  it("F13 & F14 (SMM Bounds): should validate minimum and maximum quantity bounds for SMM", async () => {
    // 1. Below minimum (min is 50, customer requested 10)
    const belowMinReq = new NextRequest("http://localhost:3000/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: smmProdId, quantity: 10 }],
      }),
    });
    const belowMinRes = await validateCartRoute(belowMinReq);
    const belowMinData = await belowMinRes.json();

    expect(belowMinData.valid).toBe(false);
    expect(belowMinData.items[0].hasError).toBe(true);
    expect(belowMinData.items[0].errorMessage).toContain("Số lượng tối thiểu là 50");

    // 2. Exceeding maximum (max is 5000, customer requested 10000)
    const exceedMaxReq = new NextRequest("http://localhost:3000/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: smmProdId, quantity: 10000 }],
      }),
    });
    const exceedMaxRes = await validateCartRoute(exceedMaxReq);
    const exceedMaxData = await exceedMaxRes.json();

    expect(exceedMaxData.valid).toBe(false);
    expect(exceedMaxData.items[0].hasError).toBe(true);
    expect(exceedMaxData.items[0].errorMessage).toContain("giới hạn tối đa (5000)");

    // 3. Valid quantity within bounds (100 units)
    const validReq = new NextRequest("http://localhost:3000/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: smmProdId, quantity: 100, targetLink: "https://tiktok.com/@e2e_test" }],
      }),
    });
    const validRes = await validateCartRoute(validReq);
    const validData = await validRes.json();

    expect(validData.valid).toBe(true);
    expect(validData.subtotalAmount).toBe(200 * 100); // 20,000 VND
    expect(validData.items[0].hasError).toBe(false);
  });
});
