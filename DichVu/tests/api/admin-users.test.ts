import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getUsersRoute } from "@/app/api/admin/users/route";
import { POST as adjustBalanceRoute } from "@/app/api/admin/users/[id]/adjust-balance/route";
import { NextRequest } from "next/server";

describe("Admin Users API Routes", () => {
  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany({});
    await prisma.depositOrder.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("GET /api/admin/users returns user list and stats", async () => {
    await prisma.user.create({
      data: {
        username: "testapiuser",
        email: "apiuser@example.com",
        passwordHash: "hash",
        balance: 30000,
        totalDeposited: 50000,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/admin/users");
    const res = await getUsersRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.users.length).toBe(1);
    expect(data.users[0].username).toBe("testapiuser");
    expect(data.stats.totalUsers).toBe(1);
    expect(data.stats.totalBalance).toBe(30000);
    expect(data.stats.totalDeposited).toBe(50000);
  });

  it("POST /api/admin/users/[id]/adjust-balance adjusts balance successfully", async () => {
    const user = await prisma.user.create({
      data: {
        username: "adjustapiuser",
        email: "adjust@example.com",
        passwordHash: "hash",
        balance: 20000,
      },
    });

    const req = new NextRequest(
      `http://localhost:3000/api/admin/users/${user.id}/adjust-balance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 30000,
          reason: "Thưởng sự kiện",
          adminNote: "Duyệt bởi Admin",
        }),
      }
    );

    const res = await adjustBalanceRoute(req, { params: { id: user.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.balance).toBe(50000);
  });

  it("POST /api/admin/users/[id]/adjust-balance rejects invalid inputs", async () => {
    const user = await prisma.user.create({
      data: {
        username: "invaliduser",
        email: "invalid@example.com",
        passwordHash: "hash",
        balance: 10000,
      },
    });

    // Zero amount
    const reqZero = new NextRequest(
      `http://localhost:3000/api/admin/users/${user.id}/adjust-balance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 0, reason: "Test" }),
      }
    );
    const resZero = await adjustBalanceRoute(reqZero, { params: { id: user.id } });
    expect(resZero.status).toBe(400);

    // Missing reason
    const reqNoReason = new NextRequest(
      `http://localhost:3000/api/admin/users/${user.id}/adjust-balance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 5000, reason: "" }),
      }
    );
    const resNoReason = await adjustBalanceRoute(reqNoReason, { params: { id: user.id } });
    expect(resNoReason.status).toBe(400);

    // Insufficient balance
    const reqDeduct = new NextRequest(
      `http://localhost:3000/api/admin/users/${user.id}/adjust-balance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: -50000, reason: "Phạt quá đà" }),
      }
    );
    const resDeduct = await adjustBalanceRoute(reqDeduct, { params: { id: user.id } });
    expect(resDeduct.status).toBe(400);
  });
});
