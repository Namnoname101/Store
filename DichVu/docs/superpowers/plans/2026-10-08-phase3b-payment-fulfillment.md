# Phase 3B: Payment Reconciliation & Automated Fulfillment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, fault-tolerant payment reconciliation, 10-minute QR lifecycle, concurrency-safe automated fulfillment pipeline, and Owner-only manual reconciliation dashboard for Daitruong Store.

**Architecture:** 
1. Database extensions adding `PaymentIntent` (10m QR lifecycle), `OrderItem.targetLink`, `Order.accessToken` (secure guest lookup), and `ReconciliationStatus` on orders and transactions.
2. Webhook reconciliation engine categorizing incoming payments into MATCHED, UNDERPAID, OVERPAID, EXPIRED_PAYMENT, or UNMATCHED, preventing auto-delivery on ambiguous transactions and idempotently ignoring duplicate replays.
3. Automated fulfillment pipeline with concurrency locks, item-specific dropship routing, bounded retries, and white-label customer delivery.
4. Admin Owner dashboard for reviewing mismatching transactions, overriding matches, and auditing all manual interventions.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, SQLite, VietQR / SePay / PayOS, Vitest, Tailwind CSS, Lucide icons.

**Spec:** User specification for Phase 3B: Payment Reconciliation & Automated Fulfillment.

## Global Constraints
- Primary color: Blue `#2563EB`, Light mode default with Dark mode support.
- QR payment validity duration: exactly 10 minutes (600 seconds).
- Zero fake reviews, zero fake counts, zero unverified auto-deliveries.
- Never mention supplier names ("Taphoammo", "Trumthe", "upstream", "đối tác") to customers.
- Only a single Admin role: Owner.
- Do not deploy to Fly.io or merge `main` until explicitly authorized.

## Review Focus
1. An underpaid transfer (e.g. 30,000đ for a 50,000đ order) must NOT release secret keys or trigger dropship; order must transition to `UNDERPAID` reconciliation status.
2. A transfer arriving after QR 10m expiry must NOT automatically sell inventory that may already have been released or purchased by someone else; must transition to `EXPIRED_PAYMENT` for Owner review.
3. Rapid duplicate webhooks or replay attacks with identical `transactionId` must be strictly idempotent with zero duplicate stock deductions or duplicate supplier orders.
4. Guest customers without email must be given a cryptographically secure URL with `accessToken` so random users cannot brute-force `ORDxxxxxx` to inspect delivered secrets.
5. In multi-item dropship orders, each product must receive its own distinct target link rather than a concatenated customer note.

---

### Task 1: Audit Report of Phase 3A & Schema Migration Versioning

**Files:**
- Create: `docs/superpowers/audits/2026-10-08-phase3a-audit.md`
- Create: `prisma/migrations/0_phase3a_baseline/migration.sql` (baseline migration snapshot & rollback script)
- Test: `tests/services/order.service.test.ts`

**Interfaces:**
- Produces: Formal audit report answering all 6 questions with database proof and documented rollback procedure for `Order.customerEmail` nullability.

- [ ] **Step 1: Write Phase 3A Audit Report**
  Document the answers to the 6 questions in `docs/superpowers/audits/2026-10-08-phase3a-audit.md`:
  1. How `Order.customerEmail` was turned nullable: via `prisma/schema.prisma` `customerEmail String?` and `npx prisma db push`.
  2. Data preservation: Verify existing orders in `dev.db` were 100% preserved.
  3. Multi-item dropship routing: Highlight current limitation where `customerNote` is merged across all items, and propose adding `OrderItem.targetLink`.
  4. Guest lookup access: Highlight current reliance on `orderCode` in localStorage, and propose adding cryptographically secure `Order.accessToken`.
  5. Server-side validation: Confirm server checks real DB price, stock count, active status, min/max bounds, and coupons.
  6. Duplicate creation guard: Highlight lack of `idempotencyKey` on `createOrder` and propose adding it.

- [ ] **Step 2: Create SQLite Migration Snapshot & Rollback Plan**
  Create SQL script to recreate schema and rollback script in `prisma/migrations/rollback_customer_email.sql`.

