# Task 3: Dynamic Pricing & Auto Stock Sync Engine

**Files:**
- Create: `src/services/pricing.service.ts`
- Test: `tests/services/pricing.service.test.ts`

**Interfaces:**
- Consumes:
  - `prisma`, `MarkupType` from `@/lib/prisma`
  - `getSupplierAdapter` from `@/services/suppliers/adapter.registry`
- Produces:
  - `calculateRetailPrice(supplierPrice: number, markupType: string, markupValue: number): number`
  - `syncProductFromSupplier(mappingId: string): Promise<SyncProductResult>`
  - `syncAllActiveSuppliers(): Promise<BulkSyncResult>`

## Requirements:
1. `calculateRetailPrice(supplierPrice, markupType, markupValue)`:
   - For `MarkupType.PERCENTAGE`: `supplierPrice * (1 + markupValue / 100)`.
   - For `MarkupType.FIXED_AMOUNT`: `supplierPrice + markupValue`.
   - Normalization: Round to nearest 1,000 VND (e.g. `Math.round(val / 1000) * 1000`).
   - Guard: Retail price must never be strictly less than `supplierPrice`.
2. `syncProductFromSupplier(mappingId)`:
   - Queries `SupplierProductMapping` with related `product` and `supplier`.
   - Resolves adapter via `getSupplierAdapter(supplier.type)`.
   - Fetches live product info: `adapter.fetchProductInfo(supplier, mapping.supplierProductCode)`.
   - Calculates `newRetailPrice`.
   - Loss Prevention Guard:
     - If supplier price changed, updates `mapping.supplierPrice = info.price`.
     - Updates `product.price = newRetailPrice`.
     - If `info.inStock <= 0`, sets `product.isActive = false` (auto-pause out of stock).
     - If `info.inStock > 0` and product was paused due to stock, re-activates `product.isActive = true`.
   - Updates `mapping.lastSyncAt = new Date()`.
3. `syncAllActiveSuppliers()`:
   - Queries all mappings where `isAutoSync: true` and `supplier.isActive: true`.
   - Iterates mappings, calls `syncProductFromSupplier`.
   - Returns `{ totalMappings, syncedCount, pausedCount, errors }`.
4. TDD:
   - Write tests in `tests/services/pricing.service.test.ts` covering rounding, percentage, fixed markup, price spike safety, zero stock deactivation, and bulk sync with MockAdapter.
5. Commit: `feat: implement dynamic pricing rules and stock synchronization engine`.
