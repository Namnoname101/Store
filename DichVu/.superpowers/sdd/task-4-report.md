### Task 4 Completion Report

**Status:** COMPLETE
**Commit Hash:** `80eda4a6bec87c12a7d03211b1b85d23b78dced4`

**Summary of Changes:**
1. Created `src/services/order.service.ts` with `createOrder`, `getOrderDetails`, `checkAndExpireOrder`.
2. Created `src/app/api/orders/route.ts` (`POST /api/orders`) and `src/app/api/orders/[orderCode]/status/route.ts` (`GET /api/orders/[orderCode]/status`).
3. Updated `src/services/inventory.service.ts` to accept optional `txClient` for transaction composition.
4. Created `tests/services/order.service.test.ts` with 18 unit, integration, and API route tests.

**Test Output:**
```
 RUN  v2.1.9 E:/Du An/Web/DichVu

 ✓ tests/lib/vietqr.test.ts (21 tests) 12ms
 ✓ tests/db.test.ts (3 tests) 94ms
 ✓ tests/services/inventory.service.test.ts (11 tests) 444ms
 ✓ tests/services/order.service.test.ts (18 tests) 838ms

 Test Files  4 passed (4)
      Tests  53 passed (53)
   Duration  2.23s
```
