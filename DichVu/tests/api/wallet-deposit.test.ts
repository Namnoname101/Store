import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { POST as depositHandler } from "@/app/api/wallet/deposit/route";
import { GET as statusHandler } from "@/app/api/wallet/deposit/[depositCode]/status/route";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";
import { NextRequest } from "next/server";

describe("Wallet Deposit API Routes", () => {
  let userId: string;
  let token: string;

  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany();
    await prisma.depositOrder.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        username: "depositapiuser",
        passwordHash: "dummyhash",
        balance: 10000,
      },
    });
    userId = user.id;

    token = await createUserSessionToken({
      userId: user.id,
      username: user.username!,
      role: "CUSTOMER",
    });
  });

  it("POST /api/wallet/deposit should require authentication", async () => {
    const req = new NextRequest("http://localhost:3000/api/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount: 50000 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await depositHandler(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/wallet/deposit should create deposit order when authenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount: 50000 }),
      headers: {
        "Content-Type": "application/json",
        cookie: `${USER_COOKIE_NAME}=${token}`,
      },
    });

    const res = await depositHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.deposit.depositCode).toMatch(/^NAP\d{6}$/);
    expect(data.deposit.amount).toBe(50000);
  });

  it("GET /api/wallet/deposit/[depositCode]/status should return deposit status", async () => {
    const createReq = new NextRequest("http://localhost:3000/api/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount: 100000 }),
      headers: {
        "Content-Type": "application/json",
        cookie: `${USER_COOKIE_NAME}=${token}`,
      },
    });
    const createRes = await depositHandler(createReq);
    const { deposit } = await createRes.json();

    const statusReq = new NextRequest(
      `http://localhost:3000/api/wallet/deposit/${deposit.depositCode}/status`
    );
    const statusRes = await statusHandler(statusReq, {
      params: { depositCode: deposit.depositCode },
    });

    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.success).toBe(true);
    expect(statusData.deposit.depositCode).toBe(deposit.depositCode);
    expect(statusData.deposit.amount).toBe(100000);
  });
});
