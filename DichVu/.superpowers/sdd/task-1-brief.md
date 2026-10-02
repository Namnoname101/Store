# Task 1: Project Scaffolding, Testing Framework & Prisma Database Schema

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts`
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `prisma: PrismaClient` export from `src/lib/prisma.ts`

## Requirements:
1. Initialize a modern Next.js 14+ / React 18+ / TypeScript setup in `e:\Du An\Web\DichVu`.
2. Configure Tailwind CSS and Lucide React.
3. Configure Vitest for unit & integration testing.
4. Set up Prisma ORM with SQLite provider (for fast local development and testing, easily switchable to PostgreSQL via `DATABASE_URL`).
5. Write the exact schema in `prisma/schema.prisma` as defined in `docs/superpowers/specs/2026-10-03-digital-store-design.md`:
   - Enums: `Role (USER, ADMIN)`, `ProductType (LICENSE_KEY, ACCOUNT, COURSE_LINK)`, `ItemStatus (AVAILABLE, RESERVED, SOLD)`, `OrderStatus (PENDING, PAID, CANCELLED, EXPIRED)`
   - Models: `User`, `Category`, `Product`, `ProductItem`, `Order`, `OrderItem`, `PaymentTransaction`
6. Create `src/lib/prisma.ts` initializing a singleton `PrismaClient`.
7. Write and run test `tests/db.test.ts` using Vitest to verify category and product creation.
8. Commit: `chore: setup Next.js project, Prisma schema and testing suite`.
