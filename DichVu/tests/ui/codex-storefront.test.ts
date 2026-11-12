import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { POST as codexCheckoutHandler } from "@/app/api/codex/checkout/route";
import { CODEX_PACKAGES } from "@/lib/codex.constants";
import * as UserAuth from "@/lib/user-auth";
import { NextRequest } from "next/server";

describe("Codex Credit Storefront & Checkout API Tests", () => {
  let testBindingId: string;
  let testUserId: string;
  let createdOrderIds: string[] = [];

  beforeEach(async () => {
    // 0. Setup a test User
    const user = await prisma.user.create({
      data: {
        username: `test_codex_user_${Date.now()}`,
        email: `test_codex_${Date.now()}@gmail.com`,
        role: "CUSTOMER",
      },
    });
    testUserId = user.id;

    // Setup a verified CustomerApiKeyBinding
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: 777123,
        keyFingerprint: `test_fp_store_${Date.now()}`,
        maskedKey: "sk-store...9999",
        keyName: "Storefront Test Key",
        status: "ACTIVE",
        userId: testUserId,
      },
    });
    testBindingId = binding.id;

    vi.spyOn(UserAuth, "getAuthenticatedUser").mockResolvedValue({
      userId: testUserId,
      username: user.username || "testcustomer",
      role: "CUSTOMER",
      exp: Date.now() + 100000,
    });
    vi.spyOn(UserAuth, "getUserSession").mockResolvedValue({
      userId: testUserId,
      username: user.username || "testcustomer",
      role: "CUSTOMER",
      exp: Date.now() + 100000,
    });
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
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it("should export 5 standard credit packages with correct USD and quota points", () => {
    expect(CODEX_PACKAGES.length).toBe(5);
    const amounts = CODEX_PACKAGES.map((p) => p.creditUsd);
    expect(amounts).toEqual([10, 50, 100, 200, 500]);

    // Check 10 USD package: 5M quota
    const p10 = CODEX_PACKAGES.find((p) => p.creditUsd === 10);
    expect(p10?.quotaUnits).toBe(5000000);
    expect(p10?.priceVnd).toBe(22000);
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
    expect(data.totalAmount).toBe(22000);
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

  it("should create order with quantity > 1 and multiply totalAmount, creditUsd, and quotaUnits", async () => {
    const req = new NextRequest("http://localhost:3000/api/codex/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bindingId: testBindingId,
        packageId: "codex-10",
        email: "testcustomer@gmail.com",
        customerNote: "Mua 2 gói",
        quantity: 2,
      }),
    });

    const res = await codexCheckoutHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.totalAmount).toBe(44000); // 22000 * 2
    expect(data.creditUsd).toBe(20); // 10 * 2
    expect(data.quotaUnits).toBe(10000000); // 5000000 * 2

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
      expect(order.creditTopupOrder?.creditUsd).toBe(20);
      expect(order.creditTopupOrder?.quotaUnits).toBe(10000000);
      expect(order.orderItems[0].quantity).toBe(2);
      expect(order.orderItems[0].price).toBe(22000);
    }
  });
});
