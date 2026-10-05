import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import {
  createDepositOrder,
  getDepositOrderStatus,
  MIN_DEPOSIT_AMOUNT,
} from "@/services/deposit.service";

describe("Deposit Service & VietQR Top-up Engine", () => {
  let userId: string;

  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany();
    await prisma.depositOrder.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        username: "testdepositor",
        passwordHash: "dummyhash",
        balance: 0,
      },
    });
    userId = user.id;
  });

  it("should enforce MIN_DEPOSIT_AMOUNT of 20,000 VND", async () => {
    expect(MIN_DEPOSIT_AMOUNT).toBe(20000);

    await expect(createDepositOrder(userId, 10000)).rejects.toThrow(
      "Số tiền nạp tối thiểu là 20.000đ"
    );

    await expect(createDepositOrder(userId, -5000)).rejects.toThrow(
      "Số tiền nạp tối thiểu là 20.000đ"
    );
  });

  it("should create deposit order with NAP prefix and valid VietQR URL", async () => {
    const deposit = await createDepositOrder(userId, 50000);

    expect(deposit.depositCode).toMatch(/^NAP\d{6}$/);
    expect(deposit.amount).toBe(50000);
    expect(deposit.status).toBe("PENDING");
    expect(deposit.qrCodeUrl).toContain("vietqr.io");
    expect(deposit.qrCodeUrl).toContain("50000");
    expect(deposit.qrCodeUrl).toContain(deposit.depositCode);
    expect(deposit.bankInfo.accountNo).toBeDefined();

    // Verify DB persistence
    const saved = await prisma.depositOrder.findUnique({
      where: { depositCode: deposit.depositCode },
    });
    expect(saved).not.toBeNull();
    expect(saved?.amount).toBe(50000);
    expect(saved?.userId).toBe(userId);
  });

  it("should query deposit order status correctly", async () => {
    const deposit = await createDepositOrder(userId, 100000);
    const status = await getDepositOrderStatus(deposit.depositCode);

    expect(status.depositCode).toBe(deposit.depositCode);
    expect(status.amount).toBe(100000);
    expect(status.status).toBe("PENDING");
    expect(status.isPaid).toBe(false);
  });

  it("should mark deposit as EXPIRED when past expiration time", async () => {
    const expiredDate = new Date(Date.now() - 1000);
    const deposit = await prisma.depositOrder.create({
      data: {
        depositCode: "NAP999999",
        userId,
        amount: 50000,
        status: "PENDING",
        expiresAt: expiredDate,
      },
    });

    const status = await getDepositOrderStatus(deposit.depositCode);
    expect(status.isExpired).toBe(true);
    expect(status.status).toBe("EXPIRED");
  });
});
