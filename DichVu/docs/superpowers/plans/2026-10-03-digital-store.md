# Automated Digital Products & Accounts Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh website bán sản phẩm số/tài khoản/khóa học tự động 100% bằng Next.js, Prisma, tích hợp VietQR và webhook ngân hàng.

**Architecture:** Next.js Fullstack (App Router), Prisma ORM với SQLite (dev) / PostgreSQL (prod), cơ chế khóa kho tạm (15 phút) chống race-condition, webhook nhận thanh toán tự động trả key tức thì.

**Tech Stack:** Next.js 14/15, TypeScript, Tailwind CSS, Shadcn UI, Prisma ORM, Vitest, Lucide React.

**Spec:** `docs/superpowers/specs/2026-10-03-digital-store-design.md`

## Global Constraints

- Fullstack Next.js (App Router) với TypeScript bắt buộc kiểu nghiêm ngặt (`strict: true`).
- Mã đơn hàng có tiền tố `ORD` + 6 số ngẫu nhiên (ví dụ `ORD123456`).
- Thời hạn giữ kho tạm cho đơn hàng là đúng 15 phút (`expiresAt = now() + 15m`).
- Tự động hóa 100%: Webhook khớp số tiền và mã đơn phải chuyển trạng thái `PAID` và bàn giao key ngay lập tức.
- Xử lý Webhook phải đảm bảo tính Idempotent (không xử lý lặp lại cho cùng 1 `transactionId`).

## Review Focus

1. **Khách đặt mua đồng thời khi chỉ còn 1 sản phẩm:** Đảm bảo chỉ 1 khách hàng lấy được key (Reservation test), khách thứ hai nhận thông báo hết hàng.
2. **Khách chuyển tiền sau khi đơn hết hạn (15 phút):** Không tự ý giao key khác nếu kho đã bị người khác mua, ghi log `REQUIRES_MANUAL_REVIEW` để Admin xử lý.
3. **Webhook gửi lặp lại (Retry):** Trả về HTTP 200 và giữ nguyên trạng thái `PAID`, không tạo thêm đơn hoặc trừ kho lần 2.
4. **Khách nhập nhiều key cùng lúc trong Admin:** Parse chuỗi dán (multiline input), tự động bỏ dòng trống và khoảng trắng thừa.
5. **Khách không đăng nhập vẫn mua và xem lại key được:** Sử dụng link bảo mật chứa token/orderCode kèm mã PIN hoặc link trực tiếp cho đơn hàng.

---

### Task 1: Project Scaffolding, Testing Framework & Prisma Database Schema

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts`
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `prisma: PrismaClient` export từ `src/lib/prisma.ts`

- [ ] **Step 1: Write the failing database connectivity and model test**
```typescript
// tests/db.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/prisma';

