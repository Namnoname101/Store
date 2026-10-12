import { describe, it, expect, afterAll } from "vitest";
import { prisma, TopupStatus } from "@/lib/prisma";

describe("Codex Database Schema & Prisma Client Tests", () => {
  const createdBindingIds: string[] = [];
  const createdOrderIds: string[] = [];
  const createdSnapshotIds: string[] = [];
  const createdUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup in reverse dependency order
    for (const id of createdOrderIds) {
      await prisma.creditTopupOrder.deleteMany({ where: { orderId: id } }).catch(() => {});
      await prisma.order.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdBindingIds) {
      await prisma.creditLedger.deleteMany({ where: { bindingId: id } }).catch(() => {});
      await prisma.creditTopupOrder.deleteMany({ where: { bindingId: id } }).catch(() => {});
      await prisma.customerApiKeyBinding.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdSnapshotIds) {
      await prisma.modelApiSyncSnapshot.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdUserIds) {
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
  });

  it("should have TopupStatus constants defined correctly", () => {
    expect(TopupStatus.PENDING).toBe("PENDING");
    expect(TopupStatus.PROCESSING).toBe("PROCESSING");
    expect(TopupStatus.COMPLETED).toBe("COMPLETED");
    expect(TopupStatus.RECONCILE_REQUIRED).toBe("RECONCILE_REQUIRED");
    expect(TopupStatus.FAILED).toBe("FAILED");
  });

  it("should create and query CustomerApiKeyBinding with User relation", async () => {
    const user = await prisma.user.create({
      data: {
        username: "codex_user_" + Date.now(),
        email: `codex_${Date.now()}@example.com`,
      },
    });
    createdUserIds.push(user.id);

    const testTokenId = Math.floor(100000 + Math.random() * 900000);
    const fingerprint = "fp_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        userId: user.id,
        upstreamTokenId: testTokenId,
        keyFingerprint: fingerprint,
        maskedKey: "sk-dtr...abc1",
        keyName: "Test Codex Key",
        status: "ACTIVE",
        totalCreditUsd: 10.5,
      },
      include: {
        user: true,
      },
    });
    createdBindingIds.push(binding.id);

    expect(binding.id).toBeDefined();
    expect(binding.userId).toBe(user.id);
    expect(binding.user?.email).toBe(user.email);
    expect(binding.upstreamTokenId).toBe(testTokenId);
    expect(binding.keyFingerprint).toBe(fingerprint);
    expect(binding.maskedKey).toBe("sk-dtr...abc1");
    expect(binding.totalCreditUsd).toBe(10.5);
    expect(binding.status).toBe("ACTIVE");

    // Verify User -> codexBindings relation
    const userWithBindings = await prisma.user.findUnique({
      where: { id: user.id },
      include: { codexBindings: true },
    });
    expect(userWithBindings?.codexBindings).toHaveLength(1);
    expect(userWithBindings?.codexBindings[0].id).toBe(binding.id);
  });

  it("should enforce unique constraint on upstreamTokenId and keyFingerprint", async () => {
    const testTokenId = Math.floor(100000 + Math.random() * 900000);
    const fingerprint = "fp_uniq_" + Date.now();

    const binding1 = await prisma.customerApiKeyBinding.create({
      data: {
        guestEmail: "guest@example.com",
        upstreamTokenId: testTokenId,
        keyFingerprint: fingerprint,
        maskedKey: "sk-abc...123",
      },
    });
    createdBindingIds.push(binding1.id);

    // Duplicate upstreamTokenId should fail
    await expect(
      prisma.customerApiKeyBinding.create({
        data: {
          guestEmail: "guest2@example.com",
          upstreamTokenId: testTokenId,
          keyFingerprint: "other_fp_" + Date.now(),
          maskedKey: "sk-other...456",
        },
      })
    ).rejects.toThrow();

    // Duplicate keyFingerprint should fail
    await expect(
      prisma.customerApiKeyBinding.create({
        data: {
          guestEmail: "guest3@example.com",
          upstreamTokenId: testTokenId + 1,
          keyFingerprint: fingerprint,
          maskedKey: "sk-other2...789",
        },
      })
    ).rejects.toThrow();
  });

  it("should create CreditTopupOrder linked with Order and CustomerApiKeyBinding", async () => {
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: Math.floor(100000 + Math.random() * 900000),
        keyFingerprint: "fp_order_" + Date.now(),
        maskedKey: "sk-ord...789",
      },
    });
    createdBindingIds.push(binding.id);

    const order = await prisma.order.create({
      data: {
        orderCode: "ORD_CODEX_" + Math.floor(100000 + Math.random() * 900000),
        totalAmount: 250000,
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    createdOrderIds.push(order.id);

    const topupOrder = await prisma.creditTopupOrder.create({
      data: {
        orderId: order.id,
        bindingId: binding.id,
        creditUsd: 10.0,
        quotaUnits: 5000000,
        status: TopupStatus.PENDING,
      },
      include: {
        order: true,
        binding: true,
      },
    });

    expect(topupOrder.id).toBeDefined();
    expect(topupOrder.orderId).toBe(order.id);
    expect(topupOrder.bindingId).toBe(binding.id);
    expect(topupOrder.creditUsd).toBe(10.0);
    expect(topupOrder.quotaUnits).toBe(5000000);
    expect(topupOrder.status).toBe("PENDING");
    expect(topupOrder.order.orderCode).toBe(order.orderCode);
    expect(topupOrder.binding.maskedKey).toBe("sk-ord...789");

    // Verify Order -> creditTopupOrder relation
    const orderWithTopup = await prisma.order.findUnique({
      where: { id: order.id },
      include: { creditTopupOrder: true },
    });
    expect(orderWithTopup?.creditTopupOrder?.id).toBe(topupOrder.id);
  });

  it("should create CreditLedger entries linked with CustomerApiKeyBinding", async () => {
    const tokenId = Math.floor(100000 + Math.random() * 900000);
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: tokenId,
        keyFingerprint: "fp_ledger_" + Date.now(),
        maskedKey: "sk-led...999",
      },
    });
    createdBindingIds.push(binding.id);

    const ledger = await prisma.creditLedger.create({
      data: {
        bindingId: binding.id,
        upstreamTokenId: tokenId,
        quotaBefore: 1000000,
        quotaAddedExpected: 5000000,
        quotaAfterReported: 6000000,
        discrepancyDelta: 0,
        performedBy: "SYSTEM",
        note: "Auto topup success",
      },
    });

    expect(ledger.id).toBeDefined();
    expect(ledger.bindingId).toBe(binding.id);
    expect(ledger.upstreamTokenId).toBe(tokenId);
    expect(ledger.quotaBefore).toBe(1000000);
    expect(ledger.quotaAddedExpected).toBe(5000000);
    expect(ledger.quotaAfterReported).toBe(6000000);
    expect(ledger.discrepancyDelta).toBe(0);
    expect(ledger.performedBy).toBe("SYSTEM");
  });

  it("should create ModelApiSyncSnapshot records", async () => {
    const snapshot = await prisma.modelApiSyncSnapshot.create({
      data: {
        sourceQuotaTotal: 500000000,
        sourceQuotaUsed: 120000000,
        sourceBalanceUsd: 250.75,
        totalCustomerObligationQuota: 45000000,
        status: "HEALTHY",
      },
    });
    createdSnapshotIds.push(snapshot.id);

    expect(snapshot.id).toBeDefined();
    expect(snapshot.sourceQuotaTotal).toBe(500000000);
    expect(snapshot.sourceQuotaUsed).toBe(120000000);
    expect(snapshot.sourceBalanceUsd).toBe(250.75);
    expect(snapshot.totalCustomerObligationQuota).toBe(45000000);
    expect(snapshot.status).toBe("HEALTHY");
  });
});
