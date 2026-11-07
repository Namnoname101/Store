# KhoDEE V2 — Deep Current State Audit (Architecture, Routes, Schema & UI/UX)

> **Document Version:** 2.0 (Milestone 1 Publication Deliverable)  
> **Target Path:** `docs/ux-redesign-v2/01-current-state-audit.md`  
> **Requirement Reference:** Requirement R1 (Deep Codebase & System Audit)  
> **Target Application:** KhoDEE V2 (formerly DaiTruongStore / MMO HUB)  
> **Audited Directory:** `e:\Code\Web_dich_vu\DichVu`  
> **Audit Date:** 2026-11-06  
> **Authors:** Teamwork Explorer & UX Architecture Specialists  

---

## 1. Executive Summary & Codebase Architecture

KhoDEE V2 is an automated Vietnamese digital product marketplace specializing in frontier AI developer keys (Anthropic Claude 5.5/5.6, OpenAI Codex/GPT-6, Google Gemini 4 Argon), software licenses (Canva Pro, Windows, CapCut Pro), educational subscriptions, and social media services.

The codebase is engineered with high operational resilience, featuring real-time bank payment reconciliation (VietQR / NAPAS 24/7), atomic warehouse stock reservation, upstream dropshipping adapters, and automated post-purchase secret delivery. However, the customer-facing interface suffers from design debt, inconsistent branding, hardcoded mock sales ticker data, and light-mode contrast deficiencies that must be modernized under KhoDEE V2.

### 1.1 Core Technology Stack & Runtime

| Layer | Technology | Version | Operational Function & Configuration |
|---|---|---|---|
| **Application Framework** | Next.js (App Router) | `14.2.15` | Hybrid SSR/SSG/Client components; `output: "standalone"` containerized deployment. |
| **UI Runtime** | React / React DOM | `18.3.1` | Concurrent mode enabled; strict separation between server and client boundaries. |
| **Language & Type System** | TypeScript | `5.6.3` | Strict mode enabled (`strict: true`), zero typecheck errors (`npx tsc --noEmit` exits `0`). |
| **Database & ORM** | SQLite + Prisma ORM | `5.20.0` | Mounted at `prisma/dev.db` in WAL mode (Write-Ahead Logging) with PRAGMA checkpointing. |
| **Styling Architecture** | Tailwind CSS | `3.4.14` | PostCSS `8.4.47`, Autoprefixer `10.4.20`, dark mode via `class` strategy. |
| **Iconography** | Lucide React | `^0.453.0` | SVG iconography across storefront, developer hub, and admin studio. |
| **Animations & Celebration**| Custom CSS + Canvas Confetti | `1.9.4` | Laser sweeps, smooth pop easing, and post-purchase confetti celebration. |
| **Automated Test Suite** | Vitest | `2.1.3` | 100 test files with 589 test cases covering migrations, idempotency, and auth. |
| **Hosting & Infrastructure** | Fly.io (Docker) | Node.js `v24.18.0` | Deployed to `sin` (Singapore region) with persistent volume mounted at `/data/dev.db`. |

---

## 2. Complete Inventory of Active Frontend Page Routes (33 Distinct Pages)

The application features **33 distinct page views** categorized into 6 operational zones:

### Zone 1: Storefront & Discovery (3 Pages)
| Route | Source File | Rendering Mode | Key Features & Business Purpose | Identified UX Issues & Redesign Focus |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Server Component (Dynamic) | Main consumer storefront: Hero banner, quick search pills, wallet bonus banner, category explorer, and live product catalog. | Competing visual CTAs in hero; hardcoded fake purchase ticker (`LiveOrderTicker.tsx`); fragile category scrollspy. |
| `/products/[slug]` | `src/app/products/[slug]/page.tsx` | Server Component (Dynamic) | Product detail page: variant specifications, delivery type, pricing, platform guide tabs, and sticky purchase box. | Purchase box is placed below long descriptions without sticky bottom bar on mobile viewports (<768px). |
| `/lookup` | `src/app/lookup/page.tsx` | Client Component (`"use client"`) | Public self-service order lookup tool: query orders using order code or email to retrieve delivered credentials. | Form feedback lacks progressive validation; error summaries lack accessible ARIA focus management. |

