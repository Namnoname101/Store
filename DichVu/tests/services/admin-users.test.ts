import { describe, it, expect, beforeEach } from "vitest";
import { prisma, WalletTransactionType } from "@/lib/prisma";
import {
  listAdminUsers,
  adjustUserBalance,
} from "@/services/admin-users.service";

describe("Admin Users & Balance Management Service", () => {
  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany({});
    await prisma.depositOrder.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("should list users with metrics, order count, and search filter", async () => {
    // Create test users
    const userA = await prisma.user.create({
      data: {
        username: "useralpha",
        email: "alpha@example.com",
        passwordHash: "hash1",
        balance: 100000,
        totalDeposited: 150000,
      },
    });

    const userB = await prisma.user.create({
      data: {
        username: "userbeta",
        email: "beta@test.com",
        passwordHash: "hash2",
        balance: 50000,
        totalDeposited: 50000,
      },
    });

    // Create an order for userA
    await prisma.order.create({
      data: {
        orderCode: "ORDTEST1",
        customerEmail: "alpha@example.com",
        userId: userA.id,
        totalAmount: 50000,
        status: "PAID",
        expiresAt: new Date(Date.now() + 900000),
      },
    });

    // Test list all users
    const result = await listAdminUsers();
    expect(result.users.length).toBe(2);
    expect(result.stats.totalUsers).toBe(2);
    expect(result.stats.totalBalance).toBe(150000);
    expect(result.stats.totalDeposited).toBe(200000);

    const foundA = result.users.find((u) => u.id === userA.id);
    expect(foundA).toBeDefined();
    expect(foundA?.orderCount).toBe(1);

    // Test search filter
    const searchResult = await listAdminUsers({ search: "beta" });
    expect(searchResult.users.length).toBe(1);
    expect(searchResult.users[0].username).toBe("userbeta");
  });

  it("should successfully adjust balance positively and create audit ledger transaction", async () => {
    const user = await prisma.user.create({
      data: {
        username: "receiver",
        email: "receiver@example.com",
        passwordHash: "hash",
        balance: 20000,
        totalDeposited: 20000,
      },
    });

    const adjustResult = await adjustUserBalance({
      userId: user.id,
      amount: 50000,
      reason: "Tặng thưởng thành viên VIP",
    });

    expect(adjustResult.success).toBe(true);
    expect(adjustResult.user.balance).toBe(70000);

    // Check ledger transaction
    const tx = await prisma.walletTransaction.findFirst({
      where: { userId: user.id },
    });

    expect(tx).toBeDefined();
    expect(tx?.type).toBe(WalletTransactionType.ADMIN_ADJUST);
    expect(tx?.amount).toBe(50000);
    expect(tx?.balanceBefore).toBe(20000);
    expect(tx?.balanceAfter).toBe(70000);
    expect(tx?.description).toContain("Tặng thưởng thành viên VIP");
  });

  it("should successfully deduct balance and record audit ledger", async () => {
    const user = await prisma.user.create({
      data: {
        username: "deductee",
        email: "deductee@example.com",
        passwordHash: "hash",
        balance: 100000,
        totalDeposited: 100000,
      },
    });

    const adjustResult = await adjustUserBalance({
      userId: user.id,
      amount: -40000,
      reason: "Trừ tiền dịch vụ thủ công theo yêu cầu",
    });

    expect(adjustResult.success).toBe(true);
    expect(adjustResult.user.balance).toBe(60000);

    const tx = await prisma.walletTransaction.findFirst({
      where: { userId: user.id },
    });
    expect(tx?.amount).toBe(-40000);
    expect(tx?.balanceBefore).toBe(100000);
    expect(tx?.balanceAfter).toBe(60000);
  });

  it("should reject balance deduction if user balance is insufficient", async () => {
    const user = await prisma.user.create({
      data: {
        username: "pooruser",
        email: "poor@example.com",
        passwordHash: "hash",
        balance: 15000,
      },
    });

    await expect(
      adjustUserBalance({
        userId: user.id,
        amount: -20000,
        reason: "Trừ quá số dư",
      })
    ).rejects.toThrow("Số dư");
  });

  it("should reject adjustment when amount is 0 or reason is missing", async () => {
    const user = await prisma.user.create({
      data: {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        balance: 50000,
      },
    });

    await expect(
      adjustUserBalance({
        userId: user.id,
        amount: 0,
        reason: "Không thay đổi",
      })
    ).rejects.toThrow();

    await expect(
      adjustUserBalance({
        userId: user.id,
        amount: 10000,
        reason: "",
      })
    ).rejects.toThrow();
  });
});
