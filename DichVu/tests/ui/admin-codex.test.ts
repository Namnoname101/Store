import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { GET as snapshotHandler, POST as triggerSnapshotHandler } from "@/app/api/admin/codex/snapshot/route";
import { GET as bindingsHandler } from "@/app/api/admin/codex/bindings/route";
import { GET as reconcileHandler, POST as retryReconcileHandler } from "@/app/api/admin/codex/reconcile/route";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { NextRequest } from "next/server";

describe("Admin Codex Oversight & Upstream Balance API Tests", () => {
  let testBindingId: string;
  let testOrderId: string;
  let testTopupOrderId: string;

  beforeEach(async () => {
    // 1. Create a customer binding
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: 999123,
        keyFingerprint: `test_admin_fp_${Date.now()}`,
        maskedKey: "sk-admin...1234",
        keyName: "Admin Test Key",
        status: "ACTIVE",
        totalCreditUsd: 10,
      },
    });
    testBindingId = binding.id;

    // 2. Create an order with RECONCILE_REQUIRED topup order
    const order = await prisma.order.create({
      data: {
        orderCode: `ORD_REC_${Date.now()}`,
        totalAmount: 245000,
        status: "PAID",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        upstreamStatus: "FAILED",
        upstreamError: "Upstream timeout test",
      },
    });
    testOrderId = order.id;

    const topup = await prisma.creditTopupOrder.create({
      data: {
        orderId: order.id,
        bindingId: binding.id,
        creditUsd: 10,
        quotaUnits: 5000000,
        status: "RECONCILE_REQUIRED",
        errorMessage: "Upstream timeout test",
      },
    });
    testTopupOrderId = topup.id;

    // 3. Create a CreditLedger entry with discrepancyDelta
    await prisma.creditLedger.create({
      data: {
        bindingId: binding.id,
        topupOrderId: topup.id,
        upstreamTokenId: binding.upstreamTokenId,
        quotaBefore: 1000000,
        quotaAddedExpected: 5000000,
        quotaAfterReported: 5980000,
        discrepancyDelta: -20000,
        performedBy: "SYSTEM",
        note: "AI consumed 20,000 tokens during topup",
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (testOrderId) {
      await prisma.creditTopupOrder.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: testOrderId } }).catch(() => {});
    }
    if (testBindingId) {
      await prisma.creditLedger.deleteMany({ where: { bindingId: testBindingId } }).catch(() => {});
      await prisma.customerApiKeyBinding.delete({ where: { id: testBindingId } }).catch(() => {});
    }
    await prisma.modelApiSyncSnapshot.deleteMany({}).catch(() => {});
  });

  it("should fetch upstream source balance and save sync snapshot", async () => {
    vi.spyOn(ModelApiService, "fetchSourceBalance").mockResolvedValue({
      success: true,
      quota: 10000000,
      usedQuota: 2000000,
      balanceUsd: 20.0,
    });

    const req = new NextRequest("http://localhost:3000/api/admin/codex/snapshot", {
      method: "POST",
    });

    const res = await triggerSnapshotHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.snapshot).toBeDefined();
    expect(data.snapshot.sourceQuotaTotal).toBe(10000000);
    expect(data.snapshot.sourceBalanceUsd).toBe(20.0);
    expect(["HEALTHY", "WARNING_LOW_BALANCE", "CRITICAL"]).toContain(data.snapshot.status);

    // Verify snapshot persisted to DB
    const persisted = await prisma.modelApiSyncSnapshot.findFirst({
      orderBy: { createdAt: "desc" },
    });
    expect(persisted).toBeDefined();
    expect(persisted?.sourceBalanceUsd).toBe(20.0);
  });

  it("should return customer key bindings with aggregated statistics", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/codex/bindings", {
      method: "GET",
    });

    const res = await bindingsHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.bindings)).toBe(true);
    expect(data.bindings.length).toBeGreaterThanOrEqual(1);
    const found = data.bindings.find((b: any) => b.id === testBindingId);
    expect(found).toBeDefined();
    expect(found.maskedKey).toBe("sk-admin...1234");
    expect(found.totalCreditUsd).toBe(10);
  });

  it("should return reconcile required orders and ledger discrepancies", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/codex/reconcile", {
      method: "GET",
    });

    const res = await reconcileHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.reconcileRequiredOrders)).toBe(true);
    expect(Array.isArray(data.ledgerDiscrepancies)).toBe(true);

    const foundOrder = data.reconcileRequiredOrders.find((o: any) => o.id === testOrderId);
    expect(foundOrder).toBeDefined();

    const foundDiscrepancy = data.ledgerDiscrepancies.find(
      (l: any) => l.bindingId === testBindingId
    );
    expect(foundDiscrepancy).toBeDefined();
    expect(foundDiscrepancy.discrepancyDelta).toBe(-20000);
  });

  it("should allow admin to retry a reconcile-required order", async () => {
    vi.spyOn(ModelApiService, "applyQuotaTopup").mockResolvedValue({
      success: true,
      quotaBefore: 1000000,
      quotaAdded: 5000000,
      quotaAfter: 6000000,
      discrepancyDelta: 0,
    });

    const req = new NextRequest("http://localhost:3000/api/admin/codex/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: testOrderId }),
    });

    const res = await retryReconcileHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.status).toBe("COMPLETED");

    // Verify DB updated
    const updatedTopup = await prisma.creditTopupOrder.findUnique({
      where: { id: testTopupOrderId },
    });
    expect(updatedTopup?.status).toBe("COMPLETED");
  });
});
