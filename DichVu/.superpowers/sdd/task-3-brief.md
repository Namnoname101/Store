# Task 3: VietQR Generation & Verification Utilities

**Files:**
- Create: `src/lib/vietqr.ts`
- Test: `tests/lib/vietqr.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `generateVietQrUrl(bankId: string, accountNo: string, amount: number, memo: string, template?: 'compact2' | 'compact' | 'qr_only' | 'print'): string`
  - `parseOrderCodeFromMemo(memo: string): string | null`
  - `generateOrderCode(): string`
  - `validateOrderCode(code: string): boolean`
  - `SUPPORTED_BANKS`: Array/Record of common bank codes and names (MB, VCB, TCB, VPB, TPB, ACB, BIDV, VietinBank)

## Requirements:
1. `generateVietQrUrl(bankId, accountNo, amount, memo, template = 'compact2')`:
   - Builds standard VietQR QuickLink:
     `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}`
   - Validates that amount is positive integer and memo is trimmed.
2. `parseOrderCodeFromMemo(memo)`:
   - Scans transfer description text (which may contain bank prefixes, customer names, transaction timestamps) for order codes matching `ORD\d{6}` (case-insensitive).
   - Returns the standardized uppercase order code (e.g. `'ORD123456'`) or `null` if not found.
3. `generateOrderCode()`:
   - Generates random code in format `ORD` + 6 digits (e.g. `ORD489201`).
4. `validateOrderCode(code)`:
   - Returns true if code matches `/^ORD\d{6}$/i`.
5. TDD:
   - Write failing tests in `tests/lib/vietqr.test.ts`.
   - Implement `src/lib/vietqr.ts`.
   - Verify all tests pass.
6. Commit: `feat: implement VietQR generation and memo parser`.
