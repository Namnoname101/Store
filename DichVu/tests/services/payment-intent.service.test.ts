import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ItemStatus, OrderStatus, FulfillmentType, PaymentIntentStatus } from "@/lib/prisma";
import {
  createPaymentIntentForOrder,
  getActivePaymentIntent,
  regeneratePaymentIntent,
} from "@/services/payment-intent.service";
import { createOrder } from "@/services/order.service";

describe("Payment Intent & 10-Minute QR Lifecycle Service", () => {
  const TEST_CAT_SLUG = "pi-test-cat";
  const TEST_PROD_SLUG = "pi-test-prod";
  let catId: string;
  let prodId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    const category = await prisma.category.create({
      data: { name: "PI Test Cat", slug: TEST_CAT_SLUG },
    });
    catId = category.id;

    const product = await prisma.product.create({
      data: {
        title: "PI Test Product",
        slug: TEST_PROD_SLUG,
        description: "Test description",
        price: 50000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    prodId = product.id;

    // Create 10 available keys
    for (let i = 1; i <= 10; i++) {
      await prisma.productItem.create({
        data: {
          productId: prodId,
          secretContent: `KEY-PI-${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.paymentIntent.deleteMany({
      where: { order: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } } },
    });
    await prisma.productItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.order.deleteMany({
      where: { orderItems: { some: { product: { slug: TEST_PROD_SLUG } } } },
    });
    await prisma.product.deleteMany({
      where: { slug: TEST_PROD_SLUG },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  it("should create an active PaymentIntent with 10-minute expiry upon order creation", async () => {
    const order = await createOrder({
      customerEmail: null,
      items: [{ productId: prodId, quantity: 1 }],
    });

    const activeIntent = await getActivePaymentIntent(order.id);
    expect(activeIntent).not.toBeNull();
    expect(activeIntent?.status).toBe(PaymentIntentStatus.ACTIVE);
    expect(activeIntent?.amount).toBe(50000);
    expect(activeIntent?.qrUrl).toContain("img.vietqr.io");
    expect(activeIntent?.qrUrl).toContain(order.orderCode);

    // Verify exactly 10 minutes (within 5 seconds tolerance)
    const diffSeconds = Math.round(
      (new Date(activeIntent!.expiresAt).getTime() - new Date(activeIntent!.createdAt).getTime()) / 1000
    );
    expect(diffSeconds).toBeGreaterThanOrEqual(595);
    expect(diffSeconds).toBeLessThanOrEqual(605);
  });

  it("should mark expired intent as EXPIRED when checked after expiration", async () => {
    const order = await createOrder({
      customerEmail: null,
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Manually backdate the intent to 11 minutes ago
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 60000) },
    });

    const activeIntent = await getActivePaymentIntent(order.id);
    expect(activeIntent).toBeNull(); // No active intent because it expired

    const dbIntents = await prisma.paymentIntent.findMany({
      where: { orderId: order.id },
    });
    expect(dbIntents[0].status).toBe(PaymentIntentStatus.EXPIRED);
  });

  it("should successfully regenerate QR: superseding old intent, checking stock, and issuing fresh 10m intent", async () => {
    const order = await createOrder({
      customerEmail: null,
      items: [{ productId: prodId, quantity: 1 }],
    });

    // Backdate order to expired
    await prisma.order.update({
      where: { id: order.id },
      data: { expiresAt: new Date(Date.now() - 60000), status: OrderStatus.EXPIRED },
    });
    await prisma.paymentIntent.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 60000), status: PaymentIntentStatus.EXPIRED },
    });

    // Regenerate QR
    const result = await regeneratePaymentIntent(order.orderCode, order.accessToken);
    expect(result.success).toBe(true);
    expect(result.paymentIntent).toBeDefined();
    expect(result.paymentIntent.status).toBe(PaymentIntentStatus.ACTIVE);

    // Old intent should be preserved in DB but superseded/expired
    const allIntents = await prisma.paymentIntent.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });
    expect(allIntents.length).toBeGreaterThanOrEqual(2);
    expect(allIntents[0].status).not.toBe(PaymentIntentStatus.ACTIVE);
    expect(allIntents[allIntents.length - 1].status).toBe(PaymentIntentStatus.ACTIVE);
  });

  it("should prevent QR regeneration if order is already PAID", async () => {
    const order = await createOrder({
      customerEmail: null,
      items: [{ productId: prodId, quantity: 1 }],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    await expect(
      regeneratePaymentIntent(order.orderCode, order.accessToken)
    ).rejects.toThrow(/đã được thanh toán/i);
  });
});
