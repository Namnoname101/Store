# Phase 3B.1: Payment Safety Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triệt để khắc phục các rủi ro thanh toán trong Phase 3B: chặn tự giao hàng khi OVERPAID, chuẩn hóa luồng hoàn tiền có chứng từ, thắt chặt xác thực webhook & idempotency, chống race condition, cô lập QR cũ/mới, đặt hạn 30 ngày cho guest accessToken, và cung cấp script migration an toàn kèm 12 regression tests.

**Architecture:** 
- Nâng cấp `payment.service.ts` để đưa `OVERPAID` vào hàng đợi `ReconciliationStatus.OVERPAID` (giữ nguyên `PENDING`, không kích hoạt `PAID`, không giao hàng).
- Bổ sung `refundStatus` (`REFUND_REQUESTED`, `REFUND_PENDING`, `REFUNDED`), `refundProof`, `refundedAt` và cơ chế xác minh hoàn tiền thủ công minh bạch vào `Order`, `PaymentTransaction`, và `admin-reconciliation.service.ts`.
- Bổ sung hàm quét giải phóng giữ chỗ nền `sweepExpiredPaymentIntents()`, kiểm tra tuổi đời intent để ngăn webhook của intent cũ thanh toán intent mới.
- Khóa bảo mật `accessToken` guest order với TTL 30 ngày và kiểm tra bắt buộc trên toàn bộ API tra cứu/thao tác đơn hàng.
- Lập migration SQL version hóa và bộ kiểm thử regression 12 kịch bản bảo vệ hệ thống.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, SQLite/PostgreSQL, Webhook Engine (VietQR/SePay/PayOS), Vitest.

**Spec:** Yêu cầu từ USER_REQUEST: Phase 3B.1 Payment Safety Hardening.

## Global Constraints
- Nền tảng: Daitruong Store (`e:\Du An\Web\DichVu`).
- Nhánh làm việc: `fix/phase3b1-payment-safety` (cut từ `feat/phase3b-payment-fulfillment`, commit `2937ee4`).
- Tuyệt đối KHÔNG deploy lên Fly.io hoặc push/merge vào `main`.
- Tuyệt đối KHÔNG sử dụng tiền thật hoặc gọi API nhà cung cấp thật trong tests.
- Single Admin: Chủ sở hữu.
- Báo cáo ngắn gọn, trực tiếp, minh bạch kết quả kiểm thử.

## Review Focus
1. `OVERPAID` tuyệt đối không tự chuyển `PAID` và không tự gọi `commitReservedItemsToSold` hay `fulfillOrderViaUpstream`.
2. Giao dịch ngân hàng đã dùng để thanh toán một đơn hàng không bao giờ được phép tái sử dụng cho đơn hàng khác.
3. Race condition giữa 2 webhook gửi cùng lúc hoặc giữa webhook và Admin bấm xác nhận đối soát.
4. Guest order `accessToken` hết hạn sau 30 ngày hoặc không khớp phải bị từ chối xem mã kích hoạt (keys) và tiến trình buff.
5. Webhook trả tiền cho một QR intent cũ đã hết hạn không được tự động kích hoạt intent mới đang hoạt động.

---

### Task 1: Fix OVERPAID Behavior & Strict Hold-For-Review Guard

**Files:**
- Modify: `src/services/payment.service.ts:420-470`
- Test: `tests/services/payment-reconciliation.test.ts`
- Test: `tests/ui/phase3b-full-integration.test.ts`

**Interfaces:**
- Consumes: `handleIncomingTransaction(payload: BankTransactionPayload)`
- Produces: `reconciliationStatus = ReconciliationStatus.OVERPAID`, `status = OrderStatus.PENDING`, `order.paidAt = null`, no fulfillment triggered.

- [ ] **Step 1: Write failing test in `tests/services/payment-reconciliation.test.ts` asserting OVERPAID keeps order PENDING and does not fulfill**
- [ ] **Step 2: Run test to verify it fails with current code**
- [ ] **Step 3: Update `src/services/payment.service.ts` to hold OVERPAID orders in PENDING and prevent auto-fulfillment**
- [ ] **Step 4: Update `tests/ui/phase3b-full-integration.test.ts` Scenario 6 to assert PENDING status for OVERPAID**
- [ ] **Step 5: Run tests and verify PASS**
- [ ] **Step 6: Commit changes**

---

### Task 2: Multi-Stage Refund Auditing & Manual Refund Proof Verification

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Modify: `src/services/admin-reconciliation.service.ts`
- Modify: `src/app/api/admin/reconciliation/[id]/resolve/route.ts`
- Modify: `src/components/admin/ReconciliationManagerClient.tsx`
- Test: `tests/services/admin-reconciliation.test.ts`

**Interfaces:**
- Consumes: `resolveReconciliation(txId, "MARK_REFUNDED", { refundProof, note, performedBy })`
- Produces: `refundStatus = "REFUNDED"`, `refundProof: string`, `refundedAt: Date`, transparent `AuditLog` entry.

- [ ] **Step 1: Write failing tests for refund proof validation in `tests/services/admin-reconciliation.test.ts`**
- [ ] **Step 2: Add `refundProof` and `refundStatus` fields to schema and update types**
- [ ] **Step 3: Enforce `refundProof` (mã giao dịch hoàn hoặc chứng từ) in `resolveReconciliation`**
- [ ] **Step 4: Update Admin UI `ReconciliationManagerClient.tsx` to require refund proof and clarify manual bank transfer process**
- [ ] **Step 5: Run vitest and verify PASS**
- [ ] **Step 6: Commit changes**

