### Dropship Task 1 Completion Report

**Status:** COMPLETE
**Commit Hash:** `e3cdc7a4e23b5128016dc5ad90f7edd614119568`

**Summary of Changes:**
1. Modified `prisma/schema.prisma` with `Supplier`, `SupplierProductMapping`, and extended `Product` and `Order`.
2. Modified `src/lib/prisma.ts` with types & constants for `FulfillmentType`, `SupplierType`, `MarkupType`, `UpstreamStatus`.
3. Created `tests/db-suppliers.test.ts` (6 tests).
4. Synchronized SQLite database (`npx prisma db push`).
5. All 102/102 tests passing.
