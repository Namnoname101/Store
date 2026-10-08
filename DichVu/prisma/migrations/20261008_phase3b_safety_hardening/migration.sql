-- Migration: 20261008_phase3b_safety_hardening
-- Purpose: Add multi-stage refund auditing fields to Order and PaymentTransaction
-- Safety: Non-destructive, all added columns are NULLABLE, zero impact on existing records.

-- 1. Add refund auditing fields to "Order"
ALTER TABLE "Order" ADD COLUMN "refundStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "refundProof" TEXT;
ALTER TABLE "Order" ADD COLUMN "refundedAt" DATETIME;

-- 2. Add refund auditing fields to "PaymentTransaction"
ALTER TABLE "PaymentTransaction" ADD COLUMN "refundStatus" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN "refundProof" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN "refundedAt" DATETIME;