### Zone 2: Cart, Checkout & Post-Purchase Handover (4 Pages)
| Route | Source File | Rendering Mode | Key Features & Business Purpose | Identified UX Issues & Redesign Focus |
|---|---|---|---|---|
| `/cart` | `src/app/cart/page.tsx` | Client Component (`"use client"`) | Cart management: item selection, quantity adjustment, SMM target links, coupon validation, and order initialization. | Lacks 3-step visual progress indicator (`Giỏ hàng → Thanh toán → Nhận mã`); empty state lacks direct shopping shortcuts. |
| `/checkout/[orderCode]` | `src/app/checkout/[orderCode]/page.tsx` | Server + Client (`CheckoutClient`) | VietQR payment terminal: dynamic NAPAS QR, 10-minute countdown, laser sweep, bank credentials copy, and wallet pay option. | Information overload on mobile; absence of intermediate loading indicator during payment status polling. |
| `/order-success/[orderCode]` | `src/app/order-success/[orderCode]/page.tsx` | Server Component | Post-purchase handover: confetti celebration, delivered credentials/keys, 1-click copy, `.txt` download, and activation guide. | Unbroken long credential strings (`email\|pass\|cookie`) overflow screen boundaries on 360px viewports without word-break. |
| `/preview/guide` | `src/app/preview/guide/page.tsx` | Server / Client | Interactive handover demo preview showcasing secret delivery layout and platform setup guides. | Shares code with storefront but has slight styling drift from active checkout flow. |

### Zone 3: Customer Account & Wallet Operations (5 Pages)
| Route | Source File | Rendering Mode | Key Features & Business Purpose | Identified UX Issues & Redesign Focus |
|---|---|---|---|---|
| `/profile` | `src/app/profile/page.tsx` | Client (`ProfileClient`) | Customer portal: wallet balance overview, deposit stats, transaction history, and purchased orders list. | Uses divergent purple/cyan gradients diverging from the core blue/emerald brand tokens. |
| `/topup` | `src/app/topup/page.tsx` | Client (`TopupClient`) | Wallet topup configuration: predefined denomination cards (50k - 2M VND), bonus incentive pills (+3% / +5%). | Denomination cards have inconsistent hover states; bonus percentages lack visual distinction in dark mode. |
| `/topup/[depositCode]` | `src/app/topup/[depositCode]/page.tsx` | Client Component (`"use client"`) | Dedicated VietQR payment terminal for wallet deposits with real-time audio chime upon bank credit addition. | Needs alignment with the primary VietQR checkout component for consistent countdown and memo copy styling. |
| `/ctv` | `src/app/ctv/page.tsx` | Server / Client | Affiliate marketing landing page: commission policies, tiers (Newbie, Pro, Master), and registration flow. | Typography scale inconsistent with storefront; CTA button contrast needs AA verification in light mode. |
| `/dashboard/affiliate` | `src/app/dashboard/affiliate/page.tsx` | Client Component | Affiliate management dashboard: custom referral codes, commission tracking, and bank withdrawal requests. | Withdrawal request modal lacks clear form validation feedback on invalid account numbers. |

### Zone 4: Authentication (2 Pages)
| Route | Source File | Rendering Mode | Key Features & Business Purpose | Identified UX Issues & Redesign Focus |
|---|---|---|---|---|
| `/login` | `src/app/login/page.tsx` | Client Component | User login screen with redirect callback support (`callbackUrl`) and session cookie creation. | Error messages lack focus shift; password toggle button touch target is below $44\times 44$px. |
| `/register` | `src/app/register/page.tsx` | Client Component | User registration screen with validation and optional affiliate referral code binding. | Password strength meter missing; terms checkbox has small tap target on mobile. |

### Zone 5: Developer Zone & AI Engineering Tools (6 Pages)
| Route | Source File | Rendering Mode | Key Features & Business Purpose | Identified UX Issues & Redesign Focus |
|---|---|---|---|---|
| `/developer/usage` | `src/app/developer/usage/page.tsx` | Client (`UsageDashboardClient`) | Developer quota & telemetry dashboard: token usage meters, quota remaining, latency, and live request logs. | Request logs table lacks responsive card collapse on mobile viewports (<640px), forcing horizontal scroll. |
| `/codex` | `src/app/codex/page.tsx` | Client (`CodexTopupClient`) | Codex API storefront & topup: credit tier selection ($10 - $500), API key validation, and instant credit injection. | Package cards lack clear visual differentiation between New Key vs Topup Key modes. |
| `/check-usage` | `src/app/check-usage/page.tsx` | Client (`CheckUsageClient`) | Quick quota inspector for Claude & Cursor keys via upstream proxy. | Error state for blocked WAF IPs needs clearer explanation and direct link fallbacks. |
| `/huong-dan/api-claude` | `src/app/huong-dan/api-claude/page.tsx` | Client (`ClaudeApiGuideHub`) | Comprehensive Claude API setup guide: 5 platform tabs (Cursor, Claude Code CLI, Cline, Open Design, Python). | Code snippet boxes lack syntax highlighting theme syncing with global dark/light mode tokens. |
| `/huong-dan/codex` | `src/app/huong-dan/codex/page.tsx` | Client (`CodexApiGuideHub`) | Codex setup guide and 1-click helper app activation (`DaiTruong-helper.exe`). | Download card looks disconnected from web design system; needs modern bento styling. |
| `/tools/prompt-master` | `src/app/tools/prompt-master/page.tsx` | Client (`PromptMasterClient`) | Interactive Master Prompt Studio: multi-turn prompt engineering wizard powered by Google Gemini. | Multi-turn chat bubble styles drift from main storefront card styling; needs unified tokens. |

