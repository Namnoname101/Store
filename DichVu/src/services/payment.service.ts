import { prisma, OrderStatus, FulfillmentType, DepositStatus, WalletTransactionType } from "@/lib/prisma";
import { commitReservedItemsToSold, releaseExpiredReservations } from "@/services/inventory.service";
import { parseOrderCodeFromMemo, parseDepositCodeFromMemo } from "@/lib/vietqr";
import { fulfillOrderViaUpstream } from "@/services/upstream-fulfillment.service";

export interface BankTransactionPayload {
  transactionId: string;
  amount: number;
  content: string;
  bankCode?: string;
  rawPayload?: any;
}

export interface PaymentProcessResult {
  success: boolean;
  orderCode?: string;
  depositCode?: string;
  status?: string;
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}

/**
 * Normalizes incoming webhook payloads from standard bank format, SePay, or PayOS into BankTransactionPayload.
 */
export function normalizeTransactionPayload(
  raw: any
): BankTransactionPayload | null {
  if (!raw || typeof raw !== "object") return null;

  // PayOS webhook structure: { code, desc, data: { orderCode, amount, description, reference, counterAccountBankId, ... } }
  if (raw.data && typeof raw.data === "object") {
    const data = raw.data;
    const txId =
      data.reference ||
      (data.orderCode !== undefined && data.orderCode !== null
        ? String(data.orderCode)
        : "") ||
      data.paymentLinkId ||
      raw.transactionId;

    const rawAmt = data.amount ?? raw.amount;
    const amount =
      typeof rawAmt === "string" ? parseFloat(rawAmt) : Number(rawAmt);
    const content = data.description || data.content || raw.content || "";
    const bankCode =
      data.counterAccountBankId || data.bankCode || raw.bankCode;

    if (
      txId &&
      typeof amount === "number" &&
      !isNaN(amount) &&
      amount > 0 &&
      content
    ) {
      return {
        transactionId: String(txId),
        amount,
        content: String(content),
        bankCode: bankCode ? String(bankCode) : undefined,
        rawPayload: raw,
      };
    }
  }

  // SePay format or standard format
  const rawTxId =
    raw.transactionId ??
    raw.id ??
    raw.referenceCode ??
    raw.referenceNumber ??
    raw.reference;

  const txId =
    rawTxId !== undefined && rawTxId !== null ? String(rawTxId).trim() : "";

  const rawAmt =
    raw.amount ??
    raw.transferAmount ??
    raw.amountIn;

  const amount =
    typeof rawAmt === "string" ? parseFloat(rawAmt) : Number(rawAmt);
  const content =
    (raw.content && String(raw.content).trim() !== "" ? String(raw.content).trim() : null) ||
    (raw.description && String(raw.description).trim() !== "" ? String(raw.description).trim() : null) ||
    (raw.transactionContent && String(raw.transactionContent).trim() !== "" ? String(raw.transactionContent).trim() : null) ||
    (raw.orderContent && String(raw.orderContent).trim() !== "" ? String(raw.orderContent).trim() : null) ||
    "";
  const bankCode = raw.bankCode ?? raw.gateway;

  if (
    txId &&
    typeof amount === "number" &&
    !isNaN(amount) &&
    amount >= 0
  ) {
    return {
      transactionId: txId,
      amount,
      content: String(content || ""),
      bankCode: bankCode ? String(bankCode) : undefined,
      rawPayload: raw,
    };
  }

  return null;
}

/**
 * Processes incoming bank / gateway payment transaction idempotently.
 */
