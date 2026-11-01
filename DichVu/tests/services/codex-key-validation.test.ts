import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import prisma from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import { ModelApiService } from "@/services/modelapi/modelapi.service";

describe("Codex Existing API Key Pre-order Validation", () => {
  let testCategoryId: string;
  let testCodexProductId: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: {
        name: "Codex Key Test Cat",
        slug: `codex-key-test-${Date.now()}`,
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "API Codex AI – tốc độ nhanh (10$ Credit)",
        slug: `cdx-key-test-${Date.now()}`,
        description: "Test product for existing key verification",
        price: 22000,
        categoryId: category.id,
        type: "CODEX_CREDIT",
        fulfillmentType: "LOCAL_STOCK",
        isActive: true,
      },
    });
    testCodexProductId = product.id;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await prisma.orderItem.deleteMany({
      where: { productId: testCodexProductId },
    });
    await prisma.product.deleteMany({
      where: { id: testCodexProductId },
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId },
    });
  });

  it("should reject order creation if customer provides an invalid API key", async () => {
    // Mock ModelApiService.verifyCustomerKey to return invalid
    vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValueOnce({
      valid: false,
      error: "API Key không hợp lệ hoặc đã bị vô hiệu hóa trên upstream",
    });

    await expect(
      createOrder({
        customerEmail: "tester@example.com",
        customerNote: "sk-invalidKey1234567890",
        items: [{ productId: testCodexProductId, quantity: 1 }],
      })
    ).rejects.toThrow("API Key nạp tiền không hợp lệ trên hệ thống");
  });

  it("should allow order creation if customer provides a valid API key verified by upstream", async () => {
    vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValueOnce({
      valid: true,
      tokenId: 12345,
      name: "valid_customer_key",
      remainQuota: 5000000,
    });

    const order = await createOrder({
      customerEmail: "tester-valid@example.com",
      customerNote: "sk-validKey1234567890",
      items: [{ productId: testCodexProductId, quantity: 1 }],
    });

    expect(order).toBeDefined();
    expect(order.orderCode).toBeDefined();

    // Clean up created order
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.paymentIntent.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  });

  it("should allow order creation without key when customer wants to create a brand new key", async () => {
    const order = await createOrder({
      customerEmail: "tester-new@example.com",
      customerNote: "CREATE_NEW_KEY:my_username",
      items: [{ productId: testCodexProductId, quantity: 1 }],
    });

    expect(order).toBeDefined();
    expect(order.orderCode).toBeDefined();

    // Clean up created order
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.paymentIntent.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  });
});