### Zone 6: Protected Admin Control Center (13 Pages)
| Route | Source File | Rendering Mode | Key Features & Business Purpose | Continuity Status |
|---|---|---|---|---|
| `/admin/login` | `src/app/admin/login/page.tsx` | Client Component | Admin session login with password authentication and HMAC-signed cookie generation. | **Preserve Intact** |
| `/admin` | `src/app/admin/page.tsx` | Server / Client | Admin control dashboard: 7-day revenue trend chart, real-time metrics, active orders, and system health status. | **Preserve Intact** |
| `/admin/products` | `src/app/admin/products/page.tsx` | Client (`ProductManagerClient`) | Product catalog manager: search, filter, stock overview, and toggle active status. | **Preserve Intact** |
| `/admin/products/[id]` | `src/app/admin/products/[id]/page.tsx` | Client (`AdminProductEditor`) | Product editor: title, slug, price, original price, fulfillment type, min/max quantity, and supplier mapping. | **Preserve Intact** |
| `/admin/inventory` | `src/app/admin/inventory/page.tsx` | Client (`InventoryImporterClient`) | Secret key inventory manager: bulk key importer, format detection, and warehouse stock inspection. | **Preserve Intact** |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | Client (`OrdersManagerClient`) | Order manager: manual approval, manual fulfillment override, and upstream retry trigger. | **Preserve Intact** |
| `/admin/reconciliation` | `src/app/admin/reconciliation/page.tsx` | Client (`ReconciliationManagerClient`) | Bank transaction reconciliation: unmatched deposits, underpaid orders, manual resolution, and refund processing. | **Preserve Intact** |
| `/admin/users` | `src/app/admin/users/page.tsx` | Client (`UsersManagerClient`) | User management: balance adjustment, role assignment, and deposit history. | **Preserve Intact** |
| `/admin/suppliers` | `src/app/admin/suppliers/page.tsx` | Client (`SupplierManagerClient`) | Supplier adapter manager: upstream balances, profit margins, and automated stock sync. | **Preserve Intact** |
| `/admin/coupons` | `src/app/admin/coupons/page.tsx` | Client (`CouponsManagerClient`) | Coupon engine: discount codes, usage limits, affiliate attribution, and expiry dates. | **Preserve Intact** |
| `/admin/locket-auto` | `src/app/admin/locket-auto/page.tsx` | Client (`LocketAutoClient`) | Auto Locket Gold daemon monitor: connection test, session cookie config, and execution logs. | **Preserve Intact** |
| `/admin/codex` | `src/app/admin/codex/page.tsx` | Client (`AdminCodexClient`) | Codex & ModelAPI synchronization monitor and snapshot audit. | **Preserve Intact** |
| `/admin/affiliates` | `src/app/admin/affiliates/page.tsx` | Client | Affiliate program manager: CTV withdrawals, commission verification, and approval queue. | **Preserve Intact** |

---

## 3. Complete Inventory of Active API Routes (61 Endpoints)

All API route handlers are located in `DichVu/src/app/api/` and operate under strict boundary rules:

### 3.1 Authentication & User Session (4 Endpoints)
1. `POST /api/auth/register`: Accepts `{ username, password, email? }`, validates PBKDF2 salt:hash, creates User, and issues 30-day `user_session` cookie.
2. `POST /api/auth/login`: Accepts `{ username, password }`, verifies PBKDF2 hash, issues `user_session` cookie.
3. `GET /api/auth/me`: Reads `user_session` cookie, returns `{ authenticated, user: { id, username, email, balance, totalDeposited } }`.
4. `POST /api/auth/logout`: Clears `user_session` cookie.