- [ ] **Step 3: Verify and Commit**
  Run `npx vitest run tests/services/order.service.test.ts` to ensure 100% pass.
  Commit: `git commit -m "docs(audit): complete Phase 3A audit and migration rollback documentation"`

---

### Task 2: Schema Enhancements (PaymentIntent, Order AccessToken, OrderItem TargetLink, IdempotencyKey & AuditLog)

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Test: `tests/db-phase3b-schema.test.ts`

**Interfaces:**
- Produces:
  - `model PaymentIntent`: `id`, `orderId`, `intentCode`, `qrUrl`, `amount`, `expiresAt`, `status` (ACTIVE, EXPIRED, PAID, SUPERSEDED).
  - `model Order`: `accessToken` (UUID), `idempotencyKey` (unique), `reconciliationStatus` (MATCHED, UNDERPAID, OVERPAID, MISMATCH_MEMO, EXPIRED_PAYMENT, MANUAL_RESOLVED), `reconciliationNote`, `reconciledAt`, `reconciledBy`.
  - `model OrderItem`: `targetLink`, `customerNote`.
  - `model PaymentTransaction`: `reconciliationStatus`, `reconciliationNote`, `resolvedAt`, `resolvedBy`.
  - `model AuditLog`: `id`, `action`, `entityType`, `entityId`, `details`, `performedBy`, `createdAt`.

- [ ] **Step 1: Write failing test for new Prisma models and fields in `tests/db-phase3b-schema.test.ts`**
  Test creating an Order with `accessToken`, `idempotencyKey`, `PaymentIntent`, and `OrderItem.targetLink`.
- [ ] **Step 2: Update `prisma/schema.prisma`**
  Add `PaymentIntent`, `AuditLog`, and extend `Order`, `OrderItem`, and `PaymentTransaction`.
- [ ] **Step 3: Run `npx prisma db push` and `npx prisma generate`**
- [ ] **Step 4: Run test to verify it passes**
  Run `npx vitest run tests/db-phase3b-schema.test.ts`
- [ ] **Step 5: Commit**
  `git commit -m "feat(db): add PaymentIntent, Order accessToken, targetLink and reconciliation schema models"`

---

### Task 3: Payment Intent & 10-Minute QR Lifecycle with Safe Re-generation Engine

**Files:**
- Create: `src/services/payment-intent.service.ts`
- Modify: `src/services/order.service.ts`
- Modify: `src/lib/vietqr.ts` (set default expiry to 10 minutes / 600s)
- Create: `src/app/api/orders/[orderCode]/regenerate-qr/route.ts`
- Test: `tests/services/payment-intent.service.test.ts`

**Interfaces:**
- Produces:
  - `createPaymentIntent(orderId: string): Promise<PaymentIntent>` (creates active 10m intent).
  - `getActivePaymentIntent(orderId: string): Promise<PaymentIntent | null>`.
  - `regeneratePaymentIntent(orderCode: string, token: string): Promise<RegenerateResult>` (releases expired reservations, re-validates prices/stock/vouchers, creates new 10m intent, preserves historical records).

- [ ] **Step 1: Write failing tests in `tests/services/payment-intent.service.test.ts`**
  Test 10m expiration, single active intent constraint, and `regeneratePaymentIntent` re-validating stock/price and superseding old intent.
- [ ] **Step 2: Implement `src/services/payment-intent.service.ts`**
- [ ] **Step 3: Implement API route `POST /api/orders/[orderCode]/regenerate-qr`**
- [ ] **Step 4: Update `createOrder` in `src/services/order.service.ts`**
  Ensure order creation generates initial 10m `PaymentIntent`, crypto `accessToken`, and respects `idempotencyKey`.
- [ ] **Step 5: Run tests to verify all pass**
  Run `npx vitest run tests/services/payment-intent.service.test.ts`
- [ ] **Step 6: Commit**
  `git commit -m "feat(payment): implement 10-minute QR payment intent and safe regeneration engine"`

---

### Task 4: Bank Webhook & Multi-tier Reconciliation Engine

