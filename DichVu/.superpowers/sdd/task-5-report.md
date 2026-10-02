# Task 5 Report: Automated Payment Webhook Handler (PayOS / SePay)

## Status: COMPLETE

## Summary of Changes:
1. **Inventory Service Update (`src/services/inventory.service.ts`)**:
   - Enhanced `commitReservedItemsToSold(orderId, txClient?)` to optionally accept an interactive transaction client, ensuring atomic commits when called within `prisma.$transaction`.

2. **Payment Service (`src/services/payment.service.ts`)**:
   - `normalizeTransactionPayload(raw)`: Standardizes webhook payloads across standard banking formats, SePay (`id`, `transferAmount`, `content`), and PayOS (`data: { reference, orderCode, amount, description, counterAccountBankId }`).
   - `handleIncomingTransaction(payload)`:
     - **Idempotency Guard:** Checks `prisma.paymentTransaction.findUnique({ where: { transactionId } })`. Returns immediately if duplicate.
     - **Order Code Extraction:** Uses `parseOrderCodeFromMemo` to extract `ORD\d{6}`. Logs unassociated transaction if missing or invalid.
     - **Order Lookup & Amount Verification:** Validates order existence and checks `payload.amount >= order.totalAmount`. Flags underpaid transactions without releasing stock.
     - **Atomic State Transition:** In `prisma.$transaction`, creates `PaymentTransaction`, updates `Order.status = PAID` and `paidAt = now()`, and commits reserved `ProductItem` records to `SOLD`.
     - Handles `EXPIRED` and already `PAID` statuses properly.

3. **Payment Webhook Route (`src/app/api/webhooks/payment/route.ts`)**:
   - `POST /api/webhooks/payment`:
     - Checks `PAYMENT_WEBHOOK_SECRET` via `x-webhook-secret`, Bearer token, or query param (`token`/`secret`) when configured in environment.
     - Returns 400 for malformed JSON or payloads missing key transaction fields.
     - Returns 200 with result on success or idempotent replay.

4. **Tests (`tests/services/payment.service.test.ts`)**:
   - 14 comprehensive unit and route integration tests covering normal payments, idempotency, underpayment, missing memo codes, expired orders, already-paid orders, SePay/PayOS format handling, and secret authentication.