### 3.2 Storefront & Real-Time Validation (4 Endpoints)
5. `POST /api/cart/validate`: Validates client cart items against live DB prices and supplier availability. Returns authoritative `subtotalAmount` and item-level stock status.
6. `POST /api/coupons/validate`: Evaluates coupon code against cart total, enforcing minimum order thresholds and percentage discount caps.
7. `GET /api/products/[slug]/live-stock`: Real-time stock probe for single product page.
8. `POST /api/check-usage`: Proxy checker for legacy GenZShop upstream keys.

### 3.3 Orders & Checkout (7 Endpoints)
9. `POST /api/orders`: Rate-limited (30 req/min/IP). Accepts `{ items, customerEmail?, customerNote?, couponCode?, userId? }`. Performs atomic stock reservation, generates 10-minute `PaymentIntent`, and constructs VietQR image URL.
10. `POST /api/orders/lookup`: Public lookup by `orderCode` or customer email.
11. `GET /api/orders/[orderCode]/status`: Long-polling endpoint (120 req/min/IP). Requires `?token=[accessToken]` for guest orders or active user session. **Delivers secret credentials ONLY when status is `PAID`**.
12. `POST /api/orders/[orderCode]/regenerate-qr`: Refreshes an expired payment intent with a new 10-minute NAPAS VietQR code.
13. `POST /api/orders/[orderCode]/pay-with-wallet`: Atomically deducts customer balance (`balance: { gte: totalAmount }`) and fulfills order instantly without external banking.
14. `POST /api/orders/[orderCode]/refund-request`: Captures customer bank details for manual admin refund processing when overpayment or supplier failure occurs.
15. `GET /api/orders/[orderCode]/buff-progress`: Telemetry tracking for SMM follower/like completion.

### 3.4 Payment Webhooks & Financial Reconciliation (2 Endpoints)
16. `POST /api/webhooks/payment`: Primary webhook receiver for SePay / PayOS / VietQR. Enforces HMAC-SHA256 signature verification, secret tokens, and strict `transactionId` idempotency. Handles underpayment deltas and overpayment records.
17. `GET|POST /api/webhooks/sepay`: Re-export handler providing seamless compatibility for SePay gateway callbacks.

### 3.5 Wallet Operations (3 Endpoints)
18. `POST /api/wallet/deposit`: Accepts `{ amount }` (min 20,000 VND), generates 30-minute `DepositOrder` (`NAP...`) and VietQR transfer code.
19. `GET /api/wallet/deposit/[depositCode]/status`: Real-time deposit confirmation polling.
20. `GET /api/wallet/history`: Returns user's ledger transaction records.

### 3.6 Developer Zone & AI Studio (7 Endpoints)
21. `POST /api/codex/verify-key`: Validates upstream `sk-...` key on ModelAPI, creates/updates `CustomerApiKeyBinding`.
22. `POST /api/codex/checkout`: Initiates Codex credit purchase ($10 - $500), creates `CreditTopupOrder`.
23. `GET /api/codex/my-keys`: Retrieves authenticated user's bound developer API keys.
24. `GET /api/developer/usage`: Returns token balance, quota consumption, and credit status for given `apiKey`.
25. `GET /api/developer/logs`: Returns paginated model request logs for given `apiKey`.
26. `POST /api/tools/prompt-master/clarify`: Interactive prompt clarification engine powered by Google Gemini.
27. `POST /api/tools/prompt-master/generate`: Final optimized system prompt synthesis engine.

### 3.7 Affiliate / CTV Program (3 Endpoints)
28. `POST /api/affiliate/register`: Enrolls user in CTV program, generates referral code and 5% discount coupon.
29. `GET /api/affiliate`: Returns CTV performance metrics (orders, commission, tier).
30. `POST /api/affiliate/withdraw`: Submits bank withdrawal request (min 50,000 VND).

### 3.8 Background Cron Tasks (1 Endpoint)
31. `GET /api/cron/sync-suppliers`: Automated background pricing and inventory sync protected by `CRON_SECRET`.

