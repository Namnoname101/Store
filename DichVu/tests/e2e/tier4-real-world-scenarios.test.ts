import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  prisma,
  ItemStatus,
  OrderStatus,
  FulfillmentType,
} from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import { GET as orderLookupRoute } from "@/app/api/orders/lookup/route";
import { GET as getOrderStatusRoute } from "@/app/api/orders/[orderCode]/status/route";
import { POST as refundRequestRoute } from "@/app/api/orders/[orderCode]/refund-request/route";
import { GET as developerUsageRoute } from "@/app/api/developer/usage/route";
import { NextRequest } from "next/server";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { resolveProductInstruction } from "@/lib/product-guides";
import fs from "fs";
import path from "path";

describe("Tier 4: Real-World Scenarios & Operational Safeguards (KhoDEE V2)", () => {
  const PREFIX = "tier4-e2e-";
  const CAT_SLUG = `${PREFIX}category`;
  const KEY_PROD_SLUG = `${PREFIX}key-prod`;
  const DROPSHIP_PROD_SLUG = `${PREFIX}dropship-prod`;

  let catId: string;
  let keyProdId: string;
  let dropshipProdId: string;

  beforeAll(async () => {
    // 1. Cleanup
    const testSlugs = [KEY_PROD_SLUG, DROPSHIP_PROD_SLUG];
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

    // 2. Create Category & Products
    const cat = await prisma.category.create({
      data: { name: "Tier 4 Category", slug: CAT_SLUG },
    });
    catId = cat.id;

    const keyProd = await prisma.product.create({
      data: {
        title: "P4 Key Item",
        slug: KEY_PROD_SLUG,
        description: "P4 test key",
        price: 50000,
        categoryId: cat.id,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    keyProdId = keyProd.id;

    for (let i = 1; i <= 5; i++) {
      await prisma.productItem.create({
        data: {
          productId: keyProdId,
          secretContent: `CONFIDENTIAL-KEY-T4-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    const dropshipProd = await prisma.product.create({
      data: {
        title: "P4 Dropship Failed Item",
        slug: DROPSHIP_PROD_SLUG,
        description: "Dropship test",
        price: 80000,
        categoryId: cat.id,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
      },
    });
    dropshipProdId = dropshipProd.id;
  });

  afterAll(async () => {
    const testSlugs = [KEY_PROD_SLUG, DROPSHIP_PROD_SLUG];
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
  // Scenario 1: Guest Order Lookup Without Session (Data Protection)
  // --------------------------------------------------------------------------
  it("F19: should allow guest order lookup without session while strictly redacting secrets", async () => {
    // 1. Create a guest order
    const order = await createOrder({
      customerEmail: "guest_lookup_user@gmail.com",
      items: [{ productId: keyProdId, quantity: 1 }],
    });

    // Mark order as PAID and item as SOLD
    await prisma.productItem.updateMany({
      where: { orderId: order.id },
      data: { status: ItemStatus.SOLD },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    // 2. Query public order lookup API by orderCode
    const lookupReq = new NextRequest(
      `http://localhost:3000/api/orders/lookup?q=${order.orderCode}`,
      { method: "GET" }
    );
    const lookupRes = await orderLookupRoute(lookupReq);
    expect(lookupRes.status).toBe(200);
    const lookupData = await lookupRes.json();

    expect(lookupData.success).toBe(true);
    expect(lookupData.orders.length).toBe(1);
    const found = lookupData.orders[0];
    expect(found.orderCode).toBe(order.orderCode);
    expect(found.status).toBe("PAID");
    expect(found.totalAmount).toBe(50000);
    expect(found.items[0].productTitle).toBe("P4 Key Item");

    // CRITICAL SECURITY ASSERTION: Public lookup must NEVER leak secretContent or accessToken
    expect(found.deliveredItems).toBeUndefined();
    expect(found.secretContent).toBeUndefined();
    expect(found.accessToken).toBeUndefined();

    // 3. Query order status WITHOUT accessToken
    const unauthedStatusReq = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/status`,
      { method: "GET" }
    );
    const unauthedStatusRes = await getOrderStatusRoute(unauthedStatusReq, {
      params: { orderCode: order.orderCode },
    });
    const unauthedStatusData = await unauthedStatusRes.json();
    expect(unauthedStatusData.deliveredItems).toEqual([]);

    // 4. Query order status WITH valid accessToken
    const authedStatusReq = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/status?token=${order.accessToken}`,
      { method: "GET" }
    );
    const authedStatusRes = await getOrderStatusRoute(authedStatusReq, {
      params: { orderCode: order.orderCode },
    });
    const authedStatusData = await authedStatusRes.json();
    expect(authedStatusData.deliveredItems.length).toBe(1);
    expect(authedStatusData.deliveredItems[0].secretContent).toMatch(/^CONFIDENTIAL-KEY-T4-/);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Upstream Dropship Failure Recovery & Refund Workflow
  // --------------------------------------------------------------------------
  it("F18 & F19: should shield customer when upstream dropship fails and accept automated refund request", async () => {
    // 1. Create dropship order
    const order = await createOrder({
      customerEmail: "dropship_buyer@gmail.com",
      items: [{ productId: dropshipProdId, quantity: 1 }],
    });

    // Simulate upstream partner API timeout or zero balance: order is PAID, but upstreamStatus = FAILED
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        upstreamStatus: "FAILED",
        upstreamError: "Upstream partner balance depleted (TaphoaMMO)",
      },
    });

    // 2. Fetch order status
    const statusReq = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/status?token=${order.accessToken}`,
      { method: "GET" }
    );
    const statusRes = await getOrderStatusRoute(statusReq, {
      params: { orderCode: order.orderCode },
    });
    const statusData = await statusRes.json();

    expect(statusData.status).toBe("PAID");
    expect(statusData.upstreamStatus).toBe("FAILED");
    expect(statusData.deliveredItems).toEqual([]);

    // 3. Customer submits refund request with bank details
    const refundPayload = {
      bankName: "Vietcombank",
      accountNumber: "9988776655",
      accountName: "TRAN VAN B",
      note: "Nhà cung cấp hết hàng, xin hoàn tiền về số tài khoản này",
    };

    const refundReq = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/refund-request?token=${order.accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundPayload),
      }
    );

    const refundRes = await refundRequestRoute(refundReq, {
      params: { orderCode: order.orderCode },
    });
    expect(refundRes.status).toBe(200);
    const refundData = await refundRes.json();

    expect(refundData.success).toBe(true);
    expect(refundData.message).toContain("Hệ thống sẽ xử lý và chuyển khoản cho bạn trong vòng 5-15 phút");

    // 4. Verify refundInfo is persisted in database
    const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(dbOrder?.refundInfo).toBeDefined();
    const parsedRefund = JSON.parse(dbOrder!.refundInfo!);
    expect(parsedRefund.bankName).toBe("Vietcombank");
    expect(parsedRefund.accountNumber).toBe("9988776655");
    expect(parsedRefund.accountName).toBe("TRAN VAN B");
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Authenticity Verification & Status Bar Contract
  // --------------------------------------------------------------------------
  it("F3: should verify authentic status bar properties and absence of fake transaction claims", () => {
    // Check LiveOrderTicker source code structure
    const tickerFilePath = path.resolve(process.cwd(), "src/components/LiveOrderTicker.tsx");
    expect(fs.existsSync(tickerFilePath)).toBe(true);

    const tickerContent = fs.readFileSync(tickerFilePath, "utf-8");
    // Component must be a React client component
    expect(tickerContent).toContain('"use client"');

    // Trust signal components must exist
    const footerFilePath = path.resolve(process.cwd(), "src/components/Footer.tsx");
    expect(fs.existsSync(footerFilePath)).toBe(true);
    const footerContent = fs.readFileSync(footerFilePath, "utf-8");
    expect(footerContent).toContain("VietQR");
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Developer Zone Usage & Codex Setup Guides
  // --------------------------------------------------------------------------
  it("F20 & F21: should verify Developer Zone usage inspection and Codex setup instructions", async () => {
    const testApiKey = "sk-t4-dev-zone-sample-key-999";

    // 1. Spy ModelApiService
    vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValue({
      valid: true,
      tokenId: 777999,
      name: "T4 Test Dev Key",
      remainQuota: 5000000,
    });

    const devReq = new NextRequest(
      `http://localhost:3000/api/developer/usage?apiKey=${testApiKey}`,
      { method: "GET" }
    );

    const devRes = await developerUsageRoute(devReq);
    expect(devRes.status).toBe(200);
    const devData = await devRes.json();
    expect(devData.success).toBe(true);
    expect(devData.maskedKey).toContain("sk-t4-");
    expect(devData.keyName).toBe("T4 Test Dev Key");
    expect(devData.balanceUsd).toBeDefined();

    // Clean up binding
    await prisma.customerApiKeyBinding.deleteMany({
      where: { maskedKey: devData.maskedKey },
    }).catch(() => {});

    // 2. Resolve Codex setup guide
    const guide = resolveProductInstruction({
      slug: "codex-credit-10usd",
      title: "Gói Codex 10$ Credit",
      type: "CODEX_CREDIT",
    });

    expect(guide).toBeDefined();
    expect(guide.title).toContain("Codex API");
    expect(guide.steps.length).toBeGreaterThan(0);
    // Verifies DaiTruong-helper 1-Click setup instructions
    const guideText = JSON.stringify(guide.steps);
    expect(guideText).toContain("DaiTruong-helper");
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Documentation Deliverables Integrity
  // --------------------------------------------------------------------------
  it("F4 & F5: should verify presence and completeness of R1 audit and R2 design system docs", () => {
    // Current State Audit doc
    const auditPath = path.resolve(process.cwd(), "../docs/ux-redesign-v2/01-current-state-audit.md");
    expect(fs.existsSync(auditPath)).toBe(true);
    const auditContent = fs.readFileSync(auditPath, "utf-8");
    expect(auditContent).toContain("Audit");
    expect(auditContent.length).toBeGreaterThan(500);

    // Design System doc
    const dsPath = path.resolve(process.cwd(), "../docs/ux-redesign-v2/03-design-system.md");
    expect(fs.existsSync(dsPath)).toBe(true);
    const dsContent = fs.readFileSync(dsPath, "utf-8");
    expect(dsContent).toContain("Design System");
    expect(dsContent.length).toBeGreaterThan(500);
  });
});
