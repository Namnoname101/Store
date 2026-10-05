import { prisma, WalletTransactionType } from "@/lib/prisma";

export interface ListAdminUsersOptions {
  search?: string;
}

export interface AdminUserItem {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  balance: number;
  totalDeposited: number;
  orderCount: number;
  depositCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersStats {
  totalUsers: number;
  totalBalance: number;
  totalDeposited: number;
}

export interface ListAdminUsersResult {
  users: AdminUserItem[];
  stats: AdminUsersStats;
}

export async function listAdminUsers(
  options: ListAdminUsersOptions = {}
): Promise<ListAdminUsersResult> {
  const { search } = options;

  const whereClause: any = {};
  if (search && search.trim()) {
    const term = search.trim();
    whereClause.OR = [
      { username: { contains: term } },
      { email: { contains: term } },
    ];
  }

  // Fetch users with counts
  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          orders: true,
          depositOrders: true,
        },
      },
    },
  });

  // Calculate overall stats (unfiltered for total platform metrics or filtered if searched)
  const allUsersForStats = await prisma.user.findMany({
    select: {
      balance: true,
      totalDeposited: true,
    },
  });

  const totalUsers = allUsersForStats.length;
  const totalBalance = allUsersForStats.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalDeposited = allUsersForStats.reduce(
    (sum, u) => sum + (u.totalDeposited || 0),
    0
  );

  return {
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      balance: u.balance,
      totalDeposited: u.totalDeposited,
      orderCount: u._count.orders,
      depositCount: u._count.depositOrders,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
    stats: {
      totalUsers,
      totalBalance,
      totalDeposited,
    },
  };
}

export interface AdjustUserBalanceParams {
  userId: string;
  amount: number;
  reason: string;
  adminNote?: string;
}

export async function adjustUserBalance({
  userId,
  amount,
  reason,
  adminNote,
}: AdjustUserBalanceParams) {
  if (!userId) {
    throw new Error("Mã người dùng không hợp lệ");
  }

  if (typeof amount !== "number" || isNaN(amount) || amount === 0) {
    throw new Error("Số tiền điều chỉnh phải khác 0");
  }

  const cleanAmount = Math.floor(amount);
  if (cleanAmount === 0) {
    throw new Error("Số tiền điều chỉnh không thể bằng 0");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Vui lòng nhập lý do điều chỉnh số dư");
  }

  const cleanReason = reason.trim();

  return await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("Không tìm thấy người dùng");
    }

    if (cleanAmount < 0 && existingUser.balance + cleanAmount < 0) {
      throw new Error(
        `Số dư ví hiện tại (${existingUser.balance.toLocaleString("vi-VN")}đ) không đủ để trừ ${Math.abs(cleanAmount).toLocaleString("vi-VN")}đ`
      );
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: cleanAmount,
        },
      },
    });

    const txDescription = adminNote
      ? `${cleanReason} (${adminNote.trim()})`
      : cleanReason;

    await tx.walletTransaction.create({
      data: {
        userId,
        type: WalletTransactionType.ADMIN_ADJUST,
        amount: cleanAmount,
        balanceBefore: existingUser.balance,
        balanceAfter: updatedUser.balance,
        referenceId: `ADJUST-${Date.now()}`,
        description: txDescription,
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        balance: updatedUser.balance,
        totalDeposited: updatedUser.totalDeposited,
      },
    };
  });
}