### 3.9 Protected Admin Studio Endpoints (30 Endpoints)
32. `POST /api/admin/auth/login`: Admin password verification and session cookie generation.
33. `POST /api/admin/auth/logout`: Clears admin session.
34. `GET|POST /api/admin/products`: Lists products and creates new catalog items.
35. `PATCH|DELETE /api/admin/products/[id]`: Updates or deletes catalog items.
36. `POST /api/admin/products/cleanup-inactive`: Bulk cleanup tool for obsolete products.
37. `POST /api/admin/inventory/import`: Bulk secret key importer with format auto-detection.
38. `POST /api/admin/orders/[orderId]/manual-confirm`: Manually transitions order to `PAID`.
39. `POST /api/admin/orders/[orderId]/manual-fulfill`: Overrides warehouse stock to manually deliver keys.
40. `POST /api/admin/orders/[orderId]/retry-upstream`: Retries failed upstream supplier placement.
41. `GET /api/admin/reconciliation`: Retrieves unmatched deposits and discrepancy records.
42. `POST /api/admin/reconciliation/[id]/resolve`: Resolves bank discrepancies (`MATCH_AND_FULFILL`, `MARK_REFUNDED`, `DISMISS`).
43. `GET|POST /api/admin/suppliers`: Manages partner supplier adapters.
44. `GET|PATCH|DELETE /api/admin/suppliers/[id]`: Manages specific supplier config.
45. `GET /api/admin/suppliers/[id]/balance`: Live upstream supplier balance inquiry.
46. `POST /api/admin/suppliers/inspect-deposit`: Inspects supplier auto-deposit status.
47. `GET|POST /api/admin/suppliers/mappings`: Manages supplier product code and price markup mappings.
48. `POST /api/admin/suppliers/sync`: Triggers manual catalog synchronization.
49. `GET /api/admin/users`: Lists registered customers and wallet balances.
50. `POST /api/admin/users/[id]/adjust-balance`: Manual ledger adjustment for customer wallet.
51. `GET|POST /api/admin/coupons`: Creates and queries discount coupons.
52. `PATCH|DELETE /api/admin/coupons/[id]`: Updates or deactivates coupon codes.
53. `GET /api/admin/codex/bindings`: Audits developer key bindings.
54. `POST /api/admin/codex/reconcile`: Reconciles ModelAPI credit allocations.
55. `GET /api/admin/codex/snapshot`: Snapshot inquiry for total provider quota.
56. `GET|POST /api/admin/locket-auto/config`: Manages 24/7 Locket Gold automation config.
57. `GET /api/admin/locket-auto/logs`: Execution telemetry logs for Locket daemon.
58. `POST /api/admin/locket-auto/test-connection`: Diagnoses Locket session cookie validity.
59. `POST /api/admin/locket-auto/trigger-now`: Triggers instant Locket automation execution.
60. `GET /api/admin/affiliates`: CTV performance overview and withdrawal approval queue.
61. `POST /api/admin/affiliates/withdrawals/[id]`: Approves or rejects affiliate bank withdrawal.

---

## 4. Database Schema & 20 Models Architecture

The database is built on SQLite mounted at `DichVu/prisma/dev.db` with WAL mode enabled and managed through Prisma ORM (`prisma/schema.prisma`). All 20 models enforce relational referential integrity:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │──────<│    Order     │>──────│   OrderItem  │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                      │
       │                      ├──────< PaymentIntent │
       │                      ├──────< PaymentTrans  │
       │                      └──────< ProductItem   │
       │                                     ▲
       ├──────< WalletTrans                  │
       ├──────< DepositOrder          ┌──────────────┐
       ├──────< ApiKeyBinding         │   Product    │
       └──────< WithdrawalReq         └──────────────┘
                                             │
                                      ┌──────────────┐
                                      │ SupplierMap  │
                                      └──────────────┘
