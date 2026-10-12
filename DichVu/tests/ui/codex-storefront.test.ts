import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { POST as codexCheckoutHandler, CODEX_PACKAGES } from "@/app/api/codex/checkout/route";
import { NextRequest } from "next/server";

describe("Codex Credit Storefront & Checkout API Tests", () => {
  let testBindingId: string;
  let createdOrderIds: string[] = [];

  beforeEach(async () => {
    // Setup a verified CustomerApiKeyBinding
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: 777123,
        keyFingerprint: `test_fp_store_${Date.now()}`,
        maskedKey: "sk-store...9999",
        keyName: "Storefront Test Key",
        status: "ACTIVE",
      },
    });
    testBindingId = binding.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const orderId of createdOrderIds) {
      await prisma.productItem.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.creditTopupOrder.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
    }
    createdOrderIds = [];
    if (testBindingId) {
      await prisma.customerApiKeyBinding.delete({ where: { id: testBindingId } }).catch(() => {});
    }
  });

  it("should export 5 standard credit packages with correct USD and quota points", () => {
    expect(CODEX_PACKAGES.length).toBe(5);
    const amounts = CODEX_PACKAGES.map((p) => p.creditUsd);
    expect(amounts).toEqual([5, 10, 20, 50, 100]);

    // Check 10 USD package: 5M quota
    const p10 = CODEX_PACKAGES.find((p) => p.creditUsd === 10);
    expect(p10?.quotaUnits).toBe(5000000);
    expect(p10?.popular).toBe(true);
  });

  it("should reject checkout if bindingId is missing or invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/codex/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bindingId: "non-existent-binding-id",
        packageId: "codex-10",
      }),
    });

    const res = await codexCheckoutHandler(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("API Key");
  });

  it("should reject checkout if packageId is not recognized", async () => {
    const req = new NextRequest("http://localhost:3000/api/codex/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bindingId: testBindingId,
        packageId: "invalid-pkg-999",
      }),
    });

    const res = await codexCheckoutHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("gói");
  });

  it("should create order, creditTopupOrder, and return VietQR checkout details", async () => {
    const req = new NextRequest("http://localhost:3000/api/codex/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bindingId: testBindingId,
        packageId: "codex-10",
        email: "testcustomer@gmail.com",
        customerNote: "Nạp credit codex gấp",
      }),
    });

    const res = await codexCheckoutHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.orderCode).toMatch(/^ORD/);
    expect(data.vietQrUrl).toContain("https://img.vietqr.io");
    expect(data.totalAmount).toBe(245000);
    expect(data.creditUsd).toBe(10);
    expect(data.quotaUnits).toBe(5000000);

    // Verify DB records
    const order = await prisma.order.findUnique({
      where: { orderCode: data.orderCode },
      include: {
        creditTopupOrder: true,
        orderItems: true,
      },
    });
    expect(order).toBeDefined();
    if (order) {
      createdOrderIds.push(order.id);
      expect(order.creditTopupOrder).toBeDefined();
      expect(order.creditTopupOrder?.status).toBe("PENDING");
      expect(order.creditTopupOrder?.creditUsd).toBe(10);
      expect(order.creditTopupOrder?.quotaUnits).toBe(5000000);
      expect(order.creditTopupOrder?.bindingId).toBe(testBindingId);
      expect(order.orderItems.length).toBe(1);
    }
  });
});
