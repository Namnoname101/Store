# User Wallet & Membership System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive customer membership, wallet top-up, VietQR automated deposit, 1-click balance checkout, and transaction ledger system for the digital services platform.

**Architecture:** Lightweight Web Crypto HMAC session authentication for customers (`user_session` HttpOnly cookie) with PBKDF2/Web Crypto password hashing; Prisma ledger schema (`DepositOrder`, `WalletTransaction`) with atomic balance deductions (`balance: { gte: totalAmount }`); VietQR top-up engine with webhook handling for `NAPxxxxxx` codes; and responsive glassmorphic storefront & admin UI.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma (SQLite), Web Crypto API, Tailwind CSS, Lucide Icons, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-05-user-wallet-system-design.md`](file:///e:/Du%20An/Web/DichVu/docs/superpowers/specs/2026-10-05-user-wallet-system-design.md)

## Global Constraints
- Minimal deposit amount: 20,000 VND (`MIN_DEPOSIT_AMOUNT = 20000`).
- Session cookie name: `user_session`, HttpOnly, SameSite=Lax, Path=/.
- Concurrency & Race Condition Guard: Balance decrement MUST be atomic using `where: { id: userId, balance: { gte: order.totalAmount } }`.
- Zero impact on guest customers: Guest checkout via VietQR remains 100% functional.
- Zero external heavy auth libraries: Use Web Crypto standard APIs (compatible with Edge and Node).

## Review Focus
1. Unauthenticated or expired `user_session` access to wallet APIs returns 401 Unauthorized.
2. Attempting to top up less than 20,000 VND returns friendly validation error.
3. Concurrent 1-click wallet payments when balance is only sufficient for one order safely rejects the second attempt without double-spending.
4. Duplicate bank webhook for `NAPxxxxxx` transaction is idempotent and does not credit wallet balance twice.
5. Guest checkout remains fully operational without requiring login or wallet.

---

### Task 1: Prisma Schema Extensions for User, DepositOrder & WalletTransaction

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Test: `tests/db-wallet.test.ts`

**Interfaces:**
- Produces: Updated `User` model (`username`, `passwordHash`, `role`, `balance`, `totalDeposited`), new `DepositOrder` model, and new `WalletTransaction` model.

- [ ] **Step 1: Write failing test in `tests/db-wallet.test.ts`**
Verify that `prisma.user`, `prisma.depositOrder`, and `prisma.walletTransaction` models can be queried and have the expected fields.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/db-wallet.test.ts`
Expected: FAIL (models or fields missing)

- [ ] **Step 3: Update `prisma/schema.prisma` and push to database**
Add `DepositOrder`, `WalletTransaction`, and update `User` with `balance`, `totalDeposited`, `depositOrders`, and `walletTransactions`. Run `npx prisma db push`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/db-wallet.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add prisma/schema.prisma src/lib/prisma.ts tests/db-wallet.test.ts
git commit -m "feat: add user wallet, deposit order, and transaction ledger prisma models"
```

---

### Task 2: Customer Authentication Engine & Auth APIs

**Files:**
- Create: `src/lib/user-auth.ts`
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Test: `tests/services/user-auth.service.test.ts`
- Test: `tests/api/auth.test.ts`

**Interfaces:**
- Produces: `hashPassword(password: string): Promise<string>`, `verifyPassword(password: string, hash: string): Promise<boolean>`, `createUserSessionToken(payload): Promise<string>`, `verifyUserSessionToken(token: string): Promise<UserSessionPayload | null>`, `getUserSession(): Promise<UserSessionPayload | null>`.

- [ ] **Step 1: Write failing test in `tests/services/user-auth.service.test.ts`**
Test password hashing/verification, session token creation, expiration, and tampering detection.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/services/user-auth.service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/lib/user-auth.ts`**
Implement PBKDF2 Web Crypto password hashing and HMAC-SHA256 session token generation and verification.