export async function handleIncomingTransaction(
  payload: BankTransactionPayload
): Promise<PaymentProcessResult> {
  if (
    !payload ||
    !payload.transactionId ||
    typeof payload.amount !== "number" ||
    isNaN(payload.amount)
  ) {
    return {
      success: false,
      error: "Invalid transaction payload: transactionId and amount are required",
    };
  }

  // 1. Idempotency Guard
  const existingTx = await prisma.paymentTransaction.findUnique({
    where: { transactionId: payload.transactionId },
  });

  if (existingTx) {
    let orderCode: string | undefined;
    let depositCode: string | undefined;
    if (existingTx.orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: existingTx.orderId },
        select: { orderCode: true },
      });
      orderCode = existingOrder?.orderCode;
    } else if (existingTx.depositOrderId) {
      const existingDeposit = await prisma.depositOrder.findUnique({
        where: { id: existingTx.depositOrderId },
        select: { depositCode: true },
      });
      depositCode = existingDeposit?.depositCode;
    }

    return {
      success: true,
      isDuplicate: true,
      message: "Transaction already processed",
      orderCode,
      depositCode,
    };
  }

  // 2. Check for Wallet Top-up (NAPxxxxxx)
  const depositCode = parseDepositCodeFromMemo(payload.content || "");
  if (depositCode) {
    const deposit = await prisma.depositOrder.findUnique({
      where: { depositCode },
      include: { user: true },
    });

    if (!deposit) {
      await prisma.paymentTransaction.create({
        data: {
          transactionId: payload.transactionId,
          amount: Math.round(payload.amount),
          bankCode: payload.bankCode || null,
          content: payload.content || null,
          rawPayload: payload.rawPayload ? JSON.stringify(payload.rawPayload) : null,
          depositOrderId: null,
        },
      });

      return {
        success: false,
        error: `Deposit order "${depositCode}" not found`,
        depositCode,
      };
    }

    if (deposit.status === DepositStatus.COMPLETED) {
      return {
        success: true,
        isDuplicate: true,
        status: DepositStatus.COMPLETED,
        message: "Lệnh nạp tiền đã hoàn tất trước đó",
        depositCode,
      };
    }

    // Check payment amount meets requirement
    if (payload.amount < deposit.amount) {
      await prisma.paymentTransaction.create({
        data: {
          transactionId: payload.transactionId,
          amount: Math.round(payload.amount),
          bankCode: payload.bankCode || null,
          content: payload.content || null,
          rawPayload: payload.rawPayload ? JSON.stringify(payload.rawPayload) : null,
          depositOrderId: deposit.id,
        },
      });

      return {
        success: false,
        error: `Số tiền thanh toán (${payload.amount}đ) không đủ cho lệnh nạp tiền (${deposit.amount}đ)`,
        depositCode,
      };
    }

    // Execute atomic transaction for wallet top-up
    await prisma.$transaction(async (tx) => {
      // 1. Mark deposit as COMPLETED
      await tx.depositOrder.update({
        where: { id: deposit.id },
        data: {
          status: DepositStatus.COMPLETED,
          paidAt: new Date(),
        },
      });

      // 2. Credit user balance & totalDeposited
      const updatedUser = await tx.user.update({
        where: { id: deposit.userId },
        data: {
          balance: { increment: deposit.amount },
          totalDeposited: { increment: deposit.amount },
        },
      });

      // 3. Create WalletTransaction ledger entry
      await tx.walletTransaction.create({
        data: {
          userId: deposit.userId,
          type: WalletTransactionType.TOPUP,
          amount: deposit.amount,
          balanceBefore: deposit.user.balance,
          balanceAfter: updatedUser.balance,
          referenceId: deposit.depositCode,
          description: `Nạp tiền tự động qua VietQR (${deposit.depositCode})`,
        },
      });

      // 4. Create PaymentTransaction
      await tx.paymentTransaction.create({
        data: {
          transactionId: payload.transactionId,
          amount: Math.round(payload.amount),
          bankCode: payload.bankCode || null,
          content: payload.content || null,
          rawPayload: payload.rawPayload ? JSON.stringify(payload.rawPayload) : null,
          depositOrderId: deposit.id,
        },
      });
    });

    return {
      success: true,
      status: DepositStatus.COMPLETED,
      message: "Nạp tiền vào ví thành công",
      depositCode,
    };
  }

  // 3. Order Code Extraction
  const orderCode = parseOrderCodeFromMemo(payload.content || "");
  if (!orderCode) {
    await prisma.paymentTransaction.create({
      data: {
        transactionId: payload.transactionId,
        amount: Math.round(payload.amount),
        bankCode: payload.bankCode || null,
        content: payload.content || null,
        rawPayload: payload.rawPayload ? JSON.stringify(payload.rawPayload) : null,
        orderId: null,
      },
    });

    return {
      success: false,
      error: "Order code not found in payment content",
    };
  }

  // 4. Order Lookup
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              fulfillmentType: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    await prisma.paymentTransaction.create({
      data: {
        transactionId: payload.transactionId,
        amount: Math.round(payload.amount),
        bankCode: payload.bankCode || null,
        content: payload.content || null,
        rawPayload: payload.rawPayload ? JSON.stringify(payload.rawPayload) : null,
        orderId: null,
      },
    });

    return {
      success: false,
      orderCode,
      error: `Order ${orderCode} not found`,
    };
  }

  // 4. Amount Verification
  if (payload.amount < order.totalAmount) {
    await prisma.paymentTransaction.create({
      data: {
        transactionId: payload.transactionId,
        amount: Math.round(payload.amount),
        bankCode: payload.bankCode || null,
        content: payload.content || null,
        rawPayload: payload.rawPayload ? JSON.stringify(payload.rawPayload) : null,
        orderId: order.id,
      },
    });

    return {
      success: false,
      orderCode: order.orderCode,
      error: `Underpaid transaction: received ${payload.amount}, expected ${order.totalAmount}`,
    };
  }

  // 5. Expiration Guard for PENDING orders
  if (order.status === OrderStatus.PENDING && new Date() > order.expiresAt) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.EXPIRED },
    });
    await releaseExpiredReservations();
    order.status = OrderStatus.EXPIRED;
  }

  // 6. State Transition (Atomic Transaction for PENDING orders)
  if (order.status === OrderStatus.PENDING) {
    await prisma.$transaction(
      async (tx) => {
        await tx.paymentTransaction.create({
          data: {
            transactionId: payload.transactionId,
            amount: Math.round(payload.amount),
            bankCode: payload.bankCode || null,
            content: payload.content || null,
            rawPayload: payload.rawPayload
              ? JSON.stringify(payload.rawPayload)
              : null,
            orderId: order.id,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: new Date(),
          },
        });

        await commitReservedItemsToSold(order.id, tx);
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );

    // Fulfill dropship items via upstream if any
    const hasDropshipItems = order.orderItems.some(
      (item) => item.product?.fulfillmentType === FulfillmentType.API_DROPSHIP
    );

    if (hasDropshipItems) {
      try {
        await fulfillOrderViaUpstream(order.id);
      } catch (upstreamErr) {
        console.error(
          `Failed to automatically fulfill dropship order ${order.id} via upstream:`,
          upstreamErr
        );
      }
    }

    return {
      success: true,
      orderCode: order.orderCode,
      status: OrderStatus.PAID,
    };
  }

  if (order.status === OrderStatus.PAID) {
    await prisma.paymentTransaction.create({
      data: {
        transactionId: payload.transactionId,
        amount: Math.round(payload.amount),
        bankCode: payload.bankCode || null,
        content: payload.content || null,
        rawPayload: payload.rawPayload
          ? JSON.stringify(payload.rawPayload)
          : null,
        orderId: order.id,
      },
    });

    return {
      success: true,
      orderCode: order.orderCode,
      status: OrderStatus.PAID,
      message: "Order is already paid",
    };
  }

  if (order.status === OrderStatus.EXPIRED) {
    await prisma.paymentTransaction.create({
      data: {
        transactionId: payload.transactionId,
        amount: Math.round(payload.amount),
        bankCode: payload.bankCode || null,
        content: payload.content || null,
        rawPayload: payload.rawPayload
          ? JSON.stringify(payload.rawPayload)
          : null,
        orderId: order.id,
      },
    });

    return {
      success: false,
      orderCode: order.orderCode,
      status: OrderStatus.EXPIRED,
      error: "Order has expired. Payment logged for manual review.",
    };
  }

  // Other statuses (e.g. CANCELLED)
  await prisma.paymentTransaction.create({
    data: {
      transactionId: payload.transactionId,
      amount: Math.round(payload.amount),
      bankCode: payload.bankCode || null,
      content: payload.content || null,
      rawPayload: payload.rawPayload
        ? JSON.stringify(payload.rawPayload)
        : null,
      orderId: order.id,
    },
  });

  return {
    success: false,
    orderCode: order.orderCode,
    status: order.status,
    error: `Order has status ${order.status}. Payment logged for manual review.`,
  };
}
