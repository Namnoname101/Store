# Admin Authentication, Floating Customer Support & Coupon Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure the `/admin` portal with authenticated sessions, provide a high-converting floating customer support widget with direct Facebook and Messenger links, and introduce a flexible promotional coupon engine with automatic VietQR discount calculations.

**Architecture:** Next.js 14/15 App Router with SQLite/Prisma backend. Admin security uses HMAC-SHA256 signed HttpOnly cookie sessions verified by Next.js middleware and route handlers. The coupon engine manages discount lifecycle rules (fixed VND or percentage with caps, minimum cart spend, limits, and expiration) integrated directly into `createOrder` transactions and VietQR dynamic amounts. Floating support is a responsive, non-intrusive client component.

**Tech Stack:** Next.js (App Router), React 18, TypeScript, Tailwind CSS, Prisma ORM, Vitest, Lucide React, Web Crypto / Node crypto.

**Spec:** `docs/superpowers/specs/2026-10-04-admin-auth-support-coupon-design.md`

## Global Constraints

- All routes under `/admin/*` (except `/admin/login`) and `/api/admin/*` (except `/api/admin/auth/login`) MUST require valid admin authentication.
- Floating support MUST never be displayed on `/admin` dashboard routes.
- Coupon codes are case-insensitive and whitespace-trimmed (`GIAM10K`).
- Order total cannot drop below 1,000 VND (minimum VietQR/banking threshold).
- All customer-facing text MUST be professional, idiomatic Vietnamese.
- Zero regression on existing 185 unit and integration tests.

## Review Focus

- Unauthenticated access to `/admin` or `/api/admin/products`: redirect to `/admin/login` or return 401 Unauthorized.
- Applying coupon when cart subtotal is below `minOrderValue`: return clear user-friendly Vietnamese rejection.
- Applying expired coupon or exhausted coupon (`usedCount >= usageLimit`): return explicit validation error.
- Percentage coupon with `maxDiscount` cap: verify discount never exceeds the cap.
- Heavy discount reducing order below 1,000 VND: clamp order total to minimum 1,000 VND.

---

### Task 1: Prisma Schema Extensions for Coupon & Order Discount Fields

**Files:**
- Modify: `prisma/schema.prisma:69-90`
- Modify: `src/lib/prisma.ts:1-25`
- Test: `tests/db-coupons.test.ts`

**Interfaces:**
- Produces: `Coupon` model, `Order.subtotalAmount`, `Order.discountAmount`, `Order.couponId`, `CouponType` enum helpers (`FIXED`, `PERCENT`).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/db-coupons.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { prisma, CouponType } from "@/lib/prisma";

