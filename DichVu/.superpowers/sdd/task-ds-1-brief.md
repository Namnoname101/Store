# Task 1: Prisma Schema Extensions for Suppliers & Dropshipping Mappings

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Test: `tests/db-suppliers.test.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces:
  - Models: `Supplier`, `SupplierProductMapping`
  - Enums / types: `FulfillmentType`, `SupplierType`, `MarkupType`, `UpstreamStatus`
  - Relations on `Product` (`fulfillmentType`, `supplierMapping`)
  - Fields on `Order` (`upstreamStatus`, `upstreamOrderId`, `upstreamError`, `refundInfo`)

## Requirements:
1. Extend `prisma/schema.prisma`:
   - Add models `Supplier` and `SupplierProductMapping` matching the spec in `docs/superpowers/specs/2026-10-03-dropshipping-arbitrage-engine-design.md`.
   - SQLite enums in Prisma: remember that Prisma with SQLite uses strings for enums, so define them as string columns with default values, and define strict TypeScript type enums/consts in `src/lib/prisma.ts`.
   - On `Product`: add `fulfillmentType String @default("LOCAL_STOCK")`, relation `supplierMapping SupplierProductMapping?`.
   - On `Order`: add `upstreamStatus String @default("NOT_APPLICABLE")`, `upstreamOrderId String?`, `upstreamError String?`, `refundInfo String?`.
2. Update `src/lib/prisma.ts`:
   - Export typed constants & types: `FulfillmentType` (`LOCAL_STOCK`, `API_DROPSHIP`), `SupplierType` (`TAPHOAMMO`, `TRUMTHE`, `CUSTOM_REST`), `MarkupType` (`PERCENTAGE`, `FIXED_AMOUNT`), `UpstreamStatus` (`NOT_APPLICABLE`, `PENDING_UPSTREAM`, `COMPLETED`, `FAILED`, `REFUNDED`).
3. Run `npx prisma db push` to synchronize database schema.
4. TDD:
   - Write tests in `tests/db-suppliers.test.ts` verifying supplier creation, mapping creation, product relation with `API_DROPSHIP`, and order fields.
   - Run `npx vitest run tests/db-suppliers.test.ts` to ensure all tests pass.
5. Commit: `feat: add supplier and dropshipping mapping schema models`.
