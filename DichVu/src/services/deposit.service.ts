import prisma, { DepositStatus } from "@/lib/prisma";
import { generateVietQrUrl } from "@/lib/vietqr";

export const MIN_DEPOSIT_AMOUNT = 20000;
const DEPOSIT_EXPIRATION_MINUTES = 30;

export interface DepositBankInfo {
  bankId: string;
  accountNo: string;
  accountName: string;
}

export function getDepositBankInfo(): DepositBankInfo {
  return {
    bankId: process.env.BANK_ID || "TPB",
    accountNo: process.env.BANK_ACCOUNT_NO || "93320022006",
    accountName: process.env.BANK_ACCOUNT_NAME || "TRUONG CONG QUANG DAI",
  };
}

function generateDepositCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `NAP${digits}`;
}

export interface DepositOrderResponse {
  id: string;
  depositCode: string;
  amount: number;
  status: string;
  qrCodeUrl: string;
  bankInfo: DepositBankInfo;
  expiresAt: string;
  createdAt: string;
}

export async function createDepositOrder(
  userId: string,
  amount: number
): Promise<DepositOrderResponse> {
  if (!amount || typeof amount !== "number" || amount < MIN_DEPOSIT_AMOUNT) {
    throw new Error(`Số tiền nạp tối thiểu là ${MIN_DEPOSIT_AMOUNT.toLocaleString("vi-VN")}đ`);
  }

  const cleanAmount = Math.floor(amount);
  const bankInfo = getDepositBankInfo();
  const expiresAt = new Date(Date.now() + DEPOSIT_EXPIRATION_MINUTES * 60 * 1000);

  // Generate unique deposit code
  let depositCode = generateDepositCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.depositOrder.findUnique({
      where: { depositCode },
    });
    if (!existing) break;
    depositCode = generateDepositCode();
    attempts++;
  }

  const deposit = await prisma.depositOrder.create({
    data: {
      depositCode,
      userId,
      amount: cleanAmount,
      status: DepositStatus.PENDING,
      expiresAt,
    },
  });

  const qrCodeUrl = generateVietQrUrl(
    bankInfo.bankId,
    bankInfo.accountNo,
    cleanAmount,
    depositCode,
    "compact2"
  );

  return {
    id: deposit.id,
    depositCode: deposit.depositCode,
    amount: deposit.amount,
    status: deposit.status,
    qrCodeUrl,
    bankInfo,
    expiresAt: deposit.expiresAt.toISOString(),
    createdAt: deposit.createdAt.toISOString(),
  };
}

export interface DepositStatusResponse {
  id: string;
  depositCode: string;
  amount: number;
  status: string;
  isPaid: boolean;
  isExpired: boolean;
  paidAt?: string | null;
  expiresAt: string;
  bankInfo: DepositBankInfo;
  qrCodeUrl: string;
}

export async function getDepositOrderStatus(
  depositCode: string,
  userId?: string
): Promise<DepositStatusResponse> {
  const deposit = await prisma.depositOrder.findUnique({
    where: { depositCode },
    include: { user: true },
  });

  if (!deposit) {
    throw new Error(`Không tìm thấy lệnh nạp tiền "${depositCode}"`);
  }

  if (userId && deposit.userId !== userId) {
    throw new Error("Bạn không có quyền xem lệnh nạp tiền này");
  }

  const now = new Date();
  let currentStatus = deposit.status;
  const isExpired = currentStatus === DepositStatus.PENDING && now > deposit.expiresAt;

  if (isExpired && currentStatus !== DepositStatus.EXPIRED) {
    await prisma.depositOrder.update({
      where: { id: deposit.id },
      data: { status: DepositStatus.EXPIRED },
    });
    currentStatus = DepositStatus.EXPIRED;
  }

  const bankInfo = getDepositBankInfo();
  const qrCodeUrl = generateVietQrUrl(
    bankInfo.bankId,
    bankInfo.accountNo,
    deposit.amount,
    deposit.depositCode,
    "compact2"
  );

  return {
    id: deposit.id,
    depositCode: deposit.depositCode,
    amount: deposit.amount,
    status: currentStatus,
    isPaid: currentStatus === DepositStatus.COMPLETED,
    isExpired: currentStatus === DepositStatus.EXPIRED,
    paidAt: deposit.paidAt ? deposit.paidAt.toISOString() : null,
    expiresAt: deposit.expiresAt.toISOString(),
    bankInfo,
    qrCodeUrl,
  };
}
