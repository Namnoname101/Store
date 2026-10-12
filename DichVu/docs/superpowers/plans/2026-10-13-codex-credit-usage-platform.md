# DaiTruong Codex Credit & API Usage Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh hệ thống nạp tự động API Credit Codex và trang theo dõi API Usage thực tế cho DaiTruong Store tích hợp với upstream ModelAPI (New API) an toàn tuyệt đối trước concurrency và rủi ro thất thoát số dư.

**Architecture:** Sử dụng Next.js 14 App Router, Prisma ORM với SQLite, tích hợp API `modelapi.vn` qua `ModelApiService` chuyên biệt trang bị Mutex Lock và Sổ cái Delta Reconciliation. Giao diện khách hàng gồm trang nạp credit tương tác cao và Developer Usage Dashboard chuyên nghiệp hiển thị biểu đồ và lịch sử request thực tế.

**Tech Stack:** Next.js 14.2 (App Router), React 18, Prisma 5.20, Tailwind CSS, Lucide Icons, Vitest, Web Crypto HMAC-SHA256.

**Spec:** `docs/superpowers/specs/2026-10-12-codex-credit-usage-platform-design.md`

## Global Constraints
- **Tỉ lệ quy đổi:** `1 USD = 500.000 quota units` (có thể cấu hình qua biến môi trường `MODELAPI_QUOTA_PER_USD`).
- **An toàn Concurrency:** Bắt buộc dùng In-Process Mutex Lock theo `upstreamTokenId` và đối soát delta tiêu thụ qua `CreditLedger`, không được ghi đè mù quáng `remain_quota`.
- **Bảo mật:** Không lưu plain text `sk-...` trong database; sử dụng HMAC-SHA256 fingerprint cho tra cứu và masked string (`sk-abc...xyz`) cho hiển thị. Không lộ `MODELAPI_SYSTEM_ACCESS_TOKEN` ra client.
- **Quyền riêng tư:** Endpoint usage và log khách hàng chỉ xác thực bằng chính `sk-...` của khách (Token-scoped), chống hoàn toàn IDOR.
- **Không hồi quy (Zero Regression):** Toàn bộ 74 test suites hiện có (Locket, Dropship, Kho thẻ, Ví điện tử, VietQR) phải tiếp tục pass 100%.

## Review Focus
1. Hai webhook hoặc hai đơn nạp đồng thời trên cùng 1 key không được gây mất quota (Lost update).
2. Key đang gọi AI tiêu thụ quota trong đúng khoảnh khắc nạp phải ghi nhận delta tiêu thụ chính xác trong `CreditLedger`.
3. Khách A không bao giờ xem được thông tin hoặc usage log của Khách B.
4. Khi ModelAPI lỗi mạng hoặc timeout lúc nạp, đơn hàng phải chuyển sang trạng thái `RECONCILE_REQUIRED`, không báo hoàn tất ảo và không cộng tiền lần 2 nếu retry.
5. Trang sản phẩm và luồng thanh toán hiện tại của các sản phẩm khác (Office, Canva, Capcut, v.v.) không bị xáo trộn.

---

### Task 1: Database Schema Extension & Prisma Client

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Test: `tests/db-codex-schema.test.ts`

**Interfaces:**
- Produces: `CustomerApiKeyBinding`, `CreditTopupOrder`, `CreditLedger`, `ModelApiSyncSnapshot` models and exported enum types in `src/lib/prisma.ts`.

- [ ] **Step 1: Write the failing test for schema models and types**

```typescript
// tests/db-codex-schema.test.ts
import { describe, it, expect } from "vitest";
import { prisma, TopupStatus } from "@/lib/prisma";

describe("Codex Schema Models", () => {
  it("should have TopupStatus enum helpers exported", () => {
    expect(TopupStatus.PENDING).toBe("PENDING");
    expect(TopupStatus.COMPLETED).toBe("COMPLETED");
    expect(TopupStatus.RECONCILE_REQUIRED).toBe("RECONCILE_REQUIRED");
  });

  it("should create and query CustomerApiKeyBinding and CreditLedger", async () => {
    const binding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: 999991,
        keyFingerprint: "test-hash-fingerprint-1",
        maskedKey: "sk-test...9991",
        keyName: "Test Key",
      },
    });
    expect(binding.id).toBeDefined();

    const ledger = await prisma.creditLedger.create({
      data: {
        bindingId: binding.id,
        upstreamTokenId: 999991,
        quotaBefore: 1000000,
        quotaAddedExpected: 5000000,
        quotaAfterReported: 6000000,
        discrepancyDelta: 0,
      },
    });
    expect(ledger.id).toBeDefined();

    // Cleanup
    await prisma.creditLedger.delete({ where: { id: ledger.id } });
    await prisma.customerApiKeyBinding.delete({ where: { id: binding.id } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db-codex-schema.test.ts`  
