import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { POST as verifyKeyHandler } from "@/app/api/codex/verify-key/route";
import { POST as checkoutHandler } from "@/app/api/codex/checkout/route";
import { POST as webhookHandler } from "@/app/api/webhooks/payment/route";
import { GET as developerUsageHandler } from "@/app/api/developer/usage/route";
import { POST as adminSnapshotHandler } from "@/app/api/admin/codex/snapshot/route";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { NextRequest } from "next/server";

describe("E2E Integration: Codex Credit & API Usage Full Lifecycle Flow", () => {
  const customerApiKey = "sk-e2e-codex-customer-token-123456";
  const upstreamTokenId = 555888;
  let testBindingId: string;
  let createdOrderCode: string | null = null;
  let createdOrderId: string | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    if (createdOrderId) {
      await prisma.productItem.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {});
      await prisma.creditTopupOrder.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {});
      await prisma.paymentTransaction.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {});
      await prisma.paymentIntent.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: createdOrderId } }).catch(() => {});
    }
    if (testBindingId) {
      await prisma.creditLedger.deleteMany({ where: { bindingId: testBindingId } }).catch(() => {});
      await prisma.customerApiKeyBinding.delete({ where: { id: testBindingId } }).catch(() => {});
    }
    await prisma.modelApiSyncSnapshot.deleteMany({}).catch(() => {});
  });

  it("should execute the complete lifecycle: Verify -> Order -> VietQR Webhook -> Auto Topup -> Developer Usage -> Admin Audit", async () => {
    // -------------------------------------------------------------
    // STEP 1: Customer Verifies Key at Storefront
    // -------------------------------------------------------------
    vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValue({
      valid: true,
      tokenId: upstreamTokenId,
      name: "E2E Dev Key",
      remainQuota: 1000000,
    });

    const verifyReq = new NextRequest("http://localhost:3000/api/codex/verify-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: customerApiKey,
        email: "e2e_customer@gmail.com",
      }),
    });

    const verifyRes = await verifyKeyHandler(verifyReq);
    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();

    expect(verifyData.valid).toBe(true);
    expect(verifyData.bindingId).toBeDefined();
    expect(verifyData.maskedKey).toBe("sk-e2e-...3456");
    expect(verifyData.keyName).toBe("E2E Dev Key");
    testBindingId = verifyData.bindingId;

    // -------------------------------------------------------------
    // STEP 2: Customer Selects $10 Package and Submits Checkout
    // -------------------------------------------------------------
    const checkoutReq = new NextRequest("http://localhost:3000/api/codex/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bindingId: testBindingId,
        packageId: "codex-10",
        email: "e2e_customer@gmail.com",
        customerNote: "Nạp tự động kiểm thử E2E",
      }),
    });

    const checkoutRes = await checkoutHandler(checkoutReq);
    expect(checkoutRes.status).toBe(201);
    const checkoutData = await checkoutRes.json();

    expect(checkoutData.success).toBe(true);
    expect(checkoutData.orderCode).toMatch(/^ORD/);
    expect(checkoutData.totalAmount).toBe(12000);
    expect(checkoutData.vietQrUrl).toContain("https://img.vietqr.io");
    createdOrderCode = checkoutData.orderCode;

    // Verify order in database is in PENDING state
    const orderBeforePay = await prisma.order.findUnique({
      where: { orderCode: createdOrderCode! },
      include: { creditTopupOrder: true },
    });
    expect(orderBeforePay).toBeDefined();
    createdOrderId = orderBeforePay!.id;
    expect(orderBeforePay!.status).toBe("PENDING");
    expect(orderBeforePay!.creditTopupOrder?.status).toBe("PENDING");

    // -------------------------------------------------------------
    // STEP 3: Bank Webhook arrives confirming VietQR payment
    // -------------------------------------------------------------
    vi.spyOn(ModelApiService, "applyQuotaTopup").mockResolvedValue({
      success: true,
      quotaBefore: 1000000,
      quotaAdded: 5000000,
      quotaAfter: 6000000,
      discrepancyDelta: 0,
    });

    const webhookPayload = {
      transactionId: `TX_E2E_${Date.now()}`,
      amount: checkoutData.totalAmount,
      content: `Chuyen tien ${createdOrderCode}`,
      bankCode: "MB",
    };

    const webhookReq = new NextRequest("http://localhost:3000/api/webhooks/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    const webhookRes = await webhookHandler(webhookReq);
    expect(webhookRes.status).toBe(200);
    const webhookData = await webhookRes.json();
    expect(webhookData.success).toBe(true);

    // -------------------------------------------------------------
    // STEP 4: Verify Order & Topup Status transitioned to COMPLETED
    // -------------------------------------------------------------
    const orderAfterPay = await prisma.order.findUnique({
      where: { id: createdOrderId! },
      include: {
        creditTopupOrder: true,
        deliveredItems: true,
      },
    });

    expect(orderAfterPay!.status).toBe("PAID");
    expect(orderAfterPay!.upstreamStatus).toBe("COMPLETED");
    expect(orderAfterPay!.creditTopupOrder?.status).toBe("COMPLETED");
    expect(orderAfterPay!.creditTopupOrder?.completedAt).toBeDefined();
    expect(orderAfterPay!.deliveredItems.length).toBe(1);
    expect(orderAfterPay!.deliveredItems[0].secretContent).toContain(orderBeforePay!.creditTopupOrder!.creditUsd.toString());

    // -------------------------------------------------------------
    // STEP 5: Developer Checks Real-time Usage on Dashboard
    // -------------------------------------------------------------
    vi.spyOn(ModelApiService, "fetchTokenUsage").mockResolvedValue({
      success: true,
      data: {
        quota: 6000000,
        used_quota: 200000,
      },
    });

    const usageReq = new NextRequest("http://localhost:3000/api/developer/usage", {
      method: "GET",
      headers: { "x-api-key": customerApiKey },
    });

    const usageRes = await developerUsageHandler(usageReq);
    expect(usageRes.status).toBe(200);
    const usageData = await usageRes.json();

    expect(usageData.success).toBe(true);
    expect(usageData.quota).toBe(6000000);
    expect(usageData.balanceUsd).toBe(12); // 6,000,000 / 500,000 = $12
    expect(usageData.status).toBe("ACTIVE");

    // -------------------------------------------------------------
    // STEP 6: Admin Triggers ModelAPI Snapshot Audit
    // -------------------------------------------------------------
    vi.spyOn(ModelApiService, "fetchSourceBalance").mockResolvedValue({
      success: true,
      quota: 50000000, // 50M quota upstream
      usedQuota: 5000000,
      balanceUsd: 100.0,
    });

    const adminSnapshotReq = new NextRequest("http://localhost:3000/api/admin/codex/snapshot", {
      method: "POST",
    });

    const adminRes = await adminSnapshotHandler(adminSnapshotReq);
    expect(adminRes.status).toBe(200);
    const adminData = await adminRes.json();

    expect(adminData.success).toBe(true);
    expect(adminData.snapshot.sourceQuotaTotal).toBe(50000000);
    expect(adminData.snapshot.status).toBe("HEALTHY");
  });
});
