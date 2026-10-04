# Technical Specification: Admin Authentication, Floating Customer Support & Coupon Engine

**Date:** 2026-10-04  
**Status:** Approved  
**Author:** Antigravity & Lead Engineer  

---

## 1. Overview & Objectives

This specification defines the architectural enhancements to DigiStore to satisfy three production-readiness requirements:
1. **Admin Portal Authentication (`/admin`)**: Protect administrative endpoints, financial metrics, customer orders, and sensitive inventory keys from unauthorized public access using secure, HTTP-only cookie sessions.
2. **Floating Support Widget**: Provide immediate, high-converting customer assistance via floating action button linking directly to Facebook profile (`https://www.facebook.com/2k2.2k6`) and Messenger.
3. **Discount Coupon Engine**: Enable marketing campaigns with flexible promotional codes (Fixed VND discount or Percentage discount), minimum cart spend thresholds, usage limits, expiration dates, and automated calculation during order creation and VietQR payment.

---

## 2. Data Model & Database Architecture

### 2.1 Prisma Schema Updates (`prisma/schema.prisma`)

```prisma
// Discount type representation for SQLite
// CouponType: FIXED, PERCENT

model Coupon {
  id             String      @id @default(uuid())
  code           String      @unique // Case-insensitive normalized uppercase e.g. "GIAM20K", "CHAOBANMOI"
  type           String      @default("FIXED") // CouponType: FIXED, PERCENT
  value          Int         // VND amount if FIXED, or percentage (1-100) if PERCENT
  minOrderValue  Int         @default(0) // Minimum total order value required (VND)
  maxDiscount    Int?        // Max discount ceiling in VND (useful when type = PERCENT)
  usageLimit     Int?        // Nullable: unlimited if null, or max total uses
  usedCount      Int         @default(0) // Incremented when order transitions to PAID or created
  expiresAt      DateTime?   // Nullable: unlimited validity if null
  isActive       Boolean     @default(true)
  orders         Order[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

// Update Order model to capture discount history
model Order {
  id             String               @id @default(uuid())
  orderCode      String               @unique
  customerEmail  String
  customerNote   String?
  userId         String?
  user           User?                @relation(fields: [userId], references: [id])
  totalAmount    Int                  // Net amount customer pays via VietQR (after discount)
  subtotalAmount Int                  @default(0) // Gross amount before discount
  discountAmount Int                  @default(0) // Discount VND subtracted
  couponId       String?
  coupon         Coupon?              @relation(fields: [couponId], references: [id])
  status         String               @default("PENDING")
  paymentMethod  String               @default("VIETQR")
  upstreamStatus String               @default("NOT_APPLICABLE")
  upstreamOrderId String?
  upstreamError  String?
  refundInfo     String?
  expiresAt      DateTime
  paidAt         DateTime?
  orderItems     OrderItem[]
  deliveredItems ProductItem[]
  transactions   PaymentTransaction[]
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt
}
```

---

## 3. Subsystem 1: Admin Authentication & Route Protection

### 3.1 Architecture & Security Strategy
- **Mechanism**: Secure Passcode + Signed HttpOnly Cookie Session.
- **Environment Variable**: `ADMIN_PASSWORD` (defaults to a strong secret or dev fallback, configurable in `.env` and `fly secrets set ADMIN_PASSWORD=...`).
- **Session Token**: HMAC-SHA256 signed session payload containing `role: 'ADMIN'`, `issuedAt: number`, and expiration timestamp (default: 7 days).
- **Cookie Settings**:
  - `Name`: `admin_session`
  - `HttpOnly`: `true` (unreachable from JavaScript, immune to XSS theft)
  - `Secure`: `process.env.NODE_ENV === "production"`
  - `SameSite`: `lax`
  - `Path`: `/`

### 3.2 Routes & Components
1. **Route Middleware / Server Guard** (`src/middleware.ts` or layout authentication guard):
   - Intercepts all requests matching `/admin/:path*` (except `/admin/login`) and `/api/admin/:path*`.
   - Validates the signature and expiration of `admin_session`.
   - If invalid or missing:
     - For web routes (`/admin/...`): redirects to `/admin/login?callbackUrl=...`.
     - For API routes (`/api/admin/...`): responds with HTTP `401 Unauthorized` (`{ error: "Unauthorized" }`).
2. **Login View** (`src/app/admin/login/page.tsx`):
   - Clean, dark glassmorphism card matching DigiStore branding.
   - Password input with toggle reveal.
   - Calls `POST /api/admin/auth/login`. On success, redirects to `/admin` or `callbackUrl`.
3. **Auth APIs**:
   - `POST /api/admin/auth/login`: verifies password against `process.env.ADMIN_PASSWORD`, sets HttpOnly cookie.
   - `POST /api/admin/auth/logout`: clears `admin_session` cookie, redirects to `/admin/login`.
