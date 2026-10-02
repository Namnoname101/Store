# Task 7: Checkout & Real-time Auto-Delivery UI

**Files:**
- Create: `src/app/checkout/[orderCode]/page.tsx`
- Create: `src/components/CheckoutClient.tsx`
- Create: `src/app/order-success/[orderCode]/page.tsx`
- Create: `src/components/SecretDisplay.tsx`
- Create: `src/components/CountdownTimer.tsx`
- Test: `tests/ui/checkout-flow.test.ts`

**Interfaces:**
- Consumes:
  - `getOrderDetails` from `@/services/order.service`
  - `/api/orders/[orderCode]/status`
- Produces:
  - Real-time VietQR Checkout screen with copy-to-clipboard, 15-minute countdown, and 3-second auto-polling.
  - Instant auto-delivery screen (`/order-success/[orderCode]`) with 1-click secret copy and activation guide.

## Requirements:
1. `src/app/checkout/[orderCode]/page.tsx` & `CheckoutClient.tsx`:
   - Fetches order info via `getOrderDetails(orderCode)`.
   - If order is already `PAID`, redirect directly to `/order-success/[orderCode]`.
   - If order is not found, renders clean not-found notice.
   - Display:
     - Big, clear VietQR image (`vietQrUrl`).
     - Copyable fields with 1-click copy buttons:
       - Ngân hàng & Tên chủ tài khoản
       - Số tài khoản
       - Số tiền chính xác (VND)
       - Nội dung chuyển khoản (bắt buộc đúng: `ORDxxxxxx`)
     - `CountdownTimer`: calculates remaining time from `expiresAt`. If time reaches 0, updates UI to expired notice.
     - Real-time polling: `setInterval` every 3s calling `/api/orders/[orderCode]/status`.
     - When status changes to `PAID`, smoothly redirect to `/order-success/[orderCode]`.
     - Manual button: "Tôi đã chuyển khoản - Kiểm tra ngay" for instant verification.
2. `src/app/order-success/[orderCode]/page.tsx` & `SecretDisplay.tsx`:
   - Fetches order via `getOrderDetails(orderCode)`. If not paid, redirect back to `/checkout/[orderCode]`.
   - Renders success celebration banner.
   - Renders list of purchased items. For each item:
     - Displays `secretContent` (license key, account login `email|password`, or course link).
     - Individual "Sao chép" button with checkmark animation on copy.
     - "Sao chép tất cả" button if multiple items.
     - Instructions box customized for product type (e.g., how to activate Windows key, login to account, or access course).
     - Customer support hotline / Zalo / Telegram button for assistance.
3. Tests (`tests/ui/checkout-flow.test.ts`):
   - Tests validating order checkout details format, secret content protection on pending vs paid, and expiration status handling.
4. Next.js build verification: `npm run build` must succeed cleanly.
5. Commit: `feat: implement realtime QR checkout and auto-delivery delivery view`.