- [ ] **Step 4: Write failing API test in `tests/api/auth.test.ts`**
Test `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

- [ ] **Step 5: Implement Auth API routes**
Implement `register`, `login`, `logout`, and `me` endpoints setting/clearing `user_session` HttpOnly cookie.

- [ ] **Step 6: Run tests to verify they pass**
Run: `npx vitest run tests/services/user-auth.service.test.ts tests/api/auth.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add src/lib/user-auth.ts src/app/api/auth tests/services/user-auth.service.test.ts tests/api/auth.test.ts
git commit -m "feat: implement customer authentication engine and auth API routes"
```

---

### Task 3: Deposit Service & VietQR Top-up Engine

**Files:**
- Create: `src/services/deposit.service.ts`
- Create: `src/app/api/wallet/deposit/route.ts`
- Create: `src/app/api/wallet/deposit/[depositCode]/status/route.ts`
- Test: `tests/services/deposit.service.test.ts`

**Interfaces:**
- Produces: `createDepositOrder(userId: string, amount: number): Promise<DepositOrderResponse>`, `getDepositOrderStatus(depositCode: string, userId?: string): Promise<DepositStatusResponse>`.

- [ ] **Step 1: Write failing test in `tests/services/deposit.service.test.ts`**
Test deposit creation, validation for `>= 20000`, VietQR URL generation with `NAPxxxxxx` memo, and status query.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/services/deposit.service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/services/deposit.service.ts` and API routes**
Create `DepositOrder`, enforce minimum 20,000 VND, generate unique `NAPxxxxxx` memo and VietQR image URL. Implement status polling route.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/services/deposit.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/deposit.service.ts src/app/api/wallet tests/services/deposit.service.test.ts
git commit -m "feat: implement deposit order service and VietQR top-up endpoints"
```

---

### Task 4: Bank Webhook Integration for Auto Top-up

**Files:**
- Modify: `src/services/payment.service.ts`
- Test: `tests/services/payment-deposit-webhook.test.ts`

**Interfaces:**
- Consumes: `DepositOrder`, `WalletTransaction`, `PaymentTransaction`.
- Produces: `handleIncomingTransaction` handling both `ORDxxxxxx` (order payment) and `NAPxxxxxx` (wallet deposit).

- [ ] **Step 1: Write failing test in `tests/services/payment-deposit-webhook.test.ts`**
Test bank webhook payload containing `NAPxxxxxx`: verifies deposit transitions to `COMPLETED`, `user.balance` increments, `user.totalDeposited` increments, `WalletTransaction` of type `TOPUP` created, and duplicate webhook is idempotent.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/services/payment-deposit-webhook.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/services/payment.service.ts`**
Add regex match for `NAP\d{6}` in transaction memo. Execute atomic transaction to complete deposit, credit user balance, and record ledger entry.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/services/payment-deposit-webhook.test.ts tests/services/payment.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/payment.service.ts tests/services/payment-deposit-webhook.test.ts
git commit -m "feat: integrate wallet top-up processing into payment webhook handler"
```

---

### Task 5: 1-Click Wallet Checkout Engine

**Files:**
- Create: `src/services/wallet.service.ts`
- Create: `src/app/api/orders/[orderCode]/pay-with-wallet/route.ts`
- Test: `tests/services/wallet.service.test.ts`

**Interfaces:**
- Produces: `payOrderWithWallet(orderCode: string, userId: string): Promise<WalletPaymentResult>`.

- [ ] **Step 1: Write failing test in `tests/services/wallet.service.test.ts`**
Test paying order using wallet balance: successful deduction when balance >= total, failure when balance < total, concurrent click race-condition protection, and ledger recording.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/services/wallet.service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/services/wallet.service.ts` and API route**
Execute atomic Prisma transaction: update user balance where `balance >= order.totalAmount`, mark order `PAID`, record `WalletTransaction` (type: `ORDER_PAYMENT`), fulfill keys or call upstream supplier.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/services/wallet.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/wallet.service.ts src/app/api/orders/[orderCode]/pay-with-wallet tests/services/wallet.service.test.ts
git commit -m "feat: implement 1-click wallet checkout engine with race condition safety"
```

---

### Task 6: Customer Frontend UI (Navbar Widget, Auth Pages, Top-up & Profile)

**Files:**
- Modify: `src/components/Navbar.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/app/topup/page.tsx`
- Create: `src/app/topup/[depositCode]/page.tsx`
- Create: `src/app/profile/page.tsx`
- Create: `src/components/TopupClient.tsx`
- Create: `src/components/ProfileClient.tsx`
- Test: `tests/ui/wallet-ui.test.ts`

**Interfaces:**
- Produces: Header balance pill with dropdown, `/login`, `/register`, `/topup`, `/profile` pages.

- [ ] **Step 1: Write UI tests in `tests/ui/wallet-ui.test.ts`**
Verify route rendering, user state handling, and deposit polling.

- [ ] **Step 2: Implement Navbar user balance badge & auth menu**
Update `Navbar.tsx` to fetch current user session, render balance pill (`💳 150.000đ`), and dropdown menu with top-up, profile, and logout.

- [ ] **Step 3: Implement Login & Register pages**
Glassmorphic design with error handling, redirects, and responsive styling.

- [ ] **Step 4: Implement Top-up & Profile pages**
Create quick preset buttons (20k, 50k, 100k, 200k, 500k), VietQR display with copy buttons and auto-check polling; create profile view with tabs for wallet history (`WalletTransaction`) and purchased orders.

- [ ] **Step 5: Run tests and type check**
Run: `npx vitest run tests/ui/wallet-ui.test.ts` and `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/components/Navbar.tsx src/app/login src/app/register src/app/topup src/app/profile src/components/TopupClient.tsx src/components/ProfileClient.tsx tests/ui/wallet-ui.test.ts
git commit -m "feat: build customer auth, top-up, profile, and wallet header UI"
```

---

### Task 7: 1-Click Balance Checkout UI Integration

**Files:**
- Modify: `src/components/CheckoutClient.tsx`
- Test: `tests/ui/checkout-wallet.test.ts`

**Interfaces:**
- Consumes: `GET /api/auth/me`, `POST /api/orders/[orderCode]/pay-with-wallet`.
- Produces: Integrated wallet payment option inside `CheckoutClient.tsx`.

- [ ] **Step 1: Write test in `tests/ui/checkout-wallet.test.ts`**
Verify wallet payment option renders when user is logged in, enables 1-click button when balance suffices, displays "Số dư không đủ" when insufficient, and preserves VietQR for guests.

- [ ] **Step 2: Update `src/components/CheckoutClient.tsx`**
Add payment method selector between VietQR and Wallet Balance. Render 1-click checkout button with instant redirect to `/order-success/[orderCode]`.

- [ ] **Step 3: Run tests to verify they pass**
Run: `npx vitest run tests/ui/checkout-wallet.test.ts tests/ui/checkout-flow.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/CheckoutClient.tsx tests/ui/checkout-wallet.test.ts
git commit -m "feat: add 1-click wallet balance payment option in checkout flow"
```

---

### Task 8: Admin Customer Management & Balance Adjustment Dashboard

**Files:**
- Create: `src/services/admin-users.service.ts`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/adjust-balance/route.ts`
- Create: `src/app/admin/users/page.tsx`
- Create: `src/components/admin/UsersManagerClient.tsx`
- Modify: `src/app/admin/layout.tsx`
- Test: `tests/services/admin-users.test.ts`