**Files:**
- Modify: `src/services/payment.service.ts`
- Modify: `src/app/api/webhooks/payment/route.ts`
- Test: `tests/services/payment-reconciliation.test.ts`

**Interfaces:**
- Produces:
  - `handleIncomingTransaction` handles:
    - Normal MATCHED payment within 10m window -> commits stock, transitions to PAID, triggers fulfillment.
    - UNDERPAID -> records transaction, marks `reconciliationStatus = "UNDERPAID"`, halts auto-delivery.
    - OVERPAID -> records transaction, marks `reconciliationStatus = "OVERPAID"`, records excess.
    - EXPIRED_PAYMENT -> records transaction, marks `reconciliationStatus = "EXPIRED_PAYMENT"`, halts auto-delivery.
    - UNMATCHED_ORDER / MISMATCH_MEMO -> records transaction with `orderId: null`, marks for Owner review.
    - Replay/Duplicate transaction -> returns `isDuplicate: true` with zero mutations.

- [ ] **Step 1: Write failing tests in `tests/services/payment-reconciliation.test.ts`**
  Cover exact match, underpaid, overpaid, expired payment, missing memo, and duplicate webhook replay.
- [ ] **Step 2: Implement reconciliation logic in `src/services/payment.service.ts`**
- [ ] **Step 3: Update `src/app/api/webhooks/payment/route.ts`**
- [ ] **Step 4: Run tests to verify all pass**
  Run `npx vitest run tests/services/payment-reconciliation.test.ts`
- [ ] **Step 5: Commit**
  `git commit -m "feat(reconciliation): implement multi-tier bank payment reconciliation and webhook guard"`

---

### Task 5: Concurrency-Safe Automated Fulfillment Engine

**Files:**
- Modify: `src/services/upstream-fulfillment.service.ts`
- Modify: `src/services/order.service.ts`
- Test: `tests/services/concurrency-fulfillment.test.ts`

**Interfaces:**
- Consumes: `order.orderItems` with item-specific `targetLink`.
- Produces:
  - `fulfillOrderViaUpstream(orderId: string): Promise<UpstreamFulfillmentResult>`:
    - Acquires optimistic concurrency lock (ensuring only 1 worker fulfills the order).
    - Routes each dropship item with its specific `item.targetLink`.
    - Implements bounded retries (max 3) with supplier idempotency key.
    - If supplier fails or is down: evaluates fallback equivalent supplier mapping if configured; if none, sets `upstreamStatus = FAILED` and `upstreamError = "Cần Chủ sở hữu xử lý"`.
    - Never auto-refunds without Owner authorization.

- [ ] **Step 1: Write failing tests in `tests/services/concurrency-fulfillment.test.ts`**
  Test concurrent execution prevention, item-specific target link routing, and failed supplier escalation.
- [ ] **Step 2: Implement concurrency lock and per-item routing in `src/services/upstream-fulfillment.service.ts`**
- [ ] **Step 3: Run tests to verify all pass**
  Run `npx vitest run tests/services/concurrency-fulfillment.test.ts`
- [ ] **Step 4: Commit**
  `git commit -m "feat(fulfillment): implement concurrency lock, per-item dropship routing and bounded retry"`

---

### Task 6: Customer Checkout & Secure Token Access UI

**Files:**
- Modify: `src/components/CheckoutClient.tsx`
- Modify: `src/components/CountdownTimer.tsx` (ensure accurate 10m countdown and onExpire callback)
- Modify: `src/app/checkout/[orderCode]/page.tsx` (support `?token=[accessToken]`)
- Modify: `src/app/order-success/[orderCode]/page.tsx` (support `?token=[accessToken]`)
- Modify: `src/lib/order-storage.ts` (store and retrieve `accessToken`)
- Test: `tests/ui/checkout-reconciliation-ui.test.ts`

**Interfaces:**
- Produces:
  - Clear customer stages: Chờ thanh toán (10m QR) → Đang xác minh → Đang xử lý → Hoàn thành.
  - Expired QR state with "Tạo lại mã QR" CTA (calls `/api/orders/[orderCode]/regenerate-qr`).
  - Underpaid / Reconciliation state: "Hệ thống đã nhận [amount]đ, còn thiếu [diff]đ. Đang chờ hỗ trợ đối soát."
  - Secure Guest Link: Guest orders without email/auth can only be accessed with matching `token`, preventing enumeration.

