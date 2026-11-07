import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  ItemStatus,
  OrderStatus,
  FulfillmentType,
  CouponType,
  WalletTransactionType,
} from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";
import { POST as payWithWalletRoute } from "@/app/api/orders/[orderCode]/pay-with-wallet/route";
import { processAffiliateCommission, registerAffiliate } from "@/services/affiliate.service";
import { NextRequest } from "next/server";
import { processSectionProducts } from "@/lib/catalog-grouping";

describe("Tier 3: Cross-Feature Interactions (KhoDEE V2)", () => {
  const PREFIX = "tier3-e2e-";
  const CAT_SLUG = `${PREFIX}category`;
  const PROD_KEY_SLUG = `${PREFIX}key-prod`;
  const PROD_EXPENSIVE_SLUG = `${PREFIX}exp-prod`;

  let catId: string;
  let keyProdId: string;
  let expProdId: string;

  let richUserId: string;
  let richUserToken: string;
  let poorUserId: string;
  let poorUserToken: string;
  let affUserId: string;

  beforeAll(async () => {
    // 1. Cleanup
    const slugs = [PROD_KEY_SLUG, PROD_EXPENSIVE_SLUG];
    await prisma.walletTransaction.deleteMany({
      where: { user: { username: { startsWith: PREFIX } } },
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
    await prisma.coupon.deleteMany({
      where: { code: { startsWith: "CTV_T3" } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { username: { startsWith: PREFIX } },
    }).catch(() => {});
    await prisma.product.deleteMany({ where: { slug: { in: slugs } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: CAT_SLUG } }).catch(() => {});

    // 2. Create category
    const cat = await prisma.category.create({
      data: { name: "Tier 3 Cross Category", slug: CAT_SLUG },
    });
    catId = cat.id;

    // 3. Create products
    const keyProd = await prisma.product.create({
      data: {
        title: "P3 Local Key Item",
        slug: PROD_KEY_SLUG,
        description: "P3 key item",
        price: 50000,
        categoryId: cat.id,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    keyProdId = keyProd.id;

    for (let i = 1; i <= 10; i++) {
      await prisma.productItem.create({
        data: {
          productId: keyProdId,
          secretContent: `KEY-T3-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    const expProd = await prisma.product.create({
      data: {
        title: "P3 Expensive Item",
        slug: PROD_EXPENSIVE_SLUG,
        description: "P3 expensive item",
        price: 300000,
        categoryId: cat.id,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    expProdId = expProd.id;

    for (let i = 1; i <= 5; i++) {
      await prisma.productItem.create({
        data: {
          productId: expProdId,
          secretContent: `EXP-KEY-T3-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    // 4. Create Users:
    // Rich user: 200,000 VND
    const richUser = await prisma.user.create({
      data: {
        username: `${PREFIX}rich`,
        email: `${PREFIX}rich@gmail.com`,
        passwordHash: "dummyhash",
        balance: 200000,
      },
    });
    richUserId = richUser.id;
    richUserToken = await createUserSessionToken({
      userId: richUser.id,
      username: richUser.username!,
      role: "CUSTOMER",
    });

    // Poor user: 10,000 VND
    const poorUser = await prisma.user.create({
      data: {
        username: `${PREFIX}poor`,
        email: `${PREFIX}poor@gmail.com`,
        passwordHash: "dummyhash",
        balance: 10000,
      },
    });
    poorUserId = poorUser.id;
    poorUserToken = await createUserSessionToken({
      userId: poorUser.id,
      username: poorUser.username!,
      role: "CUSTOMER",
    });

    // Affiliate user: 0 VND
    const affUser = await prisma.user.create({
      data: {
        username: `${PREFIX}affiliate`,
        email: `${PREFIX}affiliate@gmail.com`,
        passwordHash: "dummyhash",
        balance: 0,
      },
    });
    affUserId = affUser.id;
  });

  afterAll(async () => {
    const slugs = [PROD_KEY_SLUG, PROD_EXPENSIVE_SLUG];
    await prisma.walletTransaction.deleteMany({
      where: { user: { username: { startsWith: PREFIX } } },
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
    await prisma.coupon.deleteMany({
      where: { code: { startsWith: "CTV_T3" } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { username: { startsWith: PREFIX } },
    }).catch(() => {});
    await prisma.product.deleteMany({ where: { slug: { in: slugs } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: CAT_SLUG } }).catch(() => {});
  });

  // --------------------------------------------------------------------------
  // Interaction 1: 1-Click Pay with Wallet (Success Path)
  // --------------------------------------------------------------------------
  it("F22 & F23: should pay order instantly with wallet balance, fulfill items and log ledger", async () => {
    // 1. Create order for 50,000 VND
    const order = await createOrder({
      userId: richUserId,
      customerEmail: "rich@gmail.com",
      items: [{ productId: keyProdId, quantity: 1 }],
    });
    expect(order.totalAmount).toBe(50000);

    // 2. Call pay-with-wallet API
    const payReq = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/pay-with-wallet`,
      {
        method: "POST",
        headers: {
          Cookie: `${USER_COOKIE_NAME}=${richUserToken}`,
        },
      }
    );

    const payRes = await payWithWalletRoute(payReq, {
      params: { orderCode: order.orderCode },
    });
    expect(payRes.status).toBe(200);
    const payData = await payRes.json();

    expect(payData.success).toBe(true);
    expect(payData.order.status).toBe("PAID");

    // 3. Verify user balance was deducted from 200,000 to 150,000 VND
    const updatedUser = await prisma.user.findUnique({ where: { id: richUserId } });
    expect(updatedUser?.balance).toBe(150000);

    // 4. Verify wallet transaction ledger created
    const ledger = await prisma.walletTransaction.findFirst({
      where: { userId: richUserId, referenceId: order.orderCode },
    });
    expect(ledger).toBeDefined();
    expect(ledger?.type).toBe(WalletTransactionType.ORDER_PAYMENT);
    expect(ledger?.amount).toBe(-50000);
    expect(ledger?.balanceBefore).toBe(200000);
    expect(ledger?.balanceAfter).toBe(150000);

    // 5. Verify reserved item is now SOLD
    const soldItem = await prisma.productItem.findFirst({
      where: { orderId: order.id },
    });
    expect(soldItem?.status).toBe(ItemStatus.SOLD);
  });

  // --------------------------------------------------------------------------
  // Interaction 2: Pay with Wallet (Insufficient Balance Rejection)
  // --------------------------------------------------------------------------
  it("F23: should reject payment when user wallet balance is insufficient", async () => {
    // Poor user has 10,000 VND, attempts to pay 50,000 VND order
    const order = await createOrder({
      userId: poorUserId,
      customerEmail: "poor@gmail.com",
      items: [{ productId: keyProdId, quantity: 1 }],
    });

    const payReq = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/pay-with-wallet`,
      {
        method: "POST",
        headers: {
          Cookie: `${USER_COOKIE_NAME}=${poorUserToken}`,
        },
      }
    );

    const payRes = await payWithWalletRoute(payReq, {
      params: { orderCode: order.orderCode },
    });
    expect(payRes.status).toBe(400);
    const payData = await payRes.json();

    expect(payData.success).toBe(false);
    expect(payData.message).toMatch(/(Số dư ví không đủ|không đủ để thanh toán)/i);

    // Verify order remains PENDING
    const dbOrder = await prisma.order.findUnique({ where: { orderCode: order.orderCode } });
    expect(dbOrder?.status).toBe(OrderStatus.PENDING);

    // Verify poor user balance remains intact
    const dbUser = await prisma.user.findUnique({ where: { id: poorUserId } });
    expect(dbUser?.balance).toBe(10000);
  });

  // --------------------------------------------------------------------------
  // Interaction 3: Affiliate Referral Attribution & Automatic Commission Ledger
  // --------------------------------------------------------------------------
  it("F14 & F22: should attribute order to affiliate coupon and credit commission upon payment", async () => {
    // 1. Register affUser as CTV
    const regResult = await registerAffiliate({
      userId: affUserId,
      customCode: "CTV_T3_SUPER",
      bankName: "Techcombank",
      bankAccountNumber: "1903338888",
      bankAccountName: "CTV TESTER",
    });
    expect(regResult.success).toBe(true);
    const couponCode = regResult.couponCode;

    // 2. Create customer order with the affiliate coupon
    const order = await createOrder({
      customerEmail: "referred_customer@gmail.com",
      couponCode,
      items: [{ productId: keyProdId, quantity: 1 }],
    });
    expect(order.couponId).toBeDefined();

    // 3. Trigger affiliate commission processing upon successful payment
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    const affResult = await processAffiliateCommission(order.id);
    expect(affResult.processed).toBe(true);

    // 4. Verify affiliate user balance increased
    const updatedAffUser = await prisma.user.findUnique({ where: { id: affUserId } });
    expect(updatedAffUser?.balance).toBeGreaterThan(0);
    expect(updatedAffUser?.totalCommission).toBeGreaterThan(0);
    expect(updatedAffUser?.totalAffOrders).toBe(1);

    // 5. Verify order isCommissionPaid is flagged
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.isCommissionPaid).toBe(true);

    // 6. Idempotency test: calling again must not double credit
    const secondCall = await processAffiliateCommission(order.id);
    expect(secondCall.processed).toBe(false);
    expect(secondCall.reason).toContain("already paid");
  });

  // --------------------------------------------------------------------------
  // Interaction 4: Variant Switching Dynamic Price & Stock Updates
  // --------------------------------------------------------------------------
  it("F9 & F12: should group multi-tier variants and support switching between $10, $50, $100 packages", () => {
    const rawVariants = [
      {
        id: "cdx-10",
        title: "API Codex AI- tốc độ nhanh (10$ Credit)",
        price: 22000,
        originalPrice: 28000,
        slug: "cdx-0055-10-credit",
        category: { slug: "ai-api", name: "API AI" },
        stockCount: 15,
      },
      {
        id: "cdx-50",
        title: "API Codex AI- tốc độ nhanh (50$ Credit)",
        price: 110000,
        originalPrice: 130000,
        slug: "cdx-0056-50-credit",
        category: { slug: "ai-api", name: "API AI" },
        stockCount: 8,
      },
      {
        id: "cdx-100",
        title: "API Codex AI- tốc độ nhanh (100$ Credit)",
        price: 220000,
        originalPrice: 260000,
        slug: "cdx-0057-100-credit",
        category: { slug: "ai-api", name: "API AI" },
        stockCount: 0, // Out of stock variant
      },
    ];

    const { items } = processSectionProducts(rawVariants);
    const codexCard = items.find((i) => i.groupKey === "codex");

    expect(codexCard).toBeDefined();
    expect(codexCard?.type).toBe("grouped");

    const variants = codexCard!.groupedData!.variants;
    expect(variants.length).toBe(3);

    // Variant 1 ($10): 22,000 VND, in stock
    const v10 = variants.find((v) => v.variantLabel === "$10");
    expect(v10?.price).toBe(22000);
    expect(v10?.stockCount).toBe(15);

    // Variant 2 ($50): 110,000 VND, in stock
    const v50 = variants.find((v) => v.variantLabel === "$50");
    expect(v50?.price).toBe(110000);
    expect(v50?.stockCount).toBe(8);

    // Variant 3 ($100): 220,000 VND, out of stock (0 stock)
    const v100 = variants.find((v) => v.variantLabel === "$100");
    expect(v100?.price).toBe(220000);
    expect(v100?.stockCount).toBe(0);

    // Switching between variants preserves accurate SKU mapping
    expect(v10?.slug).toBe("cdx-0055-10-credit");
    expect(v50?.slug).toBe("cdx-0056-50-credit");
    expect(v100?.slug).toBe("cdx-0057-100-credit");
  });
});