```

### Complete Model Catalog (20 Models)

| # | Model Name | Primary Key & Identifiers | Key Fields & Constraints | Purpose & Relational Role |
|---|---|---|---|---|
| 1 | **`User`** | `id` (UUID) | `username` (unique), `email` (unique), `passwordHash` (PBKDF2), `role` (`CUSTOMER`\|`ADMIN`), `balance` (VND $\ge 0$), `affiliateCode` (unique) | Core identity, customer balance ledger, and affiliate credentials. |
| 2 | **`Category`** | `id` (UUID) | `name`, `slug` (unique), `description` | Taxonomic classification for catalog products. |
| 3 | **`Product`** | `id` (UUID) | `title`, `slug` (unique), `price`, `originalPrice`, `type` (`LICENSE_KEY`\|`ACCOUNT`\|`COURSE_LINK`\|`CODEX_CREDIT`), `fulfillmentType` (`LOCAL_STOCK`\|`API_DROPSHIP`), `minQuantity`, `maxQuantity` | Authoritative catalog entity; source of truth for pricing. |
| 4 | **`ProductItem`** | `id` (UUID) | `productId`, `secretContent`, `status` (`AVAILABLE`\|`RESERVED`\|`SOLD`), `orderId`, `reservedUntil` | Warehouse secret credentials (keys, logins, activation links). |
| 5 | **`Order`** | `id` (UUID) | `orderCode` (unique, `ORD...`), `accessToken` (unique UUID), `idempotencyKey` (unique), `status` (`PENDING`\|`PAID`\|`CANCELLED`\|`EXPIRED`), `reconciliationStatus`, `upstreamStatus`, `refundInfo` (JSON) | Central commercial order record with guest authorization token. |
| 6 | **`PaymentIntent`** | `id` (UUID) | `orderId`, `intentCode` (unique), `qrUrl`, `amount`, `expiresAt` (10-minute validity), `status` (`ACTIVE`\|`EXPIRED`\|`PAID`\|`SUPERSEDED`) | Time-bounded VietQR payment session with refresh lifecycle. |
| 7 | **`PaymentTransaction`** | `id` (UUID) | `transactionId` (unique bank reference), `orderId`, `depositOrderId`, `amount`, `bankCode`, `rawPayload`, `reconciliationStatus` | Immutable bank statement transaction record for idempotency. |
| 8 | **`Coupon`** | `id` (UUID) | `code` (unique uppercase), `type` (`FIXED`\|`PERCENT`), `value`, `minOrderValue`, `maxDiscount`, `usageLimit`, `usedCount`, `expiresAt`, `isActive` | Promotional discount engine with affiliate attribution. |
| 9 | **`Supplier`** | `id` (UUID) | `code` (unique), `name`, `type` (`TAPHOAMMO`\|`TRUMTHE`\|`LOCKET_VN`\|`HACKTIM`\|`GENZSHOP`\|`TELEGRAM_BOT`\|`CUSTOM_REST`), `currentBalance` | Upstream fulfillment provider connection and credit balance. |
| 10 | **`SupplierProductMapping`** | `id` (UUID) | `productId` (unique), `supplierId`, `supplierProductCode`, `supplierPrice`, `supplierStock`, `markupType`, `markupValue` | Automated price synchronization and dropshipping routes. |
| 11 | **`OrderItem`** | `id` (UUID) | `orderId`, `productId`, `price`, `quantity`, `targetLink` (for SMM), `customerNote` | Individual line items preserved per order. |
| 12 | **`AuditLog`** | `id` (UUID) | `action`, `entityType`, `entityId`, `details`, `performedBy` | Administrative compliance audit trail for manual overrides. |
| 13 | **`DepositOrder`** | `id` (UUID) | `depositCode` (unique, `NAP...`), `userId`, `amount` ($\ge 20\text{k}$), `status` (`PENDING`\|`COMPLETED`\|`EXPIRED`), `expiresAt` (30m) | User wallet credit topup request. |
| 14 | **`WalletTransaction`** | `id` (UUID) | `userId`, `type` (`TOPUP`\|`ORDER_PAYMENT`\|`REFUND`\|`ADMIN_ADJUST`), `amount`, `balanceBefore`, `balanceAfter`, `referenceId` | Double-entry balance history guaranteeing ledger integrity. |
| 15 | **`CustomerApiKeyBinding`** | `id` (UUID) | `userId`, `guestEmail`, `upstreamTokenId` (unique), `keyFingerprint` (HMAC-SHA256 of `sk-...`), `maskedKey`, `totalCreditUsd` | Binds customer keys to upstream ModelAPI developer tokens. |
| 16 | **`CreditTopupOrder`** | `id` (UUID) | `orderId` (unique), `bindingId`, `creditUsd`, `quotaUnits`, `status` (`PENDING`\|`PROCESSING`\|`COMPLETED`\|`FAILED`) | Developer API quota injection order record. |
| 17 | **`CreditLedger`** | `id` (UUID) | `bindingId`, `topupOrderId`, `quotaBefore`, `quotaAddedExpected`, `quotaAfterReported`, `discrepancyDelta` | Verifiable audit log for API token credit delivery. |
| 18 | **`ModelApiSyncSnapshot`** | `id` (UUID) | `sourceQuotaTotal`, `sourceQuotaUsed`, `sourceBalanceUsd`, `status` | Provider snapshot monitoring total remaining quota. |
| 19 | **`WithdrawalRequest`** | `id` (UUID) | `withdrawalCode` (unique, `WTH...`), `userId`, `amount` ($\ge 50\text{k}$), `bankName`, `accountNumber`, `accountName`, `status` | Affiliate commission payout request queue. |
| 20 | **`LocketAutoConfig`** / **`Log`** | `id` (UUID) | `accountEmail`, `cookieSession`, `autoApprove`, `executionLogs` | Automated 24/7 background worker config for Locket Gold. |

---

## 5. UI/UX and Accessibility Audit (360px–1440px Viewports)

A comprehensive audit of the active user interface revealed critical usability and accessibility gaps that must be corrected during the redesign:

### 5.1 Global Navigation & Header Issues
- **Branding Fragmentation:** The desktop navbar displays `KhoDEE MMO HUB`, while the mobile menu footer and legacy links still refer to `DaiTruong Store`. All customer-facing copy must unify to `KhoDEE V2`.
- **Hardcoded Placeholder Counter:** In `Navbar.tsx:126`, a static badge reads `<span ...>124</span>`. The active product count in SQLite is actually 35 products. This violates the core acceptance criterion ("Zero unverified claims or placeholder cards").
- **Desktop Navigation Crowding (1024px–1280px):** On medium-width desktop viewports, the center links, search box, wallet pill, cart trigger, and auth avatar crowd together, forcing line wraps or overflow.
- **Mobile Drawer Architecture:** The mobile menu renders a dense 2-column grid of 10 items without visual hierarchy separating shopping catalog categories from developer guides and support links.

### 5.2 Storefront Hero & Value Proposition
- **Simulated Fake Purchases in `LiveOrderTicker.tsx`:** Lines 6-13 contain hardcoded mock purchase data (`INITIAL_TRANSACTIONS`). This creates a scammy, low-trust impression and strictly violates Acceptance Criteria. It must be replaced with an authentic platform status bar (e.g., VietQR 24/7 NAPAS operational status, 100% automated delivery, 1:1 replacement warranty).
- **Competing Calls-to-Action:** The hero section presents 5 competing CTAs (Status Pill, Search Box, Keyword Pills, Quota Banner, Wallet Bonus Banner), overwhelming the user prior to viewing the catalog.
- **Scrollspy Reliability:** `CatalogExplorer.tsx` computes category offsets using hardcoded pixel constants (`headerOffset = 130`). Scrolling or resizing on mobile causes category indicator desynchronization.

### 5.3 Product Commerce Cards
- **Mobile Clutter (360px–375px):** In a 2-column mobile layout, individual cards measure $\approx 160$px wide. Cramming a 16:10 thumbnail, 3 badges, 2-line title, tabular price, stock pill, and 2 CTA buttons into this space causes severe visual noise and truncated text.
- **Visual Style Inconsistency:**
  - Standalone cards (`ProductCard.tsx`) use bright blue buttons (`bg-blue-600`).
  - Grouped cards (`GroupedProductCard.tsx`) use monochrome styling (`bg-zinc-900 dark:bg-white`).
- **Touch Target Violations (<44px):** Quick-view icon buttons and tag dismiss triggers measure $36\times 36$px, violating WCAG 2.1 touch target requirements ($44\times 44$px).

### 5.4 Product Detail Page (`/products/[slug]`)
- **Missing Mobile Sticky Purchase Bar:** The purchase box sits below long descriptions and guides. Mobile users must scroll several viewports down before they can select variants or add to cart.
- **Hardcoded Specifications:** Guarantee and activation terms are hardcoded inside page components rather than rendered from structured metadata.
- **Disjointed Cart Feedback:** Clicking "Thêm vào giỏ" does not open the cart drawer or provide an immediate accessible toast notification.

### 5.5 Checkout & Post-Purchase Handover
- **Cognitive Overload on Checkout:** `CheckoutClient.tsx` displays the QR code, 10-minute timer, laser animation, full banking credentials, copy buttons, wallet payment toggle, and order summary in a dense layout that overwhelms mobile users.
- **Progressive Stepper Missing:** No visual step indicator (`1. Giỏ hàng → 2. Thanh toán → 3. Nhận hàng`) guides the user through the transaction.
- **Key Display Line Wrap:** Long credentials (`email|password|cookie|token`) exceed screen boundaries on 360px screens without `overflow-wrap: anywhere`.

### 5.6 Accessibility & Contrast Deficiencies (WCAG 2.1 AA)
- **Light Mode Badge Contrast Failures ($\le 3.8:1$):** `bg-blue-500/10 text-blue-600` and `bg-emerald-500/10 text-emerald-600` badges achieve only $\approx 3.8:1$ against white cards, failing the $4.5:1$ threshold for normal text.
- **Muted Text Failures:** `text-slate-400` on white cards (`#94a3b8` on `#ffffff`) yields a failing ratio of $2.8:1$.
- **Ad-Hoc Dark Hex Colors:** Instead of semantic CSS variables, components use inconsistent hardcoded hex values (`#0b0f19`, `#131926`, `#070b14`).
- **Missing `:focus-visible` Rings:** Interactive controls using `focus:outline-none` lack explicit visible focus rings, making keyboard navigation invisible.

