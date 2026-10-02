# SDD ledger — plan: docs/superpowers/plans/2026-10-03-digital-store.md

## Pre-flight Conflict Scan
| Tasks | Consumer / Producer Interface | Finding / Status |
|-------|-------------------------------|------------------|
| Task 1 & 2 | Prisma Client & Models | Clean: schema matches inventory service requirements |
| Task 2 & 4 | Inventory Reservation Service & Order Service | Clean: Order service consumes `reserveItemsForOrder` and `releaseExpiredReservations` |
| Task 3 & 4 | VietQR Utility & Order Service | Clean: Order details include VietQR generated URL |
| Task 2 & 5 | Inventory Commit & Payment Webhook | Clean: Webhook calls `commitReservedItemsToSold` on payment match |
| Task 4 & 7 | Order APIs & Checkout UI | Clean: UI polls `/api/orders/[orderCode]/status` |
| Task 2 & 8 | Inventory Models & Bulk Importer | Clean: Importer creates `ProductItem` records with status `AVAILABLE` |

All interfaces align with spec. Pre-flight clean. Ready for Task 1.

## Task Progress
- Task 1: complete (`ca68658dfebdef888b893a6eb7c832050f8e638b`) — Scaffolding, Prisma Schema & DB Tests verified and approved.
- Task 2: complete (`7f94063258f6086cc67d3bec8e7421d642d46f63`) — Inventory reservation, expiration release, sold commit & concurrency protection verified and approved.
- Task 3: complete (`05e764b`) — VietQR generation, memo parsing, and bank metadata verified and approved.
- Task 4: complete (`80eda4a6bec87c12a7d03211b1b85d23b78dced4`) — Order creation, VietQR binding, 15m expiration, and status API verified and approved.
- Task 5: complete (`10800df9d7d0f6f35543ecc62fdce78c36640b2c`) — Idempotent automated payment webhook handler (PayOS / SePay) verified and approved.
- Task 6: complete (`3eee31ccd8d9f78eeacf7cd096b39ac5626210f7`) — Storefront UI, product catalog, categories, search, and detail page verified and approved.
- Task 7: complete (`1a6127db9150431ca4eee76d2050788b6e7f4a32`) — Realtime VietQR checkout, 15m countdown, polling, and auto-delivery view verified and approved.
- Task 5: complete (`9e0f05c`) — Automated payment webhook handler (PayOS / SePay), idempotency guard, stock commit, and webhook API route verified.