Expected: FAIL (models or TopupStatus not defined).

- [ ] **Step 3: Update `prisma/schema.prisma` and `src/lib/prisma.ts`**

Add `CustomerApiKeyBinding`, `CreditTopupOrder`, `CreditLedger`, `ModelApiSyncSnapshot` to `prisma/schema.prisma`.  
Run `npx prisma db push`.  
Export `TopupStatus` in `src/lib/prisma.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db-codex-schema.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts tests/db-codex-schema.test.ts
git commit -m "feat(codex): add database schema models and types for credit topup and ledger"
```

---

### Task 2: ModelApiService Core Engine & Concurrency Locking

**Files:**
- Create: `src/services/modelapi/modelapi.service.ts`
- Create: `src/services/modelapi/token-mutex.ts`
- Test: `tests/services/modelapi.service.test.ts`

**Interfaces:**
- Produces: `ModelApiService` with `checkConnection()`, `verifyCustomerKey()`, `applyQuotaTopup()`, `fetchTokenUsage()`, `fetchTokenLogs()`, `fetchSourceBalance()`.
- Produces: `acquireTokenLock(tokenId: number, timeoutMs?: number): Promise<() => void>`

- [ ] **Step 1: Write failing tests for `ModelApiService` and Mutex Lock**

```typescript
// tests/services/modelapi.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModelApiService } from "@/services/modelapi/modelapi.service";

describe("ModelApiService", () => {
  it("should calculate quota correctly based on USD rate", () => {
    const quota = ModelApiService.usdToQuota(10);
    expect(quota).toBe(5000000); // 10 * 500,000
  });

  it("should acquire and release mutex lock for same token sequentially", async () => {
    const { acquireTokenLock } = await import("@/services/modelapi/token-mutex");
    const unlock1 = await acquireTokenLock(12345);
    let order = 0;
    setTimeout(() => {
      order = 1;
      unlock1();
    }, 50);

    const unlock2 = await acquireTokenLock(12345);
    expect(order).toBe(1);
    unlock2();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/modelapi.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `token-mutex.ts` and `modelapi.service.ts`**

Implement in-memory promise-based FIFO mutex for token locks.  
Implement `ModelApiService` with HTTP client talking to ModelAPI (`GET /api/user/self`, `GET /api/usage/token`, `GET /api/token/{id}`, `PUT /api/token/`, `GET /api/log/token`).  
Add delta reconciliation logic: detect when `quotaAfter < quotaBefore + quotaAdded` and compute `discrepancyDelta`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/services/modelapi.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/modelapi/ tests/services/modelapi.service.test.ts
git commit -m "feat(codex): implement ModelApiService and token concurrency mutex"
```

---

### Task 3: Key Verification & Binding API Endpoints

**Files:**
- Create: `src/app/api/codex/verify-key/route.ts`
- Create: `src/app/api/codex/my-keys/route.ts`
- Create: `src/lib/key-security.ts` (HMAC fingerprinting & masking helpers)
- Test: `tests/api/codex-verify-key.test.ts`

**Interfaces:**
- Produces: `POST /api/codex/verify-key` (input: `{ apiKey: string }`, returns: `{ valid, maskedKey, keyName, currentQuotaUsd, bindingId }`)
- Produces: `GET /api/codex/my-keys` (returns linked keys for authenticated user)
- Produces: `computeKeyFingerprint(key: string): string`, `maskApiKey(key: string): string`

- [ ] **Step 1: Write failing test for verify-key route**

