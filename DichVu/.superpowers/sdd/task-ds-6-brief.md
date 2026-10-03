# Task 6: Admin Supplier Management & Product Mapping Dashboard

**Files:**
- Create: `src/app/admin/suppliers/page.tsx`
- Create: `src/components/admin/SupplierManagerClient.tsx`
- Create: `src/app/api/admin/suppliers/route.ts`
- Create: `src/app/api/admin/suppliers/[id]/route.ts`
- Create: `src/app/api/admin/suppliers/[id]/balance/route.ts`
- Create: `src/app/api/admin/suppliers/sync/route.ts`
- Create: `src/app/api/admin/orders/[orderId]/retry-upstream/route.ts`
- Modify: `src/app/admin/layout.tsx` (add navigation item for Suppliers)
- Modify: `src/components/admin/OrdersManagerClient.tsx` (add upstream status badge, error display, refundInfo display, and retry button)
- Modify: `src/services/admin.service.ts` (ensure order detail queries include `upstreamStatus`, `upstreamOrderId`, `upstreamError`, `refundInfo`)
- Test: `tests/services/admin-suppliers.test.ts`

**Interfaces:**
- Consumes:
  - `prisma`, `SupplierType`, `MarkupType`, `UpstreamStatus` from `@/lib/prisma`
  - `getSupplierAdapter` from `@/services/suppliers/adapter.registry`
  - `syncProductFromSupplier`, `syncAllActiveSuppliers` from `@/services/pricing.service`
  - `retryUpstreamFulfillment` from `@/services/upstream-fulfillment.service`
- Produces:
  - Supplier management (create, update, view, check balance via API adapter)
  - Product mapping management (link local product to supplier code, set markup percentage/fixed, sync price/stock)
  - Admin bulk sync endpoint (`POST /api/admin/suppliers/sync`)
  - Admin order retry endpoint (`POST /api/admin/orders/[orderId]/retry-upstream`)
  - Visual status and refund info monitoring in `OrdersManagerClient`

## Requirements:
1. `src/services/admin.service.ts`:
   - In `getAdminOrders`: ensure `upstreamStatus`, `upstreamOrderId`, `upstreamError`, `refundInfo` are included in the return object and TypeScript interface `AdminOrderDetail`.
2. API Routes:
   - `src/app/api/admin/suppliers/route.ts`:
     - `GET`: returns all suppliers with `mappings: { include: { product: true } }`.
     - `POST`: creates new supplier with fields: `name`, `code`, `type`, `baseUrl`, `apiKey`, `apiSecret` (optional), `isActive`.
   - `src/app/api/admin/suppliers/[id]/route.ts`:
     - `GET`: returns supplier with mappings.
     - `PUT` / `PATCH`: updates supplier info or active status.
     - `DELETE`: removes supplier.
   - `src/app/api/admin/suppliers/[id]/balance/route.ts`:
     - `POST`: resolves adapter via `getSupplierAdapter(supplier.type)`, calls `adapter.checkBalance(supplier)`, updates `supplier.currentBalance` in DB, and returns `{ success: true, balance: number }`.
   - `src/app/api/admin/suppliers/sync/route.ts`:
     - `POST`: accepts optional body `{ mappingId?: string }`.
       - If `mappingId`: calls `syncProductFromSupplier(mappingId)`.
       - If omitted: calls `syncAllActiveSuppliers()`.
       - Returns sync result `{ success: true, result }`.
   - `src/app/api/admin/orders/[orderId]/retry-upstream/route.ts`:
     - `POST`: calls `retryUpstreamFulfillment(orderId)`.
     - Returns `{ success: boolean, status: string, error?: string, upstreamOrderId?: string }`.
3. Admin Suppliers UI:
   - `src/app/admin/suppliers/page.tsx`:
     - Loads initial suppliers, mappings, and products from DB and renders `<SupplierManagerClient />`.
   - `src/components/admin/SupplierManagerClient.tsx`:
     - Tab 1: **Nhà cung cấp (Suppliers)**:
       - Displays cards or table with supplier name, code, type (Taphoammo / Trumthe / Custom REST), API URL, current balance in VND, and active status toggle.
       - Button "Kiểm tra số dư API" with loading spinner that updates balance immediately.
       - "Thêm nhà cung cấp mới" button and modal form.
     - Tab 2: **Liên kết sản phẩm (Product Mappings)**:
       - Displays list of product mappings: Product title, Supplier name, Supplier Product Code, Supplier Price, Markup rule (e.g. `+20%` or `+15,000đ`), Selling Retail Price, and Auto-Sync status.
       - Button "Đồng bộ toàn bộ giá & tồn kho ngay" (1-click bulk sync) with live feedback alert.
       - Modal/form to create or edit mapping (select product, select supplier, enter supplier SKU/code, choose markup type & value).
4. Layout & Orders UI Update:
   - `src/app/admin/layout.tsx`:
     - Add navigation entry `{ name: "Nhà cung cấp", href: "/admin/suppliers", icon: Truck }`.
   - `src/components/admin/OrdersManagerClient.tsx`:
     - In order row / details:
       - Display `upstreamStatus` badge:
         - `COMPLETED`: Emerald badge "Cấp mã tự động: Thành công"
         - `PENDING_UPSTREAM`: Amber badge "Đang cấp mã tự động..."
         - `FAILED`: Rose badge "Lỗi cấp mã đối tác" with error text and a "Thử đặt lại qua API" button calling `/api/admin/orders/[orderId]/retry-upstream`.
       - If `order.refundInfo` exists:
         - Render an attention box displaying customer's refund request details (Bank, Account No, Account Name, Note, Requested At).
5. TDD:
   - Create `tests/services/admin-suppliers.test.ts`:
     - Test GET / POST suppliers.
     - Test check balance endpoint with MockSupplierAdapter.
     - Test sync endpoint with MockSupplierAdapter.
     - Test retry upstream route for failed orders.
6. Commit: `feat: implement admin supplier management, mapping dashboard, and order retry`.
