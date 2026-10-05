export type VietQrTemplate = 'compact2' | 'compact' | 'qr_only' | 'print';

export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
  bin?: string;
}

const BANKS_DATA: BankInfo[] = [
  { code: 'MB', name: 'Ngân hàng TMCP Quân Đội', shortName: 'MBBank', bin: '970422' },
  { code: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', shortName: 'Vietcombank', bin: '970436' },
  { code: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', shortName: 'Techcombank', bin: '970407' },
  { code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank', bin: '970432' },
  { code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank', bin: '970423' },
  { code: 'ACB', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB', bin: '970416' },
  { code: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', shortName: 'BIDV', bin: '970418' },
  { code: 'VietinBank', name: 'Ngân hàng TMCP Công Thương Việt Nam', shortName: 'VietinBank', bin: '970415' },
];

export type SupportedBanks = BankInfo[] & Record<string, BankInfo>;

export const SUPPORTED_BANKS: SupportedBanks = Object.assign(
  [...BANKS_DATA],
  Object.fromEntries(BANKS_DATA.map((bank) => [bank.code, bank]))
) as SupportedBanks;

/**
 * Builds standard VietQR QuickLink image URL:
 * https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}
 */
export function generateVietQrUrl(
  bankId: string,
  accountNo: string,
  amount: number,
  memo: string,
  template: VietQrTemplate = 'compact2'
): string {
  if (!bankId || typeof bankId !== 'string' || !bankId.trim()) {
    throw new Error('Bank ID is required');
  }

  if (!accountNo || typeof accountNo !== 'string' || !accountNo.trim()) {
    throw new Error('Account number is required');
  }

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }

  if (!memo || typeof memo !== 'string' || !memo.trim()) {
    throw new Error('Memo is required');
  }

  const cleanBankId = bankId.trim();
  const cleanAccountNo = accountNo.trim();
  const cleanMemo = memo.trim();

  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(
    cleanMemo
  )}`;
}

/**
 * Scans transfer description text for order codes matching ORD\d{6} (case-insensitive).
 * Returns the standardized uppercase order code (e.g. 'ORD123456') or null if not found.
 */
export function parseOrderCodeFromMemo(memo: string): string | null {
  if (!memo || typeof memo !== 'string') {
    return null;
  }

  const match = memo.match(/(?:^|[^a-zA-Z0-9])(ORD\d{6})(?![a-zA-Z0-9])/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Generates random code in format ORD + 6 digits (e.g. ORD489201).
 */
export function generateOrderCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `ORD${digits}`;
}

/**
 * Validates order code against standard pattern: /^ORD\d{6}$/i.
 */
export function validateOrderCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  return /^ORD\d{6}$/i.test(code.trim());
}

/**
 * Extracts deposit code in format NAP + 6 digits (e.g. NAP482910) from transaction memo/content.
 */
export function parseDepositCodeFromMemo(memo: string): string | null {
  if (!memo || typeof memo !== 'string') {
    return null;
  }

  const match = memo.match(/(?:^|[^a-zA-Z0-9])(NAP\d{6})(?![a-zA-Z0-9])/i);
  return match ? match[1].toUpperCase() : null;
}
