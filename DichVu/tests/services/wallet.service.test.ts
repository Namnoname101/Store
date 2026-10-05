import { describe, it, expect, beforeEach } from "vitest";
import prisma, { OrderStatus } from "@/lib/prisma";
import { payOrderWithWallet } from "@/services/wallet.service";
import { createOrder } from "@/services/order.service";

describe("Wallet Service & 1-Click Balance Checkout", () => {
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany();
    await prisma.paymentTransaction.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.productItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.depositOrder.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        username: "walletcheckoutuser",
        passwordHash: "dummyhash",
        balance: 100000,
        totalDeposited: 100000,
      },
    });
    userId = user.id;

    const cat = await prisma.category.create({
      data: { name: "Software", slug: "software" },
    });

    const prod = await prisma.product.create({
      data: {
        title: "Test Windows Key",
        slug: "test-windows-key",
        description: "Win 11 Pro",
        price: 50000,
        categoryId: cat.id,
        fulfillmentType: "LOCAL_STOCK",
      },
    });
    productId = prod.id;

    // Create 3 available keys
    await prisma.productItem.createMany({
      data: [
        { productId: prod.id, secretContent: "KEY-001", status: "AVAILABLE" },
        { productId: prod.id, secretContent: "KEY-002", status: "AVAILABLE" },
        { productId: prod.id, secretContent: "KEY-003", status: "AVAILABLE" },
      ],
    });
  });

  it("should pay order with wallet: decrement balance, set Order PAID, deliver keys, and record ledger", async () => {
    const order = await createOrder({
      customerEmail: "walletcheckoutuser@example.com",
      items: [{ productId, quantity: 1 }],
      userId,
    });

    const result = await payOrderWithWallet(order.orderCode, userId);
    expect(result.success).toBe(true);
    expect(result.status).toBe("PAID");

    // Verify balance deducted
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(50000); // 100,000 - 50,000

    // Verify order marked PAID with WALLET method
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { deliveredItems: true },
    });
    expect(updatedOrder?.status).toBe("PAID");
    expect(updatedOrder?.paymentMethod).toBe("WALLET");
    expect(updatedOrder?.deliveredItems.length).toBe(1);
    expect(updatedOrder?.deliveredItems[0].secretContent).toBe("KEY-001");

    // Verify ledger
    const ledger = await prisma.walletTransaction.findFirst({
      where: { referenceId: order.orderCode },
    });
    expect(ledger).not.toBeNull();
    expect(ledger?.type).toBe("ORDER_PAYMENT");
    expect(ledger?.amount).toBe(-50000);
    expect(ledger?.balanceBefore).toBe(100000);
    expect(ledger?.balanceAfter).toBe(50000);
  });

  it("should reject wallet payment when balance is insufficient", async () => {
    // Set user balance to 20,000 (less than 50,000)
    await prisma.user.update({
      where: { id: userId },
      data: { balance: 20000 },
    });

    const order = await createOrder({
      customerEmail: "walletcheckoutuser@example.com",
      items: [{ productId, quantity: 1 }],
      userId,
    });

    await expect(payOrderWithWallet(order.orderCode, userId)).rejects.toThrow(
      "Số dư ví không đủ"
    );

    // Balance remains 20,000
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(20000);

    // Order remains PENDING
    const orderInDb = await prisma.order.findUnique({ where: { id: order.id } });
    expect(orderInDb?.status).toBe("PENDING");
  });

  it("should reject payment on already PAID order", async () => {
    const order = await createOrder({
      customerEmail: "walletcheckoutuser@example.com",
      items: [{ productId, quantity: 1 }],
      userId,
    });

    await payOrderWithWallet(order.orderCode, userId);

    // Try paying again
    await expect(payOrderWithWallet(order.orderCode, userId)).rejects.toThrow(
      "Đơn hàng này đã được thanh toán"
    );
  });

  it("should prevent double spending under concurrent checkout attempts", async () => {
    // User has exactly 50,000
    await prisma.user.update({
      where: { id: userId },
      data: { balance: 50000 },
    });

    const order1 = await createOrder({
      customerEmail: "walletcheckoutuser@example.com",
      items: [{ productId, quantity: 1 }],
      userId,
    });

    const order2 = await createOrder({
      customerEmail: "walletcheckoutuser@example.com",
      items: [{ productId, quantity: 1 }],
      userId,
    });

    // Run both concurrent payments
    const results = await Promise.allSettled([
      payOrderWithWallet(order1.orderCode, userId),
      payOrderWithWallet(order2.orderCode, userId),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one must succeed, one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Final balance must be 0, never negative
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(0);
  });
});
