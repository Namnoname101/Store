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
