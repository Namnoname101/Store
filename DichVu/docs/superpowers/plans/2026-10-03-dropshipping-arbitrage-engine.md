# Automated Digital Goods Dropshipping & Arbitrage Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống mua đi bán lại sản phẩm số tự động (Dropshipping / Arbitrage API), kết nối sàn nguồn (Taphoammo, Trumthe, Custom REST) để tự động mua và bàn giao cho khách ăn chênh lệch lợi nhuận ngay khi nhận tiền VietQR, đảm bảo chuẩn White-Label 100%.

**Architecture:** Next.js Fullstack (App Router), Prisma Schema mở rộng (Supplier, SupplierProductMapping, FulfillmentType), Plugin/Adapter Pattern cho các sàn đối tác, cơ chế tính giá động (Markup Engine) và quy trình mua hàng tự động khi đơn hàng chuyển sang `PAID`.

**Tech Stack:** Next.js 14, TypeScript, Prisma ORM, SQLite/PostgreSQL, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-03-dropshipping-arbitrage-engine-design.md`

## Global Constraints

- **Tuyệt đối White-Label trên giao diện khách hàng:** Không bao giờ để lộ tên sàn đối tác, endpoint, hoặc nguồn nhập bên thứ ba ("Hệ thống đang cấp phát mã tự động...").
- **Hỗ trợ Song song (Hybrid):** Hệ thống phải phục vụ đồng thời cả sản phẩm tự nhập kho (`LOCAL_STOCK`) và sản phẩm bán qua API đối tác (`API_DROPSHIP`).
- **Quy tắc định giá an toàn (Loss Prevention Guard):** Không bao giờ để giá bán lẻ thấp hơn giá vốn bên sàn; nếu giá sàn vượt giá bán hoặc sàn hết hàng, tự động tạm ngưng bán (`isActive = false`).
- **Xử lý sự cố không làm mất tiền của khách:** Nếu sàn đối tác bị lỗi (hết hàng, hết số dư), đơn hàng lưu trạng thái `FAILED`, giữ thông tin thanh toán, và mở form nhận STK để hoàn tiền an toàn.

## Review Focus

1. **Sàn đối tác hết hàng khi khách vừa chuyển khoản:** Đơn chuyển `FAILED`, giao diện hiển thị thông báo thân thiện và form nhập STK hoàn tiền, không crash hệ thống.
2. **Số dư tài khoản API đại lý bị hết:** Hiển thị cảnh báo đỏ trên Admin Dashboard, gắn cờ `REQUIRES_MANUAL_REVIEW`.
3. **Phản hồi từ API đối tác chứa ký tự rác / xuống dòng đặc biệt:** Chuẩn hóa và làm sạch chuỗi key/tài khoản trước khi lưu vào `ProductItem`.
4. **Bảo mật API Key của sàn đối tác:** API Key và Secret của các sàn đối tác chỉ được lưu và đọc ở Server-side, không bao giờ gửi về client.
5. **Đồng bộ giá tự động làm tròn:** Giá bán lẻ tính theo % phải được làm tròn đến hàng nghìn đồng (ví dụ 124.800đ -> 125.000đ) để hiển thị đẹp mắt theo chuẩn VND.

---

### Task 1: Prisma Schema Extensions for Suppliers & Dropshipping Mappings

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Test: `tests/db-suppliers.test.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces: Models `Supplier`, `SupplierProductMapping`, Enums `FulfillmentType`, `SupplierType`, `MarkupType`, `UpstreamStatus`

- [ ] **Step 1: Write failing test for Supplier and Mapping schema**
```typescript
// tests/db-suppliers.test.ts
import { describe, it, expect } from 'vitest';
import { prisma, FulfillmentType, SupplierType, MarkupType, UpstreamStatus } from '../src/lib/prisma';

describe('Supplier & Dropshipping Schema Extensions', () => {
  it('should create a supplier and link product mapping with markup', async () => {
    // Assert supplier creation with type TAPHOAMMO
    // Assert product with fulfillmentType API_DROPSHIP and supplierMapping
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/db-suppliers.test.ts`  
Expected: FAIL (missing models/enums)

- [ ] **Step 3: Update `prisma/schema.prisma` and push to database**
Add `FulfillmentType`, `SupplierType`, `MarkupType`, `UpstreamStatus`, and models `Supplier`, `SupplierProductMapping`. Extend `Product` and `Order`. Run `npx prisma db push`. Export typed constants in `src/lib/prisma.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/db-suppliers.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add prisma/ src/lib/prisma.ts tests/db-suppliers.test.ts
git commit -m "feat: add supplier and dropshipping mapping schema models"
```

---

### Task 2: Supplier Adapter Engine (Taphoammo, Trumthe & MockSupplierAdapter)

