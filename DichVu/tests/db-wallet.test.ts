import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";

describe("Database Wallet Models & Extensions", () => {
  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany();
    await prisma.depositOrder.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should create user with default balance 0 and totalDeposited 0", async () => {
    const user = await prisma.user.create({
      data: {
        username: "testuser1",
        email: "testuser1@example.com",
        passwordHash: "hashed_pw_123",
        role: "CUSTOMER",
      },
    });

    expect(user.id).toBeDefined();
    expect(user.username).toBe("testuser1");
    expect(user.balance).toBe(0);
    expect(user.totalDeposited).toBe(0);
  });

  it("should create DepositOrder linked to user", async () => {
    const user = await prisma.user.create({
      data: {
        username: "testuser2",
        passwordHash: "hashed_pw_123",
      },
    });

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const deposit = await prisma.depositOrder.create({
      data: {
        depositCode: "NAP123456",
        userId: user.id,
        amount: 50000,
        status: "PENDING",
        expiresAt,
      },
    });

    expect(deposit.id).toBeDefined();
    expect(deposit.depositCode).toBe("NAP123456");
    expect(deposit.amount).toBe(50000);
    expect(deposit.status).toBe("PENDING");
  });

  it("should create WalletTransaction linked to user", async () => {
    const user = await prisma.user.create({
      data: {
        username: "testuser3",
        passwordHash: "hashed_pw_123",
        balance: 50000,
      },
    });

    const txRecord = await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: "TOPUP",
        amount: 50000,
        balanceBefore: 0,
        balanceAfter: 50000,
        referenceId: "NAP123456",
        description: "Nạp tiền tự động qua VietQR",
      },
    });

    expect(txRecord.id).toBeDefined();
    expect(txRecord.type).toBe("TOPUP");
    expect(txRecord.balanceAfter).toBe(50000);
    expect(txRecord.description).toContain("VietQR");
  });
});
