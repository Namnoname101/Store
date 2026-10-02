# Task 2: Inventory Reservation Engine (Concurrency & Expiration Logic)

**Files:**
- Create: `src/services/inventory.service.ts`
- Test: `tests/services/inventory.service.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`
- Produces:
  - `reserveItemsForOrder(productId: string, quantity: number, orderId: string, durationMinutes?: number): Promise<ProductItem[]>`
  - `releaseExpiredReservations(): Promise<number>`
  - `commitReservedItemsToSold(orderId: string): Promise<ProductItem[]>`
  - `getAvailableStockCount(productId: string): Promise<number>`

## Requirements:
1. Implement `reserveItemsForOrder(productId, quantity, orderId, durationMinutes = 15)`:
   - Uses `prisma.$transaction`.
   - Query available items for `productId` where `status === 'AVAILABLE'`.
   - If count < quantity, throw an Error with message `"Insufficient stock available"`.
   - Take the top `quantity` items, update them to `status = 'RESERVED'`, `orderId = orderId`, and `reservedUntil = new Date(Date.now() + durationMinutes * 60 * 1000)`.
   - Return the reserved items.
2. Implement `releaseExpiredReservations()`:
   - Finds all `ProductItem` where `status === 'RESERVED'` and `reservedUntil < new Date()`.
   - Updates them back to `status = 'AVAILABLE'`, `orderId = null`, `reservedUntil = null`.
   - Returns the count of released items.
3. Implement `commitReservedItemsToSold(orderId)`:
   - Updates all `ProductItem` associated with `orderId` having `status === 'RESERVED'` to `status = 'SOLD'` and `reservedUntil = null`.
   - Returns the sold items.
4. Implement `getAvailableStockCount(productId)`:
   - Counts items where `productId === productId` and `status === 'AVAILABLE'`.
5. TDD Requirements:
   - Write unit and integration tests in `tests/services/inventory.service.test.ts`.
   - Test regular reservation, insufficient stock error, commit to sold, and expired item release.
   - Test race-condition simulation (concurrent reservation attempts).
6. Commit: `feat: implement inventory reservation and concurrency engine`.
