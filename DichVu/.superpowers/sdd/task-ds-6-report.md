# Task 6 Report: Admin Supplier Management & Product Mapping Dashboard

- **Status**: COMPLETE
- **Commit**: `63af5962ac9fd973710edd55217cff5ca6e76755`
- **Work Directory**: `e:\Du An\Web\DichVu`

---

## 1. Summary of Changes

### TDD & Testing (`tests/services/admin-suppliers.test.ts`)
- Implemented full suite with 12 tests validating:
  - `POST /api/admin/suppliers` (creation and validation)
  - `GET /api/admin/suppliers` (list with mapped products)
  - `GET /api/admin/suppliers/[id]` (single supplier detail)
  - `PUT /api/admin/suppliers/[id]` (updates name, active status, etc.)
  - `DELETE /api/admin/suppliers/[id]` (cascaded deletion)
  - `POST /api/admin/suppliers/[id]/balance` (live API balance check with `MockSupplierAdapter` and DB persistence)
  - `POST /api/admin/suppliers/sync` (single product mapping sync and bulk active suppliers sync)
  - `POST /api/admin/orders/[orderId]/retry-upstream` (re-triggering upstream fulfillment for FAILED orders)
  - `getAdminOrders` and `getAllOrdersAdmin` returning `upstreamStatus`, `upstreamOrderId`, `upstreamError`, and `refundInfo`.

### API Routes
- `src/app/api/admin/suppliers/route.ts`: `GET` (all suppliers with mappings) and `POST` (create supplier with code duplication check).
- `src/app/api/admin/suppliers/[id]/route.ts`: `GET`, `PUT`, `PATCH`, `DELETE`.
- `src/app/api/admin/suppliers/[id]/balance/route.ts`: `POST` calling `getSupplierAdapter(supplier.type).checkBalance()`.
- `src/app/api/admin/suppliers/sync/route.ts`: `POST` calling `syncProductFromSupplier(mappingId)` or `syncAllActiveSuppliers()`.
- `src/app/api/admin/orders/[orderId]/retry-upstream/route.ts`: `POST` invoking `retryUpstreamFulfillment(orderId)`.
- `src/app/api/admin/suppliers/mappings/route.ts`: `POST` (upsert mapping, calculate retail price, set `API_DROPSHIP` fulfillment) and `DELETE` (remove mapping, revert to `LOCAL_STOCK`).

### Services (`src/services/admin.service.ts`)
- Explicitly enriched `AdminOrderDetail` interface with `upstreamStatus`, `upstreamOrderId`, `upstreamError`, and `refundInfo`.
- Exported `getAdminOrders` alias alongside `getAllOrdersAdmin`.

### Admin Layout & Order Management UI
- `src/app/admin/layout.tsx`: Added navigation item "Nhà cung cấp" with `Truck` icon linking to `/admin/suppliers`.
- `src/components/admin/OrdersManagerClient.tsx`:
  - Added `upstreamStatus` badges in order rows and expanded details (`COMPLETED`, `PENDING_UPSTREAM`, `FAILED`, `REFUNDED`).
  - Added upstream supplier fulfillment details card with error message display.
  - Added 1-click "Thử đặt lại qua API" retry button with spinner and live state update.
  - Added customer refund request banner displaying bank name, account number, account holder name, note, and request timestamp.

### Admin Dashboard UI
- `src/app/admin/suppliers/page.tsx`: Server component querying suppliers, mappings, and catalog products.
- `src/components/admin/SupplierManagerClient.tsx`:
  - **Tab 1: Nhà cung cấp (Suppliers)**: Metric cards, balance query with loading indicator, active toggle, add/edit/delete modal.
  - **Tab 2: Liên kết sản phẩm (Product Mappings)**: 1-click bulk sync button, mapping table with supplier SKU, cost price, markup rule badge, retail selling price, auto-sync badge, 1-click single mapping sync, and add/edit mapping modal with real-time profit preview.

---

## 2. Test Verification

```
 RUN  v2.1.9 E:/Du An/Web/DichVu

 ✓ tests/services/suppliers/supplier-adapter.test.ts (22 tests) 42ms
 ✓ tests/services/admin-suppliers.test.ts (12 tests) 1371ms
 ✓ tests/services/upstream-fulfillment.service.test.ts (9 tests) 2034ms
 ✓ tests/services/inventory.service.test.ts (11 tests) 2520ms
 ✓ tests/ui/dropship-customer-flow.test.ts (10 tests) 484ms
 ✓ tests/services/payment.service.test.ts (14 tests) 2968ms
 ✓ tests/services/pricing.service.test.ts (11 tests) 3328ms
 ✓ tests/lib/vietqr.test.ts (21 tests) 16ms
 ✓ tests/services/order.service.test.ts (18 tests) 3837ms
 ✓ tests/db-suppliers.test.ts (6 tests) 463ms
 ✓ tests/services/admin.service.test.ts (4 tests) 998ms
 ✓ tests/ui/checkout-flow.test.ts (10 tests) 3224ms
 ✓ tests/services/bulk-import.service.test.ts (7 tests) 186ms
 ✓ tests/services/catalog.service.test.ts (8 tests) 1637ms
 ✓ tests/db.test.ts (3 tests) 102ms

 Test Files  15 passed (15)
      Tests  166 passed (166)
```

TypeScript check (`npx tsc --noEmit`): **0 errors, clean**.