**Files:**
- Create: `src/services/suppliers/supplier-adapter.interface.ts`
- Create: `src/services/suppliers/adapters/mock.adapter.ts`
- Create: `src/services/suppliers/adapters/taphoammo.adapter.ts`
- Create: `src/services/suppliers/adapters/trumthe.adapter.ts`
- Create: `src/services/suppliers/adapter.registry.ts`
- Test: `tests/services/suppliers/supplier-adapter.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `ISupplierAdapter`: `checkBalance()`, `fetchProductInfo()`, `buyProduct()`
  - `getSupplierAdapter(type: string): ISupplierAdapter`

- [ ] **Step 1: Write failing unit tests for supplier adapters**
Test that `MockSupplierAdapter` can simulate balance checking, product info fetching, successful purchases returning key arrays, and controlled errors (insufficient balance, out of stock). Test that `getSupplierAdapter` resolves correct adapters.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/suppliers/supplier-adapter.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Adapter Interface, MockAdapter, TaphoammoAdapter, TrumtheAdapter, and Registry**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/suppliers/supplier-adapter.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/suppliers/ tests/services/suppliers/
git commit -m "feat: implement supplier adapter pattern and registry"
```

---

### Task 3: Dynamic Pricing & Auto Stock Sync Engine

**Files:**
- Create: `src/services/pricing.service.ts`
- Test: `tests/services/pricing.service.test.ts`

**Interfaces:**
- Consumes: `prisma`, `getSupplierAdapter`
- Produces:
  - `calculateRetailPrice(supplierPrice: number, markupType: string, markupValue: number): number`
  - `syncProductFromSupplier(mappingId: string): Promise<SyncResult>`
  - `syncAllActiveSuppliers(): Promise<BulkSyncResult>`

- [ ] **Step 1: Write failing tests for retail price calculation and sync engine**
Verify percentage markup (e.g. 100k + 20% = 120k), fixed amount markup (100k + 15k = 115k), rounding to nearest thousand, and loss prevention guard (auto-disables product if supplier price spikes or out of stock).

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/pricing.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `pricing.service.ts`**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/pricing.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/pricing.service.ts tests/services/pricing.service.test.ts
git commit -m "feat: implement dynamic pricing rules and stock synchronization engine"
```

---

### Task 4: Automated Upstream Fulfillment Pipeline

**Files:**
- Create: `src/services/upstream-fulfillment.service.ts`
- Modify: `src/services/payment.service.ts`
- Test: `tests/services/upstream-fulfillment.service.test.ts`

**Interfaces:**
- Consumes: `prisma`, `getSupplierAdapter`
- Produces:
  - `fulfillOrderViaUpstream(orderId: string): Promise<UpstreamFulfillmentResult>`
  - Integrates into `handleIncomingTransaction` when `order.status === PAID` and item has `API_DROPSHIP`

- [ ] **Step 1: Write failing tests for upstream fulfillment**
Test that when payment is received for an `API_DROPSHIP` product, `fulfillOrderViaUpstream` triggers the adapter, converts the upstream keys into `ProductItem: SOLD`, updates `order.upstreamStatus = COMPLETED`, and handles failure cases (`order.upstreamStatus = FAILED`) safely.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/upstream-fulfillment.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `upstream-fulfillment.service.ts` and hook into `payment.service.ts`**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/upstream-fulfillment.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/upstream-fulfillment.service.ts src/services/payment.service.ts tests/services/upstream-fulfillment.service.test.ts
git commit -m "feat: implement automated upstream order fulfillment pipeline"
```

---

### Task 5: White-Label Customer Status & Refund Request UI

**Files:**
- Create: `src/app/api/orders/[orderCode]/refund-request/route.ts`
- Modify: `src/components/CheckoutClient.tsx`
- Modify: `src/components/SecretDisplay.tsx`
- Test: `tests/ui/dropship-customer-flow.test.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces:
  - White-labeled customer progress banner ("Hệ thống đang cấp phát mã tự động...")
  - Self-service refund form on failure saving `refundInfo` on Order
  - `POST /api/orders/[orderCode]/refund-request`

- [ ] **Step 1: Write failing tests for refund request API and white-label text verification**
Verify API saves customer bank refund details, and verify no supplier names (Taphoammo, Trumthe) leak into client components.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/ui/dropship-customer-flow.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement refund request endpoint and update UI components**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/ui/dropship-customer-flow.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/api/orders/[orderCode]/refund-request/ src/components/ tests/ui/
git commit -m "feat: add white-labeled customer status and refund request flow"
```

---

### Task 6: Admin Supplier Management & Product Mapping Dashboard

**Files:**
- Create: `src/app/admin/suppliers/page.tsx`
- Create: `src/components/admin/SupplierManagerClient.tsx`
- Create: `src/app/api/admin/suppliers/route.ts`
- Create: `src/app/api/admin/suppliers/[id]/route.ts`
- Create: `src/app/api/admin/suppliers/sync/route.ts`
- Create: `src/app/api/admin/orders/[orderId]/retry-upstream/route.ts`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/components/admin/OrdersManagerClient.tsx`
- Test: `tests/services/admin-suppliers.test.ts`

**Interfaces:**
- Consumes: `prisma`, `pricing.service.ts`, `upstream-fulfillment.service.ts`
- Produces:
  - Admin management for suppliers (API balance check, mapping products with markup percentage)
  - 1-click supplier sync button
  - Upstream retry button for failed orders

- [ ] **Step 1: Write failing tests for supplier admin routes and upstream retry**

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/services/admin-suppliers.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Admin Suppliers page, client components, and API routes**

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/services/admin-suppliers.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/admin/suppliers/ src/components/admin/ src/app/api/admin/ tests/services/
git commit -m "feat: implement admin supplier management, mapping dashboard, and order retry"
```