- [ ] **Step 1: Write failing UI tests in `tests/ui/checkout-reconciliation-ui.test.ts`**
- [ ] **Step 2: Update `CountdownTimer.tsx` and `CheckoutClient.tsx`**
  Add 10m countdown, QR expired view with regenerate button, reconciliation pending view, and secure token access.
- [ ] **Step 3: Update `src/app/checkout/[orderCode]/page.tsx` and `src/app/order-success/[orderCode]/page.tsx`**
- [ ] **Step 4: Run tests to verify all pass**
  Run `npx vitest run tests/ui/checkout-reconciliation-ui.test.ts`
- [ ] **Step 5: Commit**
  `git commit -m "feat(ui): implement 4-stage checkout status, 10m QR expiry, and secure token access"`

---

### Task 7: Admin Owner Manual Reconciliation Dashboard & Audit Logging

**Files:**
- Create: `src/services/admin-reconciliation.service.ts`
- Create: `src/app/api/admin/reconciliation/route.ts`
- Create: `src/app/api/admin/reconciliation/[id]/resolve/route.ts`
- Create: `src/app/admin/reconciliation/page.tsx`
- Create: `src/components/admin/ReconciliationManagerClient.tsx`
- Modify: `src/app/admin/layout.tsx` (add "Đối soát" navigation link)
- Test: `tests/services/admin-reconciliation.test.ts`

**Interfaces:**
- Produces:
  - Single Owner screen displaying all problematic transactions (`UNDERPAID`, `OVERPAID`, `EXPIRED_PAYMENT`, `UNMATCHED_ORDER`).
  - Owner resolution actions:
    - Match order & fulfill: Overrides order status to PAID, triggers delivery, writes AuditLog.
    - Mark refunded: Sets refund note, writes AuditLog.
    - Ignore/Dismiss: Marks invalid/fraudulent transaction, writes AuditLog.
  - AuditLog tracking: stores actor ("OWNER"), action, timestamp, and rationale.

- [ ] **Step 1: Write failing tests in `tests/services/admin-reconciliation.test.ts`**
- [ ] **Step 2: Implement `src/services/admin-reconciliation.service.ts` and API routes**
- [ ] **Step 3: Implement `src/app/admin/reconciliation/page.tsx` and client component**
- [ ] **Step 4: Update Admin navigation in `src/app/admin/layout.tsx`**
- [ ] **Step 5: Run tests to verify all pass**
  Run `npx vitest run tests/services/admin-reconciliation.test.ts`
- [ ] **Step 6: Commit**
  `git commit -m "feat(admin): implement Owner manual reconciliation dashboard and audit logging"`

---

### Task 8: Comprehensive Test Suite, Build Verification & Handoff

**Files:**
- Create: `tests/ui/phase3b-full-integration.test.ts`
- Modify: `task.md` (track Phase 3B checklist)

**Interfaces:**
- Produces: Full integration verification covering all 10 mandated test cases from Section 7:
  1. QR valid & expired.
  2. Regenerate QR with stock/price validation.
  3. Underpaid, overpaid, and mismatched memo payments.
  4. Late payment after expiry.
  5. Webhook duplicate & out-of-order replay idempotency.
  6. Duplicate order creation guard (`idempotencyKey`).
  7. Automated fulfillment: success, failure, timeout escalation.
  8. Multi-item cart with per-item dropship links.
  9. Guest checkout with secure token access.
  10. Old order data preservation and backward compatibility.

- [ ] **Step 1: Implement `tests/ui/phase3b-full-integration.test.ts`**
- [ ] **Step 2: Run `npx tsc --noEmit` and ensure 0 errors**
- [ ] **Step 3: Run `npx vitest run` and ensure 100% tests pass**
- [ ] **Step 4: Run `npm run build` and ensure clean production build**
- [ ] **Step 5: Final commit on `feat/phase3b-payment-fulfillment`**
