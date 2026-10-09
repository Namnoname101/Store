import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Phase 3B Schema Extension Verification", () => {
  it("should support Order with accessToken, idempotencyKey, and reconciliationStatus", async () => {
    const category = await prisma.category.create({
      data: {
        name: "Schema Test Cat",
        slug: "schema-test-cat-" + Date.now(),
      },
    });

    const product = await prisma.product.create({
      data: {
        title: "Schema Test Product",
        slug: "schema-test-prod-" + Date.now(),
        description: "Test description",
        price: 50000,
        categoryId: category.id,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderCode: "ORD" + Math.floor(100000 + Math.random() * 900000),
        customerEmail: null,
        totalAmount: 50000,
        idempotencyKey: "test-idem-" + Date.now(),
        reconciliationStatus: "MATCHED",
        expiresAt: new Date(Date.now() + 600000), // 10 minutes
        orderItems: {
          create: [
            {
              productId: product.id,
              price: 50000,
              quantity: 1,
              targetLink: "https://tiktok.com/@testuser",
              customerNote: "Cần tăng view nhanh",
            },
          ],
        },
        paymentIntents: {
          create: [
            {
              intentCode: "PI_TEST_" + Date.now(),
              qrUrl: "https://api.vietqr.io/image/...",
              amount: 50000,
              expiresAt: new Date(Date.now() + 600000),
              status: "ACTIVE",
            },
          ],
        },
      },
      include: {
        orderItems: true,
        paymentIntents: true,
      },
    });

    expect(order.accessToken).toBeDefined();
    expect(order.accessToken!.length).toBeGreaterThan(10);
    expect(order.reconciliationStatus).toBe("MATCHED");
    expect(order.orderItems[0].targetLink).toBe("https://tiktok.com/@testuser");
    expect(order.orderItems[0].customerNote).toBe("Cần tăng view nhanh");
    expect(order.paymentIntents).toHaveLength(1);
    expect(order.paymentIntents[0].status).toBe("ACTIVE");

    // Clean up
    await prisma.paymentIntent.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.category.delete({ where: { id: category.id } });
  });

  it("should support AuditLog model creation", async () => {
    const log = await prisma.auditLog.create({
      data: {
        action: "RECONCILE_MATCH",
        entityType: "ORDER",
        entityId: "order-123",
        details: JSON.stringify({ reason: "Manual match by owner" }),
        performedBy: "OWNER",
      },
    });

    expect(log.id).toBeDefined();
    expect(log.action).toBe("RECONCILE_MATCH");
    expect(log.performedBy).toBe("OWNER");

    await prisma.auditLog.delete({ where: { id: log.id } });
  });
});