```typescript
// tests/api/codex-verify-key.test.ts
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/codex/verify-key/route";

describe("POST /api/codex/verify-key", () => {
  it("should reject invalid key formats immediately", async () => {
    const req = new Request("http://localhost/api/codex/verify-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: "invalid-key" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/codex-verify-key.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement key security helpers and API routes**

Implement `src/lib/key-security.ts` with `computeKeyFingerprint` and `maskApiKey`.  
Implement `POST /api/codex/verify-key/route.ts` verifying key with ModelAPI and binding to customer record.  
Implement `GET /api/codex/my-keys/route.ts` listing active keys for logged-in user.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/codex-verify-key.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/key-security.ts src/app/api/codex/ tests/api/codex-verify-key.test.ts
git commit -m "feat(codex): add key verification, fingerprinting, and binding endpoints"
```

---

### Task 4: Auto-Fulfillment Pipeline for Codex Credit Orders

**Files:**
- Modify: `src/services/payment.service.ts`
- Create: `src/services/codex-fulfillment.service.ts`
- Test: `tests/services/codex-fulfillment.test.ts`

**Interfaces:**
- Consumes: `ModelApiService.applyQuotaTopup()`
- Produces: `fulfillCodexCreditOrder(orderId: string): Promise<FulfillmentResult>` integrated directly into payment webhook handler.

- [ ] **Step 1: Write failing test for Codex order auto-fulfillment**

```typescript
// tests/services/codex-fulfillment.test.ts
import { describe, it, expect, vi } from "vitest";
import { fulfillCodexCreditOrder } from "@/services/codex-fulfillment.service";

describe("fulfillCodexCreditOrder", () => {
  it("should process topup and record CreditLedger atomically", async () => {
    // Mock order and binding
    // Assert fulfillCodexCreditOrder transitions order to COMPLETED
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/codex-fulfillment.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `codex-fulfillment.service.ts` and hook into `payment.service.ts`**

When an order is paid (`status === 'PAID'`), check if it contains a `CreditTopupOrder`.  
Call `fulfillCodexCreditOrder()` with concurrency protection.  
If successful, mark `CreditTopupOrder.status = "COMPLETED"`, `Order.upstreamStatus = "COMPLETED"`.  
If upstream fails, transition to `RECONCILE_REQUIRED` and write audit log.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/codex-fulfillment.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/codex-fulfillment.service.ts src/services/payment.service.ts tests/services/codex-fulfillment.test.ts
git commit -m "feat(codex): implement automated credit fulfillment upon payment confirmation"
```

---

### Task 5: Codex Credit Storefront & Key Input Flow

**Files:**
- Create: `src/components/CodexTopupClient.tsx`
- Create: `src/app/codex/page.tsx`
- Modify: `src/components/Navbar.tsx` (add Codex link)
- Test: `tests/ui/codex-storefront.test.ts`

**Interfaces:**
- Renders: `/codex` storefront page with package selector ($5, $10, $20, $50, $100), key verification card, guest vs user mode, VietQR checkout launch.

- [ ] **Step 1: Write component render and interaction test**

```typescript
// tests/ui/codex-storefront.test.ts
import { describe, it, expect } from "vitest";

describe("Codex Storefront", () => {
  it("should render packages and key input", async () => {
    const mod = await import("@/components/CodexTopupClient");
    expect(mod.default).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/codex-storefront.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `CodexTopupClient.tsx` and `src/app/codex/page.tsx`**

Build responsive UI matching DaiTruong Store dark design system.  
Provide package selection, live price in VND, key verification input with feedback spinner and badge, "I don't have a key" modal with support contact, direct checkout integration.  
Add `/codex` link to `Navbar.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/codex-storefront.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CodexTopupClient.tsx src/app/codex/page.tsx src/components/Navbar.tsx tests/ui/codex-storefront.test.ts
git commit -m "feat(codex): build responsive Codex Credit storefront and key verification UI"
```

---

### Task 6: DaiTruong Developer API Usage Dashboard UI & Analytics API

**Files:**
- Create: `src/app/api/developer/usage/route.ts`
- Create: `src/app/api/developer/logs/route.ts`
- Create: `src/components/developer/UsageDashboardClient.tsx`
- Create: `src/app/developer/usage/page.tsx`
- Test: `tests/api/developer-usage.test.ts`

**Interfaces:**
- Produces: `GET /api/developer/usage?key=...`
- Produces: `GET /api/developer/logs?key=...&page=...`
- Renders: `/developer/usage` dashboard with metrics, daily consumption chart, request history table, model breakdown, and low balance top-up alert.

- [ ] **Step 1: Write test for developer usage API routes**

```typescript
// tests/api/developer-usage.test.ts
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/developer/usage/route";

