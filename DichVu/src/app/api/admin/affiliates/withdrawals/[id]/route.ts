import { NextRequest, NextResponse } from "next/server";
import { prisma, WithdrawalStatus, WalletTransactionType } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toUpperCase(); // APPROVE or REJECT
    const adminNote = body.adminNote ? String(body.adminNote).trim() : null;

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Không tìm thấy yêu cầu rút tiền" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      return NextResponse.json(
        { error: `Yêu cầu này đã được xử lý trước đó (${withdrawal.status})` },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.APPROVED,
          adminNote: adminNote || "Đã chuyển khoản thành công",
          paidAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã duyệt và xác nhận chuyển tiền",
        data: updated,
      });
    }

    if (action === "REJECT") {
      // Refund balance back to user
      const updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            balance: { increment: withdrawal.amount },
          },
        });

        // Record refund ledger entry
        await tx.walletTransaction.create({
          data: {
            userId: withdrawal.userId,
            type: WalletTransactionType.REFUND,
            amount: withdrawal.amount,
            balanceBefore: user.balance - withdrawal.amount,
            balanceAfter: user.balance,
            referenceId: withdrawal.withdrawalCode,
            description: `Hoàn tiền yêu cầu rút tiền bị từ chối (${withdrawal.withdrawalCode}): ${adminNote || "Không có lý do"}`,
          },
        });

        return await tx.withdrawalRequest.update({
          where: { id },
          data: {
            status: WithdrawalStatus.REJECTED,
            adminNote: adminNote || "Từ chối bởi Admin",
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Đã từ chối và hoàn tiền lại vào ví CTV",
        data: updated,
      });
    }

    return NextResponse.json(
      { error: "Hành động không hợp lệ (chỉ chấp nhận APPROVE hoặc REJECT)" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Admin Resolve Withdrawal Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Lỗi xử lý yêu cầu rút tiền" },
      { status: 500 }
    );
  }
}