---

## 6. Strict Inviolable Backend Boundaries (DO NOT TOUCH)

To safeguard payment processing, database integrity, and automated fulfillment, the following files and modules are strictly inviolable during the UX/UI redesign:

| System Boundary | Inviolable File Paths | Architectural Rationale & Risk of Modification |
|---|---|---|
| **Payment Verification & Webhooks** | `src/app/api/webhooks/payment/route.ts`<br>`src/app/api/webhooks/sepay/route.ts`<br>`src/services/payment.service.ts`<br>`src/services/payment-intent.service.ts`<br>`src/services/payment-sweep.worker.ts`<br>`scripts/payment-sweep-daemon.js`<br>`src/lib/vietqr.ts` | Processes live monetary transactions, PayOS checksum validation, secret webhook signatures, idempotency locks, underpayment/overpayment reconciliation, and automatic inventory delivery. Modification risks revenue loss or duplicate key delivery. |
| **Database Schema & Migrations** | `prisma/schema.prisma`<br>`src/lib/prisma.ts`<br>`scripts/db-backup-restore.ts`<br>`prisma/dev.db` (and all `.db-wal`, `.db-shm`) | Houses the production SQLite schema with 20 relational models. Modifying table or field names will cause runtime Prisma client exceptions and foreign key collisions. |
| **Fulfillment & Upstream Adapters** | `src/services/upstream-fulfillment.service.ts`<br>`src/services/inventory.service.ts`<br>`src/services/suppliers/*`<br>`src/services/codex-fulfillment.service.ts`<br>`src/services/modelapi/*` | Dispatches real upstream orders to third-party suppliers (TaphoaMMO, Trumthe, Hacktim, GenZShop, ModelAPI, Telegram Bot) with atomic stock locks. |
| **Financial Ledger & Wallet** | `src/services/wallet.service.ts`<br>`src/services/deposit.service.ts`<br>`src/services/affiliate.service.ts` | Manages real user balances, deposit orders, affiliate commissions, and withdrawal requests with transactional guarantees. |
| **Auth & Security Guards** | `src/middleware.ts`<br>`src/lib/admin-auth.ts`<br>`src/lib/user-auth.ts`<br>`src/lib/key-security.ts`<br>`src/lib/rate-limiter.ts` | Protects `/admin/*` routes with HMAC cookies, enforces PBKDF2 hashing, prevents IDOR key leaks via access tokens, and applies IP rate limiting. |
| **Production Credentials & Configs** | `.env`<br>`fly.toml`<br>`deploy.ps1`<br>`Dockerfile`<br>`docker-entrypoint.sh` | Production database connection strings, bank account credentials, secret keys, and deployment configurations. |

