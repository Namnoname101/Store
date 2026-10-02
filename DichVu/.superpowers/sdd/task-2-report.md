### Task 2 Completion Report

**Status:** COMPLETE
**Commit Hash:** `7f94063258f6086cc67d3bec8e7421d642d46f63`

**Summary of Changes:**
1. Created `tests/services/inventory.service.test.ts` with 11 tests covering all reservation, expiration, commit, and concurrency conditions.
2. Created `src/services/inventory.service.ts` implementing `reserveItemsForOrder`, `releaseExpiredReservations`, `commitReservedItemsToSold`, `getAvailableStockCount` with Prisma transactions.
3. Updated `.gitignore`.

**Test Output:**
```
 RUN  v2.1.9 E:/Du An/Web/DichVu

 ✓ tests/services/inventory.service.test.ts (11 tests) 484ms
 ✓ tests/db.test.ts (3 tests) 64ms

 Test Files  2 passed (2)
      Tests  14 passed (14)
   Duration  1.40s
```