4. **Header / Sidebar Integration**:
   - Add a "Đăng xuất" (Logout) action button to `src/app/admin/layout.tsx`.

---

## 4. Subsystem 2: Floating Customer Support Widget

### 4.1 UI/UX Design & Responsiveness
- **Component**: `src/components/FloatingSupport.tsx`.
- **Placement**: Fixed at `bottom-6 right-6` (z-index 40).
- **Visibility Guard**: Returns `null` if current route begins with `/admin` to avoid cluttering dashboard controls.
- **Visuals**:
  - Pulse ring animation with smooth hover scale.
  - Multi-channel support menu on click or direct 1-click action:
    - **Facebook Profile**: `https://www.facebook.com/2k2.2k6`
    - **Facebook Messenger**: `https://m.me/2k2.2k6`
    - Tooltip: "Cần hỗ trợ? Chat ngay với chúng tôi!"
- **Accessibility**: Includes `aria-label`, keyboard navigation support, and outside-click dismiss.

---

## 5. Subsystem 3: Coupon & Discount Engine

### 5.1 Business Logic (`src/services/coupon.service.ts`)
- **Normalization**: All coupon codes are converted to uppercase and whitespace-trimmed (e.g. `giam10k` -> `GIAM10K`).
- **Validation Rules**:
  1. Coupon must exist and have `isActive === true`.
  2. If `expiresAt` is present, `new Date() <= coupon.expiresAt`.
  3. If `usageLimit` is present, `coupon.usedCount < coupon.usageLimit`.
  4. Cart subtotal must be `>= coupon.minOrderValue`.
- **Calculation Logic**:
  - If `type === "FIXED"`: `discount = Math.min(coupon.value, cartSubtotal)`.
  - If `type === "PERCENT"`: `discount = Math.round((cartSubtotal * coupon.value) / 100)`. If `coupon.maxDiscount` exists, `discount = Math.min(discount, coupon.maxDiscount)`.
  - **Loss Prevention Rule**: An order total cannot drop below 1,000 VND (minimum threshold required for banking transactions and VietQR generation). If discount would reduce total below 1,000 VND, `totalAmount = 1000` and `discountAmount = cartSubtotal - 1000`.

### 5.2 API Routes
1. **Public Coupon Validation** (`POST /api/coupons/validate`):
   - Input: `{ code: string, cartTotal: number }`
   - Output: `{ valid: boolean, discountAmount: number, finalTotal: number, message?: string }`
2. **Order Creation Integration** (`POST /api/orders` & `order.service.ts`):
   - Accepts optional `couponCode: string`.
   - Validates coupon server-side inside atomic Prisma transaction.
   - Computes `subtotalAmount`, `discountAmount`, and `totalAmount`.
   - Increments `Coupon.usedCount` atomically upon order creation (or when paid).
   - Generates VietQR with the net discounted amount.
3. **Admin Coupon Management APIs**:
   - `GET /api/admin/coupons`: List all coupons with stats (used count, remaining, expiration, active status).
   - `POST /api/admin/coupons`: Create a new coupon (validates uniqueness of code).
   - `PATCH /api/admin/coupons/[id]`: Toggle `isActive` or edit limit/expiry.
   - `DELETE /api/admin/coupons/[id]`: Delete or soft-delete coupon.

### 5.3 UI & Customer Experience
1. **Checkout & Product Purchase Flow** (`src/components/CheckoutClient.tsx` & Product Detail):
   - Coupon input box with "Áp dụng" button.
   - Instant visual feedback: Green badge showing `-20,000đ (Đã áp dụng mã GIAM20K)` or clear error message.
   - Updated VietQR image and bank transfer amount reflecting the discounted total.
2. **Admin Coupon Dashboard** (`src/app/admin/coupons/page.tsx` & `CouponsManagerClient.tsx`):
   - Metrics cards: Total coupons, Active coupons, Total discounts given.
   - Table with quick action toggles (Active / Paused), code copy, and delete.
   - "Tạo mã khuyến mãi" modal with fields: Code, Type (Fixed/Percent), Value, Min spend, Limit, Expiry.

---

## 6. Testing & Quality Verification

1. **Unit & Service Tests**:
   - `tests/services/coupon.service.test.ts`:
     - Validate active, expired, exhausted, below-minimum, and valid coupons.
     - Test percentage calculation with maxDiscount cap.
     - Test minimum order total safeguard (1,000 VND floor).
   - `tests/services/admin-auth.service.test.ts`:
     - Test password verification, token generation, signature validation, and expiration.
2. **API & Integration Tests**:
   - `tests/api/coupons.test.ts`: test validate route and order creation with discount.
   - `tests/api/admin-auth.test.ts`: test route protection on `/admin` and `/api/admin/*`.
3. **UI & Regression Tests**:
   - Ensure all 185 existing tests pass with 0 regressions.
   - Verify TypeScript compilation (`npx tsc --noEmit`) and Next.js production build (`npm run build`).
