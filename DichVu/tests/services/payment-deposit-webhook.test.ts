import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { handleIncomingTransaction } from "@/services/payment.service";
import { createDepositOrder } from "@/services/deposit.service";

describe("Payment Webhook - Wallet Auto Top-up Integration", () => {
  let userId: string;

  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany();
    await prisma.paymentTransaction.deleteMany();
    await prisma.depositOrder.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        username: "topupwebhookuser",
        passwordHash: "dummyhash",
        balance: 10000,
        totalDeposited: 10000,
      },
    });
    userId = user.id;
  });

  it("should process NAPxxxxxx webhook: mark deposit COMPLETED, credit user balance & totalDeposited, and record ledger", async () => {
    const deposit = await createDepositOrder(userId, 50000);

    const webhookPayload = {
      transactionId: "TX_NAP_TEST_001",
      amount: 50000,
      content: `Chuyen khoan ${deposit.depositCode} nap tien`,
      bankCode: "MB",
    };

    const result = await handleIncomingTransaction(webhookPayload);
    expect(result.success).toBe(true);
    expect(result.status).toBe("COMPLETED");

    // Verify DepositOrder updated
    const updatedDeposit = await prisma.depositOrder.findUnique({
      where: { id: deposit.id },
    });
    expect(updatedDeposit?.status).toBe("COMPLETED");
    expect(updatedDeposit?.paidAt).not.toBeNull();

    // Verify User balance credited
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    expect(updatedUser?.balance).toBe(60000); // 10000 initial + 50000 topup
    expect(updatedUser?.totalDeposited).toBe(60000);

    // Verify WalletTransaction ledger created
    const ledgerEntry = await prisma.walletTransaction.findFirst({
      where: { referenceId: deposit.depositCode },
    });
    expect(ledgerEntry).not.toBeNull();
    expect(ledgerEntry?.type).toBe("TOPUP");
    expect(ledgerEntry?.amount).toBe(50000);
    expect(ledgerEntry?.balanceBefore).toBe(10000);
    expect(ledgerEntry?.balanceAfter).toBe(60000);

    // Verify PaymentTransaction created with depositOrderId
    const paymentTx = await prisma.paymentTransaction.findUnique({
      where: { transactionId: "TX_NAP_TEST_001" },
    });
    expect(paymentTx).not.toBeNull();
    expect(paymentTx?.depositOrderId).toBe(deposit.id);
  });

  it("should be idempotent when receiving duplicate NAP transactionId", async () => {
    const deposit = await createDepositOrder(userId, 50000);

    const webhookPayload = {
      transactionId: "TX_NAP_TEST_DUP",
      amount: 50000,
      content: `Chuyen khoan ${deposit.depositCode}`,
      bankCode: "TPB",
    };

    // First call
    const firstResult = await handleIncomingTransaction(webhookPayload);
    expect(firstResult.success).toBe(true);
    expect(firstResult.isDuplicate).toBeFalsy();

    // Replay same transaction
    const secondResult = await handleIncomingTransaction(webhookPayload);
    expect(secondResult.success).toBe(true);
    expect(secondResult.isDuplicate).toBe(true);

    // Balance should still be 60000 (not credited twice)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(60000);
  });

  it("should reject deposit if transferred amount is less than deposit order amount", async () => {
    const deposit = await createDepositOrder(userId, 100000);

    const webhookPayload = {
      transactionId: "TX_NAP_TEST_SHORT",
      amount: 50000, // Less than 100,000
      content: `Chuyen khoan ${deposit.depositCode}`,
    };

    const result = await handleIncomingTransaction(webhookPayload);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Số tiền thanh toán");

    // Balance untouched
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(10000);
  });
});