---

## 7. Synthesis & Phased Redesign Strategy

Based on these audit findings, the KhoDEE V2 redesign must proceed along a structured milestone path:

```
[M1: Foundation & Tokens]
 ├─ Add semantic CSS theme variables to globals.css & tailwind.config.ts
 ├─ Replace fake purchase ticker with verified platform status bar
 └─ Publish complete 01-audit and 03-design-system specs
       │
[M2: Storefront & Discovery]
 ├─ Build unified Header, Hero, and Category Navigator
 ├─ Group multi-tier variants into cohesive product cards
 └─ Add mobile sticky bottom checkout bar to /products/[slug]
       │
[M3: Purchase Flow & Handover]
 ├─ Implement 3-step checkout stepper and Cart drawer
 ├─ Polish VietQR payment screen (10m timer, refresh QR, copy memo)
 └─ Enhance post-purchase handover with 1-click copy & .TXT export
       │
[M4: Developer Zone & Account]
 ├─ Modernize /developer/usage telemetry with responsive tables
 └─ Unify customer profile and wallet topup flows
       │
[M5: Polish, QA Evidence & Demo]
 ├─ Verify WCAG 2.1 AA compliance across 360px–1440px viewports
 └─ Capture screenshot evidence in 05-qa-report.md and prepare handoff
```

This ensures complete visual and UX transformation while maintaining 100% stability across backend services and database operations.
