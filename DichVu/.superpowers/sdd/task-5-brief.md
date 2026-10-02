# Task 5: Automated Payment Webhook Handler (PayOS / SePay)

**Files:**
- Create: `src/services/payment.service.ts`
- Create: `src/app/api/webhooks/payment/route.ts`
- Test: `tests/services/payment.service.test.ts`

**Interfaces:**
- Consumes:
  - `prisma` from `@/lib/prisma`
  - `commitReservedItemsToSold` from `@/services/inventory.service`
  - `parseOrderCodeFromMemo` from `@/lib/vietqr`
- Produces:
  - `handleIncomingTransaction(payload: BankTransactionPayload): Promise<PaymentProcessResult>`
  - `POST /api/webhooks/payment`

## Requirements:
1. `handleIncomingTransaction(payload)`:
   - Input payload format (supporting standard bank/PayOS/SePay webhook format):
     `{ transactionId: string, amount: number, content: string, bankCode?: string }`
   - **Idempotency Guard:** Query `prisma.paymentTransaction.findUnique({ where: { transactionId } })`. If exists, return `{ success: true, isDuplicate: true, message: "Transaction already processed" }` immediately.
   - **Order Code Extraction:** Uses `parseOrderCodeFromMemo(payload.content)`. If not found, log transaction without order and return error.
   - **Order Lookup:** Find order by `orderCode` including `orderItems`.
   - **Amount Verification:** If `payload.amount < order.totalAmount`, log transaction, do NOT release secret items, return `{ success: false, error: "Underpaid transaction" }`.
   - **State Transition (Atomic Transaction):**
     - When `order.status === 'PENDING'`:
       - Run `prisma.$transaction`:
         - Create `PaymentTransaction` with `transactionId`, `amount`, `bankCode`, `content`, `orderId`.
         - Update `Order`: `status = 'PAID'`, `paidAt = new Date()`.
         - Call `commitReservedItemsToSold(order.id)`.
       - Return `{ success: true, orderCode: order.orderCode, status: 'PAID' }`.
     - When `order.status === 'PAID'`: Create transaction record and return success.
     - When `order.status === 'EXPIRED'`: Log transaction, flag manual review.
2. Webhook Route (`POST /api/webhooks/payment`):
   - Accepts JSON payload with banking transaction.
   - Optional webhook security token check (`x-webhook-secret` or query token if `PAYMENT_WEBHOOK_SECRET` is set in env).
   - Returns 200 HTTP status on successful processing or idempotent replay.
   - Returns 400 on malformed payloads.
3. TDD:
   - Write failing tests in `tests/services/payment.service.test.ts` covering:
     - Normal successful payment and automatic status change to `PAID`.
     - Duplicate webhook retry handling (idempotency).
     - Underpaid transactions.
     - Missing or malformed order codes.
     - HTTP API route response codes.
   - Implement `src/services/payment.service.ts` and `src/app/api/webhooks/payment/route.ts`.
   - Verify all tests pass.
4. Commit: `feat: implement idempotent automated payment webhook handler`.