describe("Coupon Model & Order Relation", () => {
  it("should create a coupon and associate it with an order", async () => {
    const coupon = await prisma.coupon.create({
      data: {
        code: "TEST10K",
        type: CouponType.FIXED,
        value: 10000,
        minOrderValue: 50000,
        usageLimit: 10,
      },
    });
    expect(coupon.id).toBeDefined();
    expect(coupon.code).toBe("TEST10K");
    expect(coupon.usedCount).toBe(0);
    expect(coupon.isActive).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db-coupons.test.ts`  
Expected: FAIL with "prisma.coupon is undefined" or "CouponType is not exported".

- [ ] **Step 3: Update `prisma/schema.prisma` and `src/lib/prisma.ts`**

Add `Coupon` model and relations to `Order`, export `CouponType` enum helper in `src/lib/prisma.ts`, and run `npx prisma db push`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db-coupons.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts tests/db-coupons.test.ts
git commit -m "feat: add Coupon model and Order discount fields to Prisma schema"
```

---

### Task 2: Admin Authentication Engine (Session Token & Route Protection)

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/app/api/admin/auth/login/route.ts`
- Create: `src/app/api/admin/auth/logout/route.ts`
- Create: `src/middleware.ts`
- Test: `tests/services/admin-auth.service.test.ts`

**Interfaces:**
- Consumes: `process.env.ADMIN_PASSWORD` (default: "admin123").
- Produces: `verifyAdminPassword(pwd: string): boolean`, `createAdminSessionToken(): string`, `verifyAdminSessionToken(token: string): boolean`, `getAdminCookieOptions()`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/services/admin-auth.service.test.ts
import { describe, it, expect } from "vitest";
import {
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

describe("Admin Auth Service", () => {
  it("should verify correct admin password and reject invalid password", () => {
    expect(verifyAdminPassword("admin123")).toBe(true);
    expect(verifyAdminPassword("wrongpass")).toBe(false);
  });

  it("should create and verify signed session tokens", () => {
    const token = createAdminSessionToken();
    expect(verifyAdminSessionToken(token)).toBe(true);
    expect(verifyAdminSessionToken(token + "tampered")).toBe(false);
    expect(verifyAdminSessionToken("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/admin-auth.service.test.ts`  
Expected: FAIL with "Cannot find module '@/lib/admin-auth'".

- [ ] **Step 3: Implement `src/lib/admin-auth.ts`, login/logout routes, and `src/middleware.ts`**

Implement HMAC-SHA256 session token generation and verification using Node crypto, cookie setters in `login` and clearers in `logout`, and Next.js middleware intercepting `/admin/:path*` (redirecting unauthenticated users to `/admin/login`) and `/api/admin/:path*` (returning 401).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/admin-auth.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-auth.ts src/app/api/admin/auth/ src/middleware.ts tests/services/admin-auth.service.test.ts
git commit -m "feat: implement admin authentication engine, session tokens, and route protection"
```

---

### Task 3: Admin Login Page & Layout Integration

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Modify: `src/app/admin/layout.tsx:1-136`
- Test: `tests/ui/admin-login.test.ts`

**Interfaces:**
- Consumes: `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`.
- Produces: Responsive Admin Login UI, Logout button in Admin Sidebar.

- [ ] **Step 1: Write the UI test**

```typescript
// tests/ui/admin-login.test.ts
import { describe, it, expect } from "vitest";

describe("Admin Login Page & Layout", () => {
  it("should have login route and client form", async () => {
    const page = await import("@/app/admin/login/page");
    expect(page.default).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/admin-login.test.ts`  
Expected: FAIL with "Cannot find module '@/app/admin/login/page'".

- [ ] **Step 3: Implement `src/app/admin/login/page.tsx` and add Logout button to `src/app/admin/layout.tsx`**

Build dark-themed login screen with password toggle, loading spinner, error feedback, and redirect handling. Add Logout button with icon in `src/app/admin/layout.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/admin-login.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/login/page.tsx src/app/admin/layout.tsx tests/ui/admin-login.test.ts
git commit -m "feat: add admin login page and logout button in admin navigation"
```

---

### Task 4: Floating Customer Support Widget

**Files:**
- Create: `src/components/FloatingSupport.tsx`
- Modify: `src/app/layout.tsx:1-27`
- Test: `tests/ui/floating-support.test.ts`

**Interfaces:**
- Consumes: Facebook Profile (`https://www.facebook.com/2k2.2k6`), Messenger (`https://m.me/2k2.2k6`).
- Produces: `<FloatingSupport />` client component rendered in `RootLayout`.

- [ ] **Step 1: Write UI component test**

```typescript
// tests/ui/floating-support.test.ts
import { describe, it, expect } from "vitest";

describe("Floating Support Widget", () => {
  it("should export FloatingSupport component", async () => {
    const mod = await import("@/components/FloatingSupport");
    expect(mod.default).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/floating-support.test.ts`  
Expected: FAIL with "Cannot find module '@/components/FloatingSupport'".

- [ ] **Step 3: Implement `src/components/FloatingSupport.tsx` and integrate in `src/app/layout.tsx`**

Implement floating button at bottom-right corner with pulse animation, expandable contact options (Facebook & Messenger), dismissible tooltip, and automatic hiding on `/admin` routes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/floating-support.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingSupport.tsx src/app/layout.tsx tests/ui/floating-support.test.ts
git commit -m "feat: add floating customer support widget with Facebook and Messenger links"
```

---

### Task 5: Coupon Service & Public Validation API

**Files:**
- Create: `src/services/coupon.service.ts`
- Create: `src/app/api/coupons/validate/route.ts`
- Test: `tests/services/coupon.service.test.ts`

**Interfaces:**
- Consumes: `prisma.coupon`.
- Produces: `validateCoupon(code: string, cartTotal: number): Promise<{ valid: boolean; coupon?: Coupon; discountAmount: number; finalTotal: number; message?: string }>`, `calculateDiscount(coupon: Coupon, cartTotal: number): number`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/services/coupon.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma, CouponType } from "@/lib/prisma";
import { validateCoupon, calculateDiscount } from "@/services/coupon.service";

describe("Coupon Service", () => {
  beforeEach(async () => {
    await prisma.coupon.deleteMany();
  });

  it("should calculate fixed discount and enforce 1,000 VND floor", async () => {
    const coupon = await prisma.coupon.create({
      data: {
        code: "SALE20K",
        type: CouponType.FIXED,
        value: 20000,
        minOrderValue: 50000,
      },
    });

    const resValid = await validateCoupon("SALE20K", 100000);
    expect(resValid.valid).toBe(true);
    expect(resValid.discountAmount).toBe(20000);
    expect(resValid.finalTotal).toBe(80000);

    const resBelowMin = await validateCoupon("SALE20K", 30000);
    expect(resBelowMin.valid).toBe(false);
    expect(resBelowMin.message).toContain("tối thiểu");
  });

  it("should calculate percentage discount with maxDiscount ceiling", async () => {
    const coupon = await prisma.coupon.create({
      data: {
        code: "GIAM10PCT",
        type: CouponType.PERCENT,
        value: 10,
        maxDiscount: 15000,
      },
    });

    const res = await validateCoupon("GIAM10PCT", 200000);
    expect(res.valid).toBe(true);
    expect(res.discountAmount).toBe(15000); // capped at maxDiscount
    expect(res.finalTotal).toBe(185000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/coupon.service.test.ts`  
Expected: FAIL with "Cannot find module '@/services/coupon.service'".

- [ ] **Step 3: Implement `src/services/coupon.service.ts` and `src/app/api/coupons/validate/route.ts`**

Implement uppercase code normalization, active status check, expiration verification, usage limit check, percentage/fixed calculations, and 1,000 VND floor safeguard.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/coupon.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/coupon.service.ts src/app/api/coupons/validate/route.ts tests/services/coupon.service.test.ts
git commit -m "feat: implement coupon calculation service and validation endpoint"
```

---

### Task 6: Order Service & VietQR Discount Integration

**Files:**
- Modify: `src/services/order.service.ts:9-150`
- Modify: `src/app/api/orders/route.ts:1-50`
- Test: `tests/services/order-coupon-integration.test.ts`

**Interfaces:**
- Consumes: `CreateOrderInput.couponCode?: string`, `coupon.service.ts`.
- Produces: Orders created with `subtotalAmount`, `discountAmount`, `couponId`, atomically updated `Coupon.usedCount`, and VietQR generated with discounted `totalAmount`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/services/order-coupon-integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma, CouponType } from "@/lib/prisma";
import { createOrder } from "@/services/order.service";

describe("Order Creation with Coupon", () => {
  beforeEach(async () => {
    await prisma.coupon.deleteMany();
    await prisma.order.deleteMany();
  });

  it("should apply coupon discount to order total and VietQR payment link", async () => {
    const product = await prisma.product.findFirst({ where: { isActive: true } });
    if (!product) return;

    await prisma.coupon.create({
      data: {
        code: "DISCOUNT5K",
        type: CouponType.FIXED,
        value: 5000,
      },
    });

    const order = await createOrder({
      customerEmail: "buyer@example.com",
      items: [{ productId: product.id, quantity: 1 }],
      couponCode: "DISCOUNT5K",
    });

    expect(order.subtotalAmount).toBe(product.price);
    expect(order.discountAmount).toBe(5000);
    expect(order.totalAmount).toBe(product.price - 5000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/order-coupon-integration.test.ts`  
Expected: FAIL with "couponCode not supported" or "subtotalAmount is undefined".

- [ ] **Step 3: Update `src/services/order.service.ts` and `src/app/api/orders/route.ts`**

Update `CreateOrderInput` interface to include optional `couponCode: string`. Inside Prisma transaction, validate coupon, compute discount and net amount, save `subtotalAmount`, `discountAmount`, `couponId`, increment coupon `usedCount`, and generate VietQR URL with net `totalAmount`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/order-coupon-integration.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/order.service.ts src/app/api/orders/route.ts tests/services/order-coupon-integration.test.ts
git commit -m "feat: integrate coupon discount into order creation and VietQR payments"
```

---

### Task 7: Storefront & Checkout Coupon UI

**Files:**
- Modify: `src/app/products/[slug]/page.tsx`
- Modify: `src/components/CheckoutClient.tsx`
- Test: `tests/ui/checkout-coupon.test.ts`

**Interfaces:**
- Consumes: `POST /api/coupons/validate`, `POST /api/orders`.
- Produces: Coupon input field, live discount preview, green/red feedback badges, net total display on Checkout screen.

- [ ] **Step 1: Write UI test for checkout coupon support**

```typescript
// tests/ui/checkout-coupon.test.ts
import { describe, it, expect } from "vitest";

describe("Checkout Coupon UI", () => {
  it("should have CheckoutClient component supporting coupon display", async () => {
    const mod = await import("@/components/CheckoutClient");
    expect(mod.default).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify**

Run: `npx vitest run tests/ui/checkout-coupon.test.ts`  
Expected: PASS

- [ ] **Step 3: Update `src/app/products/[slug]/page.tsx` and `src/components/CheckoutClient.tsx`**

Add coupon input section with "Áp dụng" button on product detail purchase modal and checkout page. If coupon is applied, display strike-through original price, discount badge `-20.000đ (Mã: GIAM20K)`, and net total.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/checkout-coupon.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/products/[slug]/page.tsx src/components/CheckoutClient.tsx tests/ui/checkout-coupon.test.ts
git commit -m "feat: add coupon input and live discount badge in storefront and checkout"
```

---

### Task 8: Admin Coupon Management Dashboard

**Files:**
- Create: `src/app/api/admin/coupons/route.ts`
- Create: `src/app/api/admin/coupons/[id]/route.ts`
- Create: `src/app/admin/coupons/page.tsx`
- Create: `src/components/admin/CouponsManagerClient.tsx`
- Modify: `src/app/admin/layout.tsx` (add "Mã giảm giá" navigation item with `Ticket` icon)
- Test: `tests/services/admin-coupons.test.ts`

**Interfaces:**
- Consumes: `prisma.coupon`.
- Produces: Complete CRUD API for coupons and admin dashboard UI.

- [ ] **Step 1: Write failing test for admin coupon endpoints**

```typescript
// tests/services/admin-coupons.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Admin Coupon CRUD", () => {
  beforeEach(async () => {
    await prisma.coupon.deleteMany();
  });

  it("should allow creating, querying and deleting coupons", async () => {
    const c = await prisma.coupon.create({
      data: {
        code: "ADMINTEST",
        type: "FIXED",
        value: 50000,
      },
    });
    expect(c.id).toBeDefined();
    const list = await prisma.coupon.findMany();
    expect(list.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it passes baseline**

Run: `npx vitest run tests/services/admin-coupons.test.ts`  
Expected: PASS

- [ ] **Step 3: Implement API routes and Admin Coupons page**

Implement `GET /api/admin/coupons`, `POST /api/admin/coupons`, `PATCH /api/admin/coupons/[id]`, and `DELETE /api/admin/coupons/[id]`. Build `src/app/admin/coupons/page.tsx` and `src/components/admin/CouponsManagerClient.tsx` with modal for creating new coupons, status toggle, and coupon delete action. Add "Mã giảm giá" link to `src/app/admin/layout.tsx`.

- [ ] **Step 4: Verify test suite, TypeScript, and Next.js build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`  
Expected: All tests pass, 0 type errors, clean build.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/coupons/ src/app/admin/coupons/ src/components/admin/CouponsManagerClient.tsx src/app/admin/layout.tsx tests/services/admin-coupons.test.ts
git commit -m "feat: implement admin coupon management dashboard and APIs"
```
