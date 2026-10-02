import { prisma, OrderStatus } from "@/lib/prisma";
import { commitReservedItemsToSold, releaseExpiredReservations } from "@/services/inventory.service";
import { parseOrderCodeFromMemo } from "@/lib/vietqr";

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
  const txId =
    raw.transactionId ??
    raw.id ??
    raw.referenceCode ??
    raw.reference;

  const rawAmt =
    raw.amount ??
    raw.transferAmount ??
    raw.amountIn;

  const amount =
    typeof rawAmt === "string" ? parseFloat(rawAmt) : Number(rawAmt);
  const content = raw.content ?? raw.description ?? "";
  const bankCode = raw.bankCode ?? raw.gateway;

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
    if (existingTx.orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: existingTx.orderId },
        select: { orderCode: true },
      });
      orderCode = existingOrder?.orderCode;
    }

    return {
      success: true,
      isDuplicate: true,
      message: "Transaction already processed",
      orderCode,
    };
  }

  // 2. Order Code Extraction
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

  // 3. Order Lookup
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: { orderItems: true },
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