---

### Task 3: Webhook Authentication, Cross-Order Replay Prevention & Concurrency Locks

**Files:**
- Modify: `src/services/payment.service.ts`
- Modify: `src/app/api/webhooks/payment/route.ts`
- Modify: `src/services/admin-reconciliation.service.ts`
- Test: `tests/services/webhook-hardening.test.ts`

**Interfaces:**
- Consumes: Webhook POST requests & Admin match resolution
- Produces: Rejection of forged webhooks, atomic double-spend prevention, single-fulfillment mutex lock.

- [ ] **Step 1: Write failing tests for forged webhooks, duplicate bank tx assignment, and concurrent reconciliations in `tests/services/webhook-hardening.test.ts`**
- [ ] **Step 2: Implement strict webhook secret verification in `src/app/api/webhooks/payment/route.ts`**
- [ ] **Step 3: Ensure bank transactions cannot be re-linked to different orders once settled**
- [ ] **Step 4: Add optimistic/atomic concurrency lock in `resolveReconciliation` to prevent double-confirmation by concurrent Admin clicks**
- [ ] **Step 5: Run tests and verify PASS**
- [ ] **Step 6: Commit changes**

---

### Task 4: QR Intent Isolation, 600s Expiry Sweep & Late Payment Guard

**Files:**
- Modify: `src/services/payment-intent.service.ts`
- Modify: `src/services/payment.service.ts`
- Test: `tests/services/qr-intent-safety.test.ts`

**Interfaces:**
- Consumes: `sweepExpiredPaymentIntents()`, `getActivePaymentIntent(orderId)`
- Produces: Active intent strictly valid <= 600s, auto-release of unconfirmed stock holds, old intent payments held in EXPIRED_PAYMENT.

- [ ] **Step 1: Write failing tests for old intent cross-payment and automatic reservation release in `tests/services/qr-intent-safety.test.ts`**
- [ ] **Step 2: Implement `sweepExpiredPaymentIntents()` in `src/services/payment-intent.service.ts`**
- [ ] **Step 3: Update `handleIncomingTransaction` to verify whether payment matches an active intent or an expired/superseded intent**
- [ ] **Step 4: Run tests and verify PASS**
- [ ] **Step 5: Commit changes**

---

### Task 5: Guest Order AccessToken Hardening & 30-Day TTL Guard

**Files:**
- Modify: `src/lib/order-storage.ts`
- Modify: `src/app/api/orders/[orderCode]/status/route.ts`
- Modify: `src/app/api/orders/[orderCode]/buff-progress/route.ts`
- Modify: `src/app/api/orders/[orderCode]/refund-request/route.ts`
- Modify: `src/app/order-success/[orderCode]/page.tsx`
- Test: `tests/ui/guest-token-security.test.ts`

**Interfaces:**
- Consumes: `?token=[accessToken]` on customer order routes
- Produces: Strict 30-day token expiration, 401/403 masking of order secrets, sanitization against log leaks.

- [ ] **Step 1: Write failing tests for expired guest tokens (>30 days) and unauthorized API access in `tests/ui/guest-token-security.test.ts`**
- [ ] **Step 2: Implement token expiration validation (30 days from creation) and sanitize log output**
- [ ] **Step 3: Guard `/status`, `/buff-progress`, `/refund-request` and `/order-success` against missing or invalid tokens**
- [ ] **Step 4: Run tests and verify PASS**
- [ ] **Step 5: Commit changes**

---

### Task 6: Versioned Migration & Safe Production Rollback Assets

**Files:**
- Create: `prisma/migrations/20261008_phase3b_safety_hardening/migration.sql`
- Create: `prisma/migrations/20261008_phase3b_safety_hardening/rollback.sql`
- Create: `docs/superpowers/audits/2026-10-08-migration-verification.md`
- Test: `tests/db-migration-compatibility.test.ts`

**Interfaces:**
- Consumes: Existing SQLite / PostgreSQL database schemas
- Produces: Safe non-destructive column additions, backward compatibility verification, tested rollback script.

- [ ] **Step 1: Generate clean versioned SQL migration and rollback files**
- [ ] **Step 2: Write test verifying schema migrations don't destroy legacy order/payment data in `tests/db-migration-compatibility.test.ts`**
- [ ] **Step 3: Run migration tests and verify PASS**
- [ ] **Step 4: Commit changes**

---

### Task 7: Comprehensive 12-Scenario Regression Test Suite, Type Check & Build Verification

**Files:**
- Create: `tests/ui/phase3b1-safety-regression.test.ts`
- Test: Entire Vitest test suite (`npx vitest run`)
- Build: `npm run build`

**Interfaces:**
- Consumes: All 6 hardened payment subsystems
- Produces: Verification of all 12 mandated regression scenarios with 0 TypeScript errors and clean Next.js build.

- [ ] **Step 1: Implement all 12 regression scenarios in `tests/ui/phase3b1-safety-regression.test.ts`**
- [ ] **Step 2: Run `npx vitest run tests/ui/phase3b1-safety-regression.test.ts`**
- [ ] **Step 3: Run `npx tsc --noEmit` and ensure 0 errors**
- [ ] **Step 4: Run full test suite `npx vitest run` across all test files**
- [ ] **Step 5: Run `npm run build`**
- [ ] **Step 6: Commit all changes on `fix/phase3b1-payment-safety`**
