-- Rollback: 20261008_phase3b_safety_hardening
-- Purpose: Safely revert refund auditing fields from Order and PaymentTransaction
-- Safety: Preserves all historical order and transaction records; only removes newly introduced refund audit columns.

-- 1. Drop refund auditing fields from "Order" (SQLite 3.35.0+ / PostgreSQL)
ALTER TABLE "Order" DROP COLUMN "refundStatus";
ALTER TABLE "Order" DROP COLUMN "refundProof";
ALTER TABLE "Order" DROP COLUMN "refundedAt";

-- 2. Drop refund auditing fields from "PaymentTransaction"
ALTER TABLE "PaymentTransaction" DROP COLUMN "refundStatus";
ALTER TABLE "PaymentTransaction" DROP COLUMN "refundProof";
ALTER TABLE "PaymentTransaction" DROP COLUMN "refundedAt";

-- 3. If using Prisma schema synchronization:
--    a. Remove refundStatus, refundProof, refundedAt from Order and PaymentTransaction in prisma/schema.prisma
--    b. Run: npx prisma db push
