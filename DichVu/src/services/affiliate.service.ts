import {
  prisma,
  WalletTransactionType,
  WithdrawalStatus,
  AffiliateTier,
} from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface RegisterAffiliateInput {
  userId: string;
  customCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export interface RequestWithdrawalInput {
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const MIN_WITHDRAWAL_VND = 50000;

/**
 * Generate a unique random withdrawal code: WTH + 6 digits
 */
function generateWithdrawalCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `WTH${digits}`;
}

/**
 * Normalizes affiliate code (uppercase, alphanumeric, prefixed with CTV_ if needed)
 */
export function normalizeAffiliateCode(code: string): string {
  let clean = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
  if (!clean.startsWith("CTV_")) {
    clean = `CTV_${clean}`;
  }
  return clean;
}

/**
 * Registers an existing user as an Affiliate (CTV) and creates their personal coupon code.
 */
export async function registerAffiliate(input: RegisterAffiliateInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  if (user.isAffiliate && user.affiliateCode) {
    return {
      success: true,
      affiliateCode: user.affiliateCode,
      message: "Tài khoản đã là CTV",
    };
  }

  // Determine base code
  const baseCode = input.customCode
    ? normalizeAffiliateCode(input.customCode)
    : normalizeAffiliateCode(user.username || user.email?.split("@")[0] || "SELLER");

  let finalCode = baseCode;
  let counter = 1;

  // Ensure unique coupon & affiliate code
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { affiliateCode: finalCode },
      select: { id: true },
    });
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: finalCode },
      select: { id: true },
    });

    if (!existingUser && !existingCoupon) {
      break;
    }
    finalCode = `${baseCode}_${counter}`;
    counter++;
  }

  // Create affiliate coupon and update user in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create personal 5% discount coupon for CTV's buyers
    const coupon = await tx.coupon.create({
      data: {
        code: finalCode,
        type: "PERCENT",
        value: 5, // Khách mua được giảm 5%
        minOrderValue: 0,
        maxDiscount: 100000,
        isActive: true,
        affiliateUserId: user.id,
        affiliateRate: 10.0, // 10% hoa hồng mặc định (thay cho 15% cũ để đảm bảo lãi Shop > CTV)
      },
    });

    // 2. Update user as Affiliate
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        isAffiliate: true,
        affiliateCode: finalCode,
        affiliateTier: AffiliateTier.NEWBIE,
        bankName: input.bankName || user.bankName,
        bankAccountNumber: input.bankAccountNumber || user.bankAccountNumber,
        bankAccountName: input.bankAccountName ? input.bankAccountName.toUpperCase() : user.bankAccountName,
      },
    });

    return { user: updatedUser, coupon };
  });

  return {
    success: true,
    affiliateCode: result.user.affiliateCode!,
    couponCode: result.coupon.code,
    message: "Đăng ký CTV thành công!",
  };
}

/**
 * Calculates item-aware commission based on product categories and specific product slugs.
 * Guarantees that Shop Net Profit > CTV Commission on 100% of products:
 * - Adobe Full Apps: 6%
 * - ChatGPT Plus, Suno AI, Xingtu, Figma: 8%
 * - API AI & Key: 8%
 * - SMM Buff: 20%
 * - Accounts & Software: 10% (fallback default)
 */
export function getProductCommissionRate(
  categoryName?: string | null,
  defaultRate: number = 10.0,
  productSlug?: string | null
): number {
  const slug = (productSlug || "").toLowerCase();

  if (slug.includes("adobe-full-apps")) {
    return 6.0; // 6% for Adobe Full Apps to safeguard profit margin
  }
  if (
    slug.includes("chatgpt") ||
    slug.includes("suno") ||
    slug.includes("xingtu") ||
    slug.includes("figma")
  ) {
    return 8.0; // 8% for high-cost accounts
  }

  if (categoryName) {
    const lower = categoryName.toLowerCase();
    if (lower.includes("api") || lower.includes("key ai") || lower.includes("claude") || lower.includes("codex")) {
      return 8.0; // 8% for API AI items
    }
    if (lower.includes("mxh") || lower.includes("buff") || lower.includes("tiktok") || lower.includes("facebook")) {
      return 20.0; // 20% for SMM buff items
    }
  }

  return defaultRate;
}

/**
 * Processes affiliate commission when an order is paid.
 * Designed to be called safely inside payment reconciliation.
 */
