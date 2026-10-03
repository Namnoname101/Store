### Dropship Task 3 Completion Report

**Status:** COMPLETE
**Commit Hash:** `302ebbdcec0cebdb79636d721037c914320fabcb`

**Summary of Changes:**
1. Created `src/services/pricing.service.ts`:
   - `calculateRetailPrice(supplierPrice, markupType, markupValue)`: Percentage and fixed amount calculations, rounding to nearest 1,000 VND, and loss prevention guard ensuring retail price is never strictly less than supplier price.
   - `syncProductFromSupplier(mappingId)`: Queries mapping, resolves adapter, fetches live product info, recalculates retail price, updates supplierPrice, updates product price, auto-pauses when out of stock (`isActive = false`), and re-activates when replenished (`isActive = true`).
   - `syncAllActiveSuppliers()`: Batch syncs all active mappings with auto-sync enabled, tracks totalMappings, syncedCount, pausedCount, and captures individual errors safely without breaking batch execution.
2. Created `tests/services/pricing.service.test.ts` (11 comprehensive unit & integration tests).
3. Test suite verification:
   - `tests/services/pricing.service.test.ts`: 11/11 tests passing.
   - Whole test suite: 135/135 tests passing across 12 test files.
   - TypeScript check: `npx tsc --noEmit` passed with 0 errors.
