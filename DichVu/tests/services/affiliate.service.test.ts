import { describe, it, expect, beforeEach } from "vitest";
import { prisma, WalletTransactionType, WithdrawalStatus, AffiliateTier } from "@/lib/prisma";
import {
  registerAffiliate,
  processAffiliateCommission,
  requestWithdrawal,
  getProductCommissionRate,
} from "@/services/affiliate.service";

describe("Affiliate & CTV System Unit Tests", () => {
  it("should calculate correct commission rates based on product category", () => {
    expect(getProductCommissionRate("API & Key AI (Claude, Codex, Cursor)", 15.0)).toBe(8.0);
    expect(getProductCommissionRate("Dịch Vụ MXH (TikTok, Facebook)", 15.0)).toBe(20.0);
    expect(getProductCommissionRate("Học tập & Thiết kế (Canva)", 15.0)).toBe(15.0);
    expect(getProductCommissionRate(null, 15.0)).toBe(15.0);
  });

  it("should register a user as an affiliate and create a linked 5% coupon", async () => {
    const testEmail = `ctv_test_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        username: `ctvuser_${Date.now()}`,
        email: testEmail,
        balance: 0,
      },
    });

    const result = await registerAffiliate({
      userId: user.id,
      customCode: `TEST_${Date.now().toString().slice(-4)}`,
      bankName: "MB",
      bankAccountNumber: "0987654321",
      bankAccountName: "NGUYEN VAN A",
    });

    expect(result.success).toBe(true);
    expect(result.affiliateCode).toContain("CTV_");

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { affiliateCoupons: true },
    });

    expect(updatedUser?.isAffiliate).toBe(true);
    expect(updatedUser?.affiliateTier).toBe(AffiliateTier.NEWBIE);
    expect(updatedUser?.affiliateCoupons.length).toBeGreaterThan(0);
    expect(updatedUser?.affiliateCoupons[0].value).toBe(5); // 5% discount for buyers
  });

  it("should enforce minimum withdrawal limit of 50.000đ", async () => {
    const user = await prisma.user.create({
      data: {
        username: `ctv_withdraw_${Date.now()}`,
        email: `ctv_w_${Date.now()}@test.com`,
        balance: 100000,
      },
    });

    // Try to withdraw 30.000đ (< 50.000đ)
    await expect(
      requestWithdrawal({
        userId: user.id,
        amount: 30000,
        bankName: "MB",
        accountNumber: "123456",
        accountName: "TEST USER",
      })
    ).rejects.toThrow("Số tiền rút tối thiểu là 50.000đ");

    // Try to withdraw 60.000đ with sufficient balance (>= 50.000đ)
    const withdrawal = await requestWithdrawal({
      userId: user.id,
      amount: 60000,
      bankName: "MB",
      accountNumber: "123456",
      accountName: "TEST USER",
    });

    expect(withdrawal.status).toBe(WithdrawalStatus.PENDING);
    expect(withdrawal.amount).toBe(60000);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(refreshedUser?.balance).toBe(40000); // 100k - 60k
  });

  it("should reject self-referral when order owner is the affiliate owner", async () => {
    const ctvUser = await prisma.user.create({
      data: {
        username: `ctv_self_${Date.now()}`,
        email: `ctv_self_${Date.now()}@test.com`,
        balance: 0,
        isAffiliate: true,
      },
    });

    const coupon = await prisma.coupon.create({
      data: {
        code: `SELF_${Date.now()}`,
        type: "PERCENT",
        value: 5,
        affiliateUserId: ctvUser.id,
        affiliateRate: 15.0,
      },
    });

    // Order created by the same user who owns the coupon
    const order = await prisma.order.create({
      data: {
        orderCode: `ORD_SELF_${Date.now()}`,
        userId: ctvUser.id,
        totalAmount: 100000,
        couponId: coupon.id,
        status: "PAID",
        expiresAt: new Date(Date.now() + 600000),
      },
    });

    const processResult = await processAffiliateCommission(order.id);
    expect(processResult.processed).toBe(false);
    expect(processResult.reason).toBe("Self-referral rejected");

    const refreshedCtv = await prisma.user.findUnique({
      where: { id: ctvUser.id },
    });
    expect(refreshedCtv?.balance).toBe(0); // No commission awarded
  });
});