export async function processAffiliateCommission(orderId: string, externalTx?: Prisma.TransactionClient) {
  const db = externalTx || prisma;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      coupon: true,
      orderItems: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!order || !order.coupon || !order.coupon.affiliateUserId) {
    return { processed: false, reason: "No affiliate coupon attached" };
  }

  // Idempotency check: commission already paid for this order
  if (order.isCommissionPaid) {
    return { processed: false, reason: "Commission already paid" };
  }

  const affiliateUserId = order.coupon.affiliateUserId;

  // Self-referral guard: CTV cannot buy through their own code
  if (order.userId && order.userId === affiliateUserId) {
    await db.order.update({
      where: { id: order.id },
      data: {
        affiliateUserId,
        affiliateCommission: 0,
        isCommissionPaid: true,
      },
    });
    return { processed: false, reason: "Self-referral rejected" };
  }

  const defaultRate = order.coupon.affiliateRate ?? 10.0;
  let totalCommission = 0;

  // Calculate per-item commission if items exist, otherwise fallback to order percentage
  if (order.orderItems && order.orderItems.length > 0) {
    for (const item of order.orderItems) {
      const rate = getProductCommissionRate(
        item.product?.category?.name,
        defaultRate,
        item.product?.slug
      );
      const itemGross = item.price * item.quantity;
      // Proportional discount allocation
      const itemNet = order.subtotalAmount > 0
        ? Math.round(itemGross * (order.totalAmount / order.subtotalAmount))
        : itemGross;
      const itemComm = Math.round((itemNet * rate) / 100);
      totalCommission += itemComm;
    }
  } else {
    totalCommission = Math.round((order.totalAmount * defaultRate) / 100);
  }

  if (order.coupon.affiliateFixed) {
    totalCommission += order.coupon.affiliateFixed;
  }

  // Minimum floor
  totalCommission = Math.max(0, totalCommission);

  if (totalCommission <= 0) {
    await db.order.update({
      where: { id: order.id },
      data: {
        affiliateUserId,
        affiliateCommission: 0,
        isCommissionPaid: true,
      },
    });
    return { processed: true, commission: 0 };
  }

  // Credit CTV's wallet balance atomically
  const ctv = await db.user.update({
    where: { id: affiliateUserId },
    data: {
      balance: { increment: totalCommission },
      totalCommission: { increment: totalCommission },
      totalAffOrders: { increment: 1 },
    },
  });

  // Evaluate Tier upgrade:
  // PRO: >= 10 orders, MASTER: >= 50 orders
  let newTier = ctv.affiliateTier;
  if (ctv.totalAffOrders >= 50 && ctv.affiliateTier !== AffiliateTier.MASTER) {
    newTier = AffiliateTier.MASTER;
  } else if (ctv.totalAffOrders >= 10 && ctv.affiliateTier === AffiliateTier.NEWBIE) {
    newTier = AffiliateTier.PRO;
  }

  if (newTier !== ctv.affiliateTier) {
    await db.user.update({
      where: { id: affiliateUserId },
      data: { affiliateTier: newTier },
    });
  }

  // Create ledger entry in WalletTransaction
  await db.walletTransaction.create({
    data: {
      userId: affiliateUserId,
      type: WalletTransactionType.AFFILIATE_COMMISSION,
      amount: totalCommission,
      balanceBefore: ctv.balance - totalCommission,
      balanceAfter: ctv.balance,
      referenceId: order.orderCode,
      description: `Hoa hồng CTV từ đơn #${order.orderCode} (Mã: ${order.coupon.code})`,
    },
  });

  // Mark order commission completed
  await db.order.update({
    where: { id: order.id },
    data: {
      affiliateUserId,
      affiliateCommission: totalCommission,
      isCommissionPaid: true,
    },
  });

  return {
    processed: true,
    commission: totalCommission,
    affiliateUserId,
    orderCode: order.orderCode,
  };
}

/**
 * Creates a withdrawal request for CTV.
 * Deducts wallet balance immediately with atomic guard.
 */
export async function requestWithdrawal(input: RequestWithdrawalInput) {
  if (input.amount < MIN_WITHDRAWAL_VND) {
    throw new Error(`Số tiền rút tối thiểu là ${MIN_WITHDRAWAL_VND.toLocaleString("vi-VN")}đ`);
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  if (user.balance < input.amount) {
    throw new Error(`Số dư ví không đủ. Hiện có: ${user.balance.toLocaleString("vi-VN")}đ`);
  }

  const withdrawalCode = generateWithdrawalCode();

  const withdrawal = await prisma.$transaction(async (tx) => {
    // 1. Atomic decrement balance
    const updatedUser = await tx.user.update({
      where: {
        id: user.id,
        balance: { gte: input.amount },
      },
      data: {
        balance: { decrement: input.amount },
        bankName: input.bankName,
        bankAccountNumber: input.accountNumber,
        bankAccountName: input.accountName.toUpperCase(),
      },
    });

    // 2. Create pending withdrawal request
    const req = await tx.withdrawalRequest.create({
      data: {
        withdrawalCode,
        userId: user.id,
        amount: input.amount,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountName: input.accountName.toUpperCase(),
        status: WithdrawalStatus.PENDING,
      },
    });

    // 3. Record wallet transaction
    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        type: WalletTransactionType.WITHDRAWAL,
        amount: -input.amount,
        balanceBefore: updatedUser.balance + input.amount,
        balanceAfter: updatedUser.balance,
        referenceId: withdrawalCode,
        description: `Yêu cầu rút tiền về ${input.bankName} - ${input.accountNumber} (${withdrawalCode})`,
      },
    });

    return req;
  });

  return withdrawal;
}

/**
 * Fetches affiliate statistics and history for dashboard.
 */
export async function getAffiliateDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      affiliateCoupons: {
        where: { isActive: true },
        take: 5,
      },
      withdrawals: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  // Fetch recent affiliate commission transactions
  const commissions = await prisma.walletTransaction.findMany({
    where: {
      userId,
      type: WalletTransactionType.AFFILIATE_COMMISSION,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return {
    isAffiliate: user.isAffiliate,
    affiliateCode: user.affiliateCode,
    affiliateTier: user.affiliateTier,
    balance: user.balance,
    totalCommission: user.totalCommission,
    totalAffOrders: user.totalAffOrders,
    bankInfo: {
      bankName: user.bankName,
      bankAccountNumber: user.bankAccountNumber,
      bankAccountName: user.bankAccountName,
    },
    activeCoupon: user.affiliateCoupons[0] || null,
    recentCommissions: commissions,
    recentWithdrawals: user.withdrawals,
  };
}
