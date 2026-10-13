import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import {
  fulfillCodexCreditOrder,
  retryCodexCreditOrder,
} from "@/services/codex-fulfillment.service";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";

describe("Codex Auto-Fulfillment Pipeline Tests", () => {
  let testCategoryId: string;
  let testProductId: string;
  let testBindingId: string;
  let testOrderId: string;
  let testTopupOrderId: string;

  beforeEach(async () => {
    // 1. Setup category & product
    const category = await prisma.category.create({
      data: {
        name: "Test Codex Category",
        slug: `test-cat-${Date.now()}`,
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "Test Codex $10 Credit",
        slug: `test-codex-${Date.now()}`,
        description: "Test product description",
        categoryId: category.id,
        price: 250000,
        type: "CODEX_CREDIT",
        fulfillmentType: "LOCAL_STOCK",
      },
    });
    testProductId = product.id;

    // 2. Setup CustomerApiKeyBinding
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: Math.floor(100000 + Math.random() * 900000),
        keyFingerprint: `test_fp_${Date.now()}_${Math.random()}`,
        maskedKey: "sk-test...1234",
        keyName: "Test Auto Key",
        status: "ACTIVE",
      },
    });
    testBindingId = binding.id;

    // 3. Setup Order
    const order = await prisma.order.create({
      data: {
        orderCode: `ORD${Date.now()}`,
        totalAmount: 250000,
        status: "PAID",
        paidAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        upstreamStatus: "NOT_APPLICABLE",
        orderItems: {
          create: {
            productId: product.id,
            price: product.price,
            quantity: 1,
          },
        },
      },
    });
    testOrderId = order.id;

    // 4. Setup CreditTopupOrder in PENDING
    const topupOrder = await prisma.creditTopupOrder.create({
      data: {
        orderId: order.id,
        bindingId: binding.id,
        creditUsd: 10,
        quotaUnits: 5000000,
        status: "PENDING",
      },
    });
    testTopupOrderId = topupOrder.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Cleanup
    if (testOrderId) {
      await prisma.productItem.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
      await prisma.creditTopupOrder.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: testOrderId } }).catch(() => {});
    }
    if (testBindingId) {
      await prisma.creditLedger.deleteMany({ where: { bindingId: testBindingId } }).catch(() => {});
      await prisma.customerApiKeyBinding.deleteMany({ where: { id: testBindingId } }).catch(() => {});
    }
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } }).catch(() => {});
    }
    if (testCategoryId) {
      await prisma.category.deleteMany({ where: { id: testCategoryId } }).catch(() => {});
    }
  });

  it("should fulfill a PENDING credit topup order successfully and update states", async () => {
    // Mock ModelApiService.applyQuotaTopup to succeed
    vi.spyOn(ModelApiService, "applyQuotaTopup").mockResolvedValue({
      success: true,
      quotaBefore: 1000000,
      quotaAdded: 5000000,
      quotaAfter: 6000000,
      discrepancyDelta: 0,
    });

    const result = await fulfillCodexCreditOrder(testOrderId);

    expect(result.success).toBe(true);
    expect(result.status).toBe("COMPLETED");

    // Verify CreditTopupOrder updated
    const updatedTopup = await prisma.creditTopupOrder.findUnique({
      where: { id: testTopupOrderId },
    });
    expect(updatedTopup?.status).toBe("COMPLETED");
    expect(updatedTopup?.completedAt).toBeDefined();

    // Verify Order updated
    const updatedOrder = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { deliveredItems: true },
    });
    expect(updatedOrder?.upstreamStatus).toBe("COMPLETED");
    expect(updatedOrder?.deliveredItems.length).toBe(1);
    expect(updatedOrder?.deliveredItems[0].secretContent).toContain("sk-test...1234");
  });

  it("should prevent duplicate fulfillment via atomic concurrency lock", async () => {
    let callCount = 0;
    vi.spyOn(ModelApiService, "applyQuotaTopup").mockImplementation(async () => {
      callCount++;
      // Simulate delay
      await new Promise((r) => setTimeout(r, 50));
      return {
        success: true,
        quotaBefore: 1000000,
        quotaAdded: 5000000,
        quotaAfter: 6000000,
        discrepancyDelta: 0,
      };
    });

    // Execute concurrently twice
    const [res1, res2] = await Promise.all([
      fulfillCodexCreditOrder(testOrderId),
      fulfillCodexCreditOrder(testOrderId),
    ]);

    // Only one should have executed the topup
    expect(callCount).toBe(1);
    const successCount = [res1, res2].filter((r) => r.success).length;
    expect(successCount).toBeGreaterThanOrEqual(1);
  });

  it("should handle upstream network failure and transition to RECONCILE_REQUIRED", async () => {
    vi.spyOn(ModelApiService, "applyQuotaTopup").mockResolvedValue({
      success: false,
      quotaBefore: 1000000,
      quotaAdded: 5000000,
      quotaAfter: 0,
      error: "Upstream timeout after PUT request",
      discrepancyDelta: 0,
    });

    const result = await fulfillCodexCreditOrder(testOrderId);

    expect(result.success).toBe(false);
    expect(result.status).toBe("RECONCILE_REQUIRED");

    // Verify CreditTopupOrder
    const updatedTopup = await prisma.creditTopupOrder.findUnique({
      where: { id: testTopupOrderId },
    });
    expect(updatedTopup?.status).toBe("RECONCILE_REQUIRED");
    expect(updatedTopup?.errorMessage).toContain("Upstream timeout");

    // Verify Order marked FAILED for upstreamStatus
    const updatedOrder = await prisma.order.findUnique({
      where: { id: testOrderId },
    });
    expect(updatedOrder?.upstreamStatus).toBe("FAILED");

    // Verify AuditLog record written
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: testOrderId, action: "CODEX_TOPUP_FAILED" },
    });
    expect(auditLog).toBeDefined();
  });

  it("should allow manual retryCodexCreditOrder when in FAILED or RECONCILE_REQUIRED status", async () => {
    // Put topup in FAILED status first
    await prisma.creditTopupOrder.update({
      where: { id: testTopupOrderId },
      data: { status: "FAILED", errorMessage: "Previous upstream 500 error" },
    });

    vi.spyOn(ModelApiService, "applyQuotaTopup").mockResolvedValue({
      success: true,
      quotaBefore: 1000000,
      quotaAdded: 5000000,
      quotaAfter: 6000000,
      discrepancyDelta: 0,
    });

    const retryResult = await retryCodexCreditOrder(testOrderId);

    expect(retryResult.success).toBe(true);
    expect(retryResult.status).toBe("COMPLETED");

    const updatedTopup = await prisma.creditTopupOrder.findUnique({
      where: { id: testTopupOrderId },
    });
    expect(updatedTopup?.status).toBe("COMPLETED");
    expect(updatedTopup?.retryCount).toBe(1);
  });

  it("should buy product from GenzShop and redeem into ModelAPI master account if GenzShop is active", async () => {
    // 1. Create active GenzShop supplier
    const genzSupplier = await prisma.supplier.create({
      data: {
        code: `GENZSHOP_TEST_${Date.now()}`,
        name: "Test GenzShop",
        type: "GENZSHOP",
        baseUrl: "https://genzshop.vn/api/partner/v1",
        apiKey: "gzsk_test_mock_key_123",
        isActive: true,
      },
    });

    try {
      const adapter = getSupplierAdapter("GENZSHOP");
      const buySpy = vi.spyOn(adapter, "buyProduct").mockResolvedValue({
        success: true,
        deliveredKeys: ["CARD_GENZ_TOPUP_MOCK_XYZ"],
      });

      const redeemSpy = vi.spyOn(ModelApiService, "redeemMasterAccount").mockResolvedValue({
        success: true,
        message: "Nạp thành công",
        quota: 10000000,
      });

      const topupSpy = vi.spyOn(ModelApiService, "applyQuotaTopup").mockResolvedValue({
        success: true,
        quotaBefore: 1000000,
        quotaAdded: 5000000,
        quotaAfter: 6000000,
        discrepancyDelta: 0,
      });

      const result = await fulfillCodexCreditOrder(testOrderId);

      expect(result.success).toBe(true);
      expect(buySpy).toHaveBeenCalledWith(
        expect.anything(),
        "CDX-0055",
        1,
        expect.any(String)
      );
      expect(redeemSpy).toHaveBeenCalledWith("CARD_GENZ_TOPUP_MOCK_XYZ");
      expect(topupSpy).toHaveBeenCalled();
    } finally {
      await prisma.supplier.delete({ where: { id: genzSupplier.id } }).catch(() => {});
    }
  });
});