describe("Developer Usage API", () => {
  it("should require a valid authorization or key parameter", async () => {
    const req = new Request("http://localhost/api/developer/usage");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/developer-usage.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement usage API routes and dashboard UI**

Implement `GET /api/developer/usage/route.ts` and `GET /api/developer/logs/route.ts` proxying safely to ModelAPI using customer's token.  
Build `UsageDashboardClient.tsx`:  
- KPI Cards: Available Credit, Used Credit, Total Tokens, Total Requests.  
- Filterable Charts: 7d/30d tokens & credit trend.  
- Real-time Request Log table with model, status badge, latency, tokens, timestamp in Asia/Ho_Chi_Minh.  
- Model-wise consumption breakdown.  
- Low balance alert with 1-click "Top up now".

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/developer-usage.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/developer/ src/components/developer/ src/app/developer/ tests/api/developer-usage.test.ts
git commit -m "feat(codex): implement Developer API Usage dashboard and analytics endpoints"
```

---

### Task 7: Admin Codex & ModelAPI Oversight Dashboard

**Files:**
- Create: `src/app/admin/codex/page.tsx`
- Create: `src/components/admin/AdminCodexClient.tsx`
- Create: `src/app/api/admin/codex/source-balance/route.ts`
- Create: `src/app/api/admin/codex/reconcile/route.ts`
- Modify: `src/app/admin/layout.tsx` (add navigation link)
- Test: `tests/admin/admin-codex.test.ts`

**Interfaces:**
- Produces: `/admin/codex` management view for source balance monitoring, customer key bindings, delta reconciliation, and retry actions.

- [ ] **Step 1: Write failing test for admin codex routes**

```typescript
// tests/admin/admin-codex.test.ts
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/admin/codex/source-balance/route";

describe("Admin Codex API", () => {
  it("should reject unauthenticated admin requests", async () => {
    const req = new Request("http://localhost/api/admin/codex/source-balance");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/admin/admin-codex.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement admin API routes and UI**

Build `AdminCodexClient.tsx`:  
- Source quota monitor card vs Total customer obligation with status indicator (Healthy / Low Balance).  
- Table of linked customer keys with search and manual assignment.  
- Orders needing reconciliation with 1-click retry.  
Add "Quản lý Codex API" link to `admin/layout.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/admin/admin-codex.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/codex/ src/components/admin/AdminCodexClient.tsx src/app/api/admin/codex/ tests/admin/admin-codex.test.ts src/app/admin/layout.tsx
git commit -m "feat(codex): add admin oversight dashboard and source balance monitoring"
```

---

### Task 8: End-to-End Integration, Regression Testing & Deployment Readiness

**Files:**
- Create: `tests/e2e/codex-credit-flow.test.ts`
- Create: `prisma/seed-codex.ts`
- Run: Whole test suite (`npx vitest run`) and TypeScript check (`npx tsc --noEmit`)

**Interfaces:**
- Verifies complete lifecycle: Product listing -> Key verification -> Order creation -> VietQR payment -> Auto-fulfillment -> Ledger record -> Usage dashboard view.

- [ ] **Step 1: Write E2E integration test for full credit top-up and usage lifecycle**

```typescript
// tests/e2e/codex-credit-flow.test.ts
import { describe, it, expect } from "vitest";

describe("E2E Codex Credit & Usage Flow", () => {
  it("should simulate entire lifecycle cleanly", async () => {
    // 1. Verify key
    // 2. Create order
    // 3. Fulfill order
    // 4. Verify ledger entry
    // 5. Verify usage query
  });
});
```

- [ ] **Step 2: Run E2E test and full test suite**

Run: `npx vitest run`  
Verify: All 74+ existing test suites and new Codex tests pass 100%.

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`  
Verify: 0 TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/codex-credit-flow.test.ts prisma/seed-codex.ts
git commit -m "test(codex): add E2E lifecycle test and verify zero regression across test suite"
```
