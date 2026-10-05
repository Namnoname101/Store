import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { POST as payWithWalletHandler } from "@/app/api/orders/[orderCode]/pay-with-wallet/route";
import { createOrder } from "@/services/order.service";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";
import { NextRequest } from "next/server";

describe("POST /api/orders/[orderCode]/pay-with-wallet API Route", () => {
  let userId: string;
  let token: string;
  let productId: string;

  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany();
    await prisma.paymentTransaction.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.productItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        username: "walletapicheckoutuser",
        passwordHash: "dummyhash",
        balance: 200000,
      },
    });
    userId = user.id;

    token = await createUserSessionToken({
      userId: user.id,
      username: user.username!,
      role: "CUSTOMER",
    });

    const cat = await prisma.category.create({
      data: { name: "Services", slug: "services" },
    });

    const prod = await prisma.product.create({
      data: {
        title: "Netflix 1 Month",
        slug: "netflix-1-month",
        description: "Netflix 4K",
        price: 80000,
        categoryId: cat.id,
        fulfillmentType: "LOCAL_STOCK",
      },
    });
    productId = prod.id;

    await prisma.productItem.create({
      data: {
        productId: prod.id,
        secretContent: "user:netflix@pass.com",
        status: "AVAILABLE",
      },
    });
  });

  it("should return 401 when not authenticated", async () => {
    const order = await createOrder({
      customerEmail: "guest@example.com",
      items: [{ productId, quantity: 1 }],
    });

    const req = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/pay-with-wallet`,
      { method: "POST" }
    );
    const res = await payWithWalletHandler(req, {
      params: { orderCode: order.orderCode },
    });

    expect(res.status).toBe(401);
  });

  it("should pay with wallet and return 200 with order details when authenticated", async () => {
    const order = await createOrder({
      customerEmail: "walletapicheckoutuser@example.com",
      items: [{ productId, quantity: 1 }],
      userId,
    });

    const req = new NextRequest(
      `http://localhost:3000/api/orders/${order.orderCode}/pay-with-wallet`,
      {
        method: "POST",
        headers: {
          cookie: `${USER_COOKIE_NAME}=${token}`,
        },
      }
    );
    const res = await payWithWalletHandler(req, {
      params: { orderCode: order.orderCode },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.status).toBe("PAID");
    expect(data.order.totalAmount).toBe(80000);

    // Verify User balance updated in DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(120000); // 200,000 - 80,000
  });
});
