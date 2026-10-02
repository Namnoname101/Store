# Task 8: Admin Dashboard & Bulk Key Inventory Importer

**Files:**
- Create: `src/services/bulk-import.service.ts`
- Create: `src/services/admin.service.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/products/page.tsx`
- Create: `src/app/admin/inventory/page.tsx`
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/api/admin/inventory/import/route.ts`
- Create: `src/app/api/admin/products/route.ts`
- Test: `tests/services/bulk-import.service.test.ts`
- Test: `tests/services/admin.service.test.ts`

**Interfaces:**
- Consumes:
  - `prisma` from `@/lib/prisma`
- Produces:
  - `parseBulkKeys(rawText: string): string[]`: splits by `\r?\n`, trims, rejects empty lines.
  - `importKeysForProduct(productId: string, rawText: string)`: creates `ProductItem` records with status `AVAILABLE`.
  - `getAdminOverviewStats()`: calculates total revenue, paid orders, pending orders, and products with low stock.
  - `getAllProductsAdmin()`: lists products with available, reserved, and sold item metrics.
  - `getAllOrdersAdmin(status?: string)`: lists all orders with customer info, payment transaction, and items.
  - API Routes:
    - `POST /api/admin/inventory/import`: imports keys into a product.
    - `POST /api/admin/products`: creates a new product and category.
  - Admin UI:
    - Dedicated Admin layout with sidebar navigation (`Tổng quan`, `Sản phẩm`, `Nhập kho`, `Đơn hàng`, `Quay lại cửa hàng`).
    - `/admin`: KPI cards (Doanh thu, Đơn thành công, Tồn kho cảnh báo) and recent transactions table.
    - `/admin/products`: Product listing with create product form (title, slug, price, category, product type).
    - `/admin/inventory`: Bulk importer with product dropdown, multi-line key textarea, "Nhập kho" button with live imported count feedback, and current stock status table.
    - `/admin/orders`: Order management table with search, status filters (PENDING, PAID, EXPIRED), customer email, paid timestamp, and delivered item keys preview.

## Requirements:
1. `bulk-import.service.ts`:
   - `parseBulkKeys(rawText: string)`: Handles dirty input (blank lines, trailing spaces, CRLF vs LF), extracts valid non-empty lines.
   - `importKeysForProduct(productId: string, rawText: string)`: Parses keys, ensures product exists, creates `ProductItem` records in batch via `createMany`, returns `{ count, keys }`.
2. `admin.service.ts`:
   - `getAdminOverviewStats()`: Aggregates total VND revenue from `PAID` orders, count of total vs paid orders, and products where `availableStock <= 5`.
   - `getAllProductsAdmin()`: Products with categories and stock breakdown (AVAILABLE, RESERVED, SOLD).
   - `getAllOrdersAdmin(filter?)`: Returns all orders with delivered keys and payment transactions.
3. Admin Pages & API routes:
   - Modern admin dashboard styling with dark theme, responsive navigation, clear metrics, and interactive forms with toast/banner feedback.
4. TDD & Build:
   - Tests in `tests/services/bulk-import.service.test.ts` and `tests/services/admin.service.test.ts`.
   - `npm run build` must compile all admin routes without errors.
5. Commit: `feat: implement admin dashboard and bulk inventory importer`.
