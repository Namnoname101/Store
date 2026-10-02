# Task 6: Storefront UI (Homepage & Product Detail Page)

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/products/[slug]/page.tsx`
- Create: `src/components/Navbar.tsx`
- Create: `src/components/Footer.tsx`
- Create: `src/components/ProductCard.tsx`
- Create: `src/services/catalog.service.ts`
- Test: `tests/services/catalog.service.test.ts`

**Interfaces:**
- Consumes:
  - `prisma` from `@/lib/prisma`
  - `getAvailableStockCount` from `@/services/inventory.service`
- Produces:
  - `getCategoriesWithProducts(categorySlug?: string, search?: string)`: returns categories and products with live `stockCount`.
  - `getProductBySlug(slug: string)`: returns product details, category, and live `stockCount`.
  - Responsive Storefront UI:
    - Root layout with Navbar, modern gradients, Tailwind styling.
    - Homepage (`/`) with Hero section, category filters, search input, and responsive product grid.
    - Product cards with badges (Key / Tài khoản / Khóa học), VND price formatting, available stock tag (`Còn x hàng` or `Hết hàng`).
    - Product Detail page (`/products/[slug]`) with stock indicator, full description, quantity selector, email input, and "Mua ngay" button that calls `POST /api/orders` and navigates to `/checkout/[orderCode]`.

## Requirements:
1. `src/services/catalog.service.ts`:
   - `getCategoriesWithProducts`: queries categories, joins active products, and aggregates available stock count per product.
   - `getProductBySlug`: retrieves product by unique slug, including category and available stock.
2. Storefront Layout & Components:
   - Modern, professional e-commerce theme (dark/light clean aesthetic with Tailwind CSS and Lucide icons).
   - `Navbar`: Brand logo, navigation links, search bar, Admin link.
   - `ProductCard`: Thumbnail or styled icon placeholder, title, product type badge, formatted price in VND (`150.000 đ`), stock indicator with color badge (green if in stock, red if out of stock), "Xem chi tiết" / "Mua ngay".
   - `Product Detail Page`: Shows title, price, original price discount percentage, product type, live stock counter, customer email input field, "Mua ngay" button with loading state that calls `/api/orders` and redirects to `/checkout/[orderCode]`.
3. TDD:
   - Write tests in `tests/services/catalog.service.test.ts` verifying catalog querying, search filtering, category filtering, and accurate stock count computation.
   - Run tests and ensure all pass.
4. Commit: `feat: build responsive storefront UI and product catalog`.