**Interfaces:**
- Produces: `listAdminUsers()`, `adjustUserBalance(adminId, userId, amount, reason)`, Admin Users management dashboard at `/admin/users`.

- [ ] **Step 1: Write failing test in `tests/services/admin-users.test.ts`**
Test user listing with balance metrics, manual balance addition/deduction, and ledger entry creation with `ADMIN_ADJUST` type.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/services/admin-users.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/services/admin-users.service.ts` and API routes**
Implement query listing users with order counts and total spent; implement atomic balance adjustment with audit reason.

- [ ] **Step 4: Implement Admin UI (`UsersManagerClient.tsx` & `/admin/users/page.tsx`)**
Render metrics cards (Total Users, Total Wallet Balances, Total Deposited), search & filter table, and Balance Adjustment modal. Add navigation link in `src/app/admin/layout.tsx`.

- [ ] **Step 5: Run tests and type check**
Run: `npx vitest run tests/services/admin-users.test.ts` and `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/services/admin-users.service.ts src/app/api/admin/users src/app/admin/users src/components/admin/UsersManagerClient.tsx src/app/admin/layout.tsx tests/services/admin-users.test.ts
git commit -m "feat: implement admin users and wallet balance management dashboard"
```

---

### Task 9: Full System Verification, Build & Deployment

**Files:**
- Verify: Full test suite, Next.js build, Fly.io deployment

- [ ] **Step 1: Run complete test suite**
Run: `npx vitest run`
Expected: 100% pass across all test suites.

- [ ] **Step 2: Run TypeScript & Next.js production build**
Run: `npx tsc --noEmit` && `npm run build`
Expected: Clean compilation with 0 errors and 0 warnings.

- [ ] **Step 3: Deploy to Fly.io**
Run: `fly deploy --remote-only`
Expected: Successfully updated machine and live health checks passing.

- [ ] **Step 4: Verify live endpoints**
Verify `https://daitruong-store.fly.dev/topup`, `https://daitruong-store.fly.dev/login`, and `https://daitruong-store.fly.dev/admin/users`.
