# Task 4: Order Creation & Checkout Service

**Files:**
- Create: `src/services/order.service.ts`
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[orderCode]/status/route.ts`
- Test: `tests/services/order.service.test.ts`

**Interfaces:**
- Consumes:
  - `prisma` from `@/lib/prisma`
  - `reserveItemsForOrder`, `releaseExpiredReservations` from `@/services/inventory.service`
  - `generateVietQrUrl`, `generateOrderCode` from `@/lib/vietqr`
- Produces:
  - `createOrder(data: { customerEmail: string, items: { productId: string, quantity: number }[], userId?: string })`
  - `getOrderDetails(orderCode: string)`
  - `checkAndExpireOrder(orderCode: string)`
  - `POST /api/orders`
  - `GET /api/orders/[orderCode]/status`

## Requirements:
1. `createOrder(data)`:
   - Validates `customerEmail` format and non-empty items.
   - Generates unique `orderCode` (looping if collision).
   - Fetches products from database to calculate real `totalAmount` (never trusts client price).
   - Within `prisma.$transaction`:
     - Creates `Order` with `status: PENDING`, `expiresAt: now + 15 minutes`.
     - Creates `OrderItem` records.
     - Calls `reserveItemsForOrder` for each product.
   - If stock is insufficient, transaction rolls back cleanly with error.
2. `getOrderDetails(orderCode)`:
   - Checks if order is expired (`now > expiresAt` and `status === 'PENDING'`). If expired, updates order to `EXPIRED` and calls `releaseExpiredReservations()`.
   - Returns order details:
     - If `PENDING`: includes `vietQrUrl`, countdown info, product info. DOES NOT expose `secretContent`.
     - If `PAID`: includes `deliveredItems` with `secretContent` (keys/credentials).
     - If `EXPIRED` or `CANCELLED`: returns current status.
3. Next.js API Routes:
   - `POST /api/orders`: expects `{ customerEmail, items: [{ productId, quantity }] }`, returns `{ success: true, order: { orderCode, expiresAt, totalAmount, vietQrUrl } }`.
   - `GET /api/orders/[orderCode]/status`: returns `{ status, paidAt, deliveredItems, vietQrUrl, expiresAt }`.
4. Bank Configuration:
   - Reads `process.env.BANK_ID` (default `'MB'`), `process.env.BANK_ACCOUNT_NO` (default `'0987654321'`), `process.env.BANK_ACCOUNT_NAME` (default `'CONG TY DICH VU'`).
5. TDD:
   - Write failing tests in `tests/services/order.service.test.ts`.
   - Implement service and API routes.
   - Verify all tests pass.
6. Commit: `feat: add order creation and status checking endpoints`.