describe('Prisma Schema and Database Connectivity', () => {
  it('should create and retrieve a category and product with items', async () => {
    const category = await prisma.category.create({
      data: { name: 'Software', slug: 'software' },
    });
    expect(category.id).toBeDefined();

    const product = await prisma.product.create({
      data: {
        title: 'Windows 11 Pro Key',
        slug: 'windows-11-pro',
        description: 'Bản quyền vĩnh viễn',
        price: 150000,
        categoryId: category.id,
      },
    });
    expect(product.price).toBe(150000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/db.test.ts`  
Expected: FAIL (missing files/dependencies)

- [ ] **Step 3: Initialize Next.js project, install Prisma, Vitest, and write `prisma/schema.prisma`**
Install packages (`next`, `react`, `react-dom`, `@prisma/client`, `prisma`, `vitest`). Run `npx prisma db push`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/db.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add package.json tsconfig.json vitest.config.ts prisma/ src/ tests/
git commit -m "chore: setup Next.js project, Prisma schema and testing suite"
```

---

### Task 2: Inventory Reservation Engine (Concurrency & Expiration Logic)

**Files:**
- Create: `src/services/inventory.service.ts`
- Test: `tests/services/inventory.service.test.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces:
  - `reserveItemsForOrder(productId: string, quantity: number, orderId: string, durationMinutes: number): Promise<ProductItem[]>`
  - `releaseExpiredReservations(): Promise<number>`
  - `commitReservedItemsToSold(orderId: string): Promise<ProductItem[]>`

- [ ] **Step 1: Write failing tests for inventory reservation, release, and race-conditions**
```typescript
// tests/services/inventory.service.test.ts
import { describe, it, expect } from 'vitest';
import { reserveItemsForOrder, releaseExpiredReservations, commitReservedItemsToSold } from '../../src/services/inventory.service';

describe('Inventory Service', () => {
  it('should reserve available items and lock them', async () => {
    // Test that reserveItemsForOrder sets status to RESERVED and assigns orderId
  });

  it('should throw error when available stock is insufficient', async () => {
    // Expect rejection with "Insufficient stock available"
  });

  it('should release items when expired', async () => {
    // Expect releaseExpiredReservations to set status back to AVAILABLE
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/inventory.service.test.ts`  
Expected: FAIL (functions not implemented)

- [ ] **Step 3: Implement `src/services/inventory.service.ts` using Prisma interactive transactions**
Wrap selection and reservation in `prisma.$transaction` with row locking logic.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/inventory.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/inventory.service.ts tests/services/inventory.service.test.ts
git commit -m "feat: implement inventory reservation and concurrency engine"
```

---

### Task 3: VietQR Generation & Verification Utilities

**Files:**
- Create: `src/lib/vietqr.ts`
- Test: `tests/lib/vietqr.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `generateVietQrUrl(bankId: string, accountNo: string, amount: number, memo: string): string`
  - `parseOrderCodeFromMemo(memo: string): string | null`

- [ ] **Step 1: Write failing tests for VietQR URL generation and memo parsing**
```typescript
// tests/lib/vietqr.test.ts
import { describe, it, expect } from 'vitest';
import { generateVietQrUrl, parseOrderCodeFromMemo } from '../../src/lib/vietqr';

describe('VietQR Lib', () => {
  it('should generate valid VietQR quicklink URL', () => {
    const url = generateVietQrUrl('MB', '0987654321', 150000, 'ORD123456');
    expect(url).toContain('https://img.vietqr.io/image/MB-0987654321-compact2.png');
    expect(url).toContain('amount=150000');
    expect(url).toContain('addInfo=ORD123456');
  });

  it('should extract order code correctly from bank transfer description', () => {
    const memo = 'NGUYEN VAN A CHUYEN TIEN ORD123456 MA GD 9992';
    expect(parseOrderCodeFromMemo(memo)).toBe('ORD123456');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/lib/vietqr.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `generateVietQrUrl` and `parseOrderCodeFromMemo` in `src/lib/vietqr.ts`**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/lib/vietqr.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/vietqr.ts tests/lib/vietqr.test.ts
git commit -m "feat: implement VietQR generation and memo parser"
```

---

### Task 4: Order Creation & Checkout Service

**Files:**
- Create: `src/services/order.service.ts`
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[orderCode]/status/route.ts`
- Test: `tests/services/order.service.test.ts`

**Interfaces:**
- Consumes: `prisma`, `reserveItemsForOrder`, `generateVietQrUrl`
- Produces:
  - `createOrder(data: { customerEmail: string, items: { productId: string, quantity: number }[] }): Promise<Order>`
  - `getOrderDetails(orderCode: string): Promise<OrderWithItemsAndQr>`

- [ ] **Step 1: Write failing tests for order creation and status check**
```typescript
// tests/services/order.service.test.ts
import { describe, it, expect } from 'vitest';
import { createOrder, getOrderDetails } from '../../src/services/order.service';

describe('Order Service', () => {
  it('should create order with ORD prefix, 15 min expiry, and reserved items', async () => {
    // Assert order.orderCode matches /^ORD\d{6}$/
    // Assert order.status === 'PENDING'
    // Assert order.expiresAt > now
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/order.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `order.service.ts` and Next.js Route Handlers**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/order.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/order.service.ts src/app/api/orders/ tests/services/order.service.test.ts
git commit -m "feat: add order creation and status checking endpoints"
```

---

### Task 5: Automated Payment Webhook Handler (PayOS / SePay)

**Files:**
- Create: `src/services/payment.service.ts`
- Create: `src/app/api/webhooks/payment/route.ts`
- Test: `tests/services/payment.service.test.ts`

**Interfaces:**
- Consumes: `prisma`, `commitReservedItemsToSold`, `parseOrderCodeFromMemo`
- Produces:
  - `handleIncomingTransaction(payload: TransactionPayload): Promise<{ success: boolean, orderCode?: string, error?: string }>`

- [ ] **Step 1: Write failing tests for payment processing and idempotency**
```typescript
// tests/services/payment.service.test.ts
import { describe, it, expect } from 'vitest';
import { handleIncomingTransaction } from '../../src/services/payment.service';

describe('Payment Service', () => {
  it('should match order, mark PAID, and commit items to SOLD', async () => {
    // Test valid payment
  });

  it('should be idempotent and ignore duplicate transaction IDs', async () => {
    // Test duplicate transactionId
  });

  it('should flag underpaid orders for manual review', async () => {
    // Test partial payment
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/payment.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `payment.service.ts` and `POST /api/webhooks/payment` route**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/payment.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/payment.service.ts src/app/api/webhooks/payment/ tests/services/payment.service.test.ts
git commit -m "feat: implement idempotent automated payment webhook handler"
```

---

### Task 6: Storefront UI (Homepage & Product Detail Page)

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/products/[slug]/page.tsx`
- Create: `src/components/ProductCard.tsx`
- Create: `src/components/Header.tsx`
- Test: `tests/ui/storefront.test.tsx`

**Interfaces:**
- Consumes: `prisma`
- Produces: Responsive homepage and product view with live stock indicator

- [ ] **Step 1: Write failing UI component tests**
Test that `ProductCard` renders title, formatted price in VND, and "Hết hàng" when stock is 0.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/ui/storefront.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Build Storefront pages and components with Tailwind CSS**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/ui/storefront.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/page.tsx src/app/products/ src/components/ tests/ui/
git commit -m "feat: build responsive storefront UI and product catalog"
```

---

### Task 7: Checkout & Real-time Auto-Delivery UI

**Files:**
- Create: `src/app/checkout/[orderCode]/page.tsx`
- Create: `src/app/order-success/[orderCode]/page.tsx`
- Create: `src/components/CountdownTimer.tsx`
- Create: `src/components/SecretDisplay.tsx`
- Test: `tests/ui/checkout.test.tsx`

**Interfaces:**
- Consumes: `/api/orders/[orderCode]/status`
- Produces: Polling QR checkout view and instant secret-key reveal view

- [ ] **Step 1: Write failing component tests for countdown and 1-click copy**
Test that `SecretDisplay` masks and allows copying credentials/license keys to clipboard.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/ui/checkout.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Implement Checkout screen with VietQR image, polling timer, and Success screen**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/ui/checkout.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/checkout/ src/app/order-success/ src/components/ tests/ui/
git commit -m "feat: implement realtime QR checkout and auto-delivery delivery view"
```

---

### Task 8: Admin Dashboard & Bulk Key Inventory Importer

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/inventory/page.tsx`
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/services/bulk-import.service.ts`
- Test: `tests/services/bulk-import.test.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces:
  - `parseAndImportKeys(productId: string, rawText: string): Promise<{ importedCount: number }>`

- [ ] **Step 1: Write failing tests for bulk import parser**
Test that raw multiline text with empty lines and spaces correctly imports individual `ProductItem` records.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/bulk-import.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement bulk import service and Admin pages**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/bulk-import.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/admin/ src/services/bulk-import.service.ts tests/services/bulk-import.test.ts
git commit -m "feat: implement admin dashboard and bulk inventory importer"
```
