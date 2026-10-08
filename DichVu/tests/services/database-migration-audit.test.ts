import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

describe("Task 6: Database Migration & Schema Verification Suite", () => {
  it("1. Column Nullability: Verifies Order.customerEmail is nullable in SQLite schema", async () => {
    // Introspect table info using PRAGMA table_info('Order')
    const tableInfo = (await prisma.$queryRawUnsafe(
      `PRAGMA table_info("Order");`
    )) as Array<{ cid: number; name: string; type: string; notnull: bigint | number; dflt_value: any; pk: number }>;

    const customerEmailCol = tableInfo.find((col) => col.name === "customerEmail");
    expect(customerEmailCol).toBeDefined();
    // notnull == 0 means nullable
    expect(Number(customerEmailCol?.notnull)).toBe(0);

    const accessTokenCol = tableInfo.find((col) => col.name === "accessToken");
    expect(accessTokenCol).toBeDefined();
    expect(Number(accessTokenCol?.notnull)).toBe(1);

    const idempotencyKeyCol = tableInfo.find((col) => col.name === "idempotencyKey");
    expect(idempotencyKeyCol).toBeDefined();
    expect(Number(idempotencyKeyCol?.notnull)).toBe(0);
  });

  it("2. Table Schemas: Verifies Phase 3B/3B.1 tables exist with expected schema", async () => {
    // PaymentIntent table
    const piInfo = (await prisma.$queryRawUnsafe(
      `PRAGMA table_info("PaymentIntent");`
    )) as Array<{ name: string; type: string }>;
    const piColNames = piInfo.map((c) => c.name);
    expect(piColNames).toContain("id");
    expect(piColNames).toContain("orderId");
    expect(piColNames).toContain("intentCode");
    expect(piColNames).toContain("qrUrl");
    expect(piColNames).toContain("amount");
    expect(piColNames).toContain("expiresAt");
    expect(piColNames).toContain("status");

    // PaymentTransaction table
    const txInfo = (await prisma.$queryRawUnsafe(
      `PRAGMA table_info("PaymentTransaction");`
    )) as Array<{ name: string }>;
    const txColNames = txInfo.map((c) => c.name);
    expect(txColNames).toContain("id");
    expect(txColNames).toContain("transactionId");
    expect(txColNames).toContain("amount");
    expect(txColNames).toContain("reconciliationStatus");
    expect(txColNames).toContain("refundStatus");
    expect(txColNames).toContain("refundProof");
    expect(txColNames).toContain("refundedAt");

    // AuditLog table
    const auditInfo = (await prisma.$queryRawUnsafe(
      `PRAGMA table_info("AuditLog");`
    )) as Array<{ name: string }>;
    const auditColNames = auditInfo.map((c) => c.name);
    expect(auditColNames).toContain("id");
    expect(auditColNames).toContain("action");
    expect(auditColNames).toContain("entityType");
    expect(auditColNames).toContain("entityId");
    expect(auditColNames).toContain("details");
    expect(auditColNames).toContain("performedBy");

    // OrderItem per-product fields
    const oiInfo = (await prisma.$queryRawUnsafe(
      `PRAGMA table_info("OrderItem");`
    )) as Array<{ name: string }>;
    const oiColNames = oiInfo.map((c) => c.name);
    expect(oiColNames).toContain("targetLink");
    expect(oiColNames).toContain("customerNote");
  });

  it("3. Foreign Key & Relational Integrity: Verifies 0 foreign key violations", async () => {
    const fkViolations = (await prisma.$queryRawUnsafe(
      `PRAGMA foreign_key_check;`
    )) as Array<any>;
    expect(fkViolations.length).toBe(0);
  });

  it("4. Historical Data Integrity: All historical orders remain valid and intact", async () => {
    // Ensure at least one order exists for verification
    let totalOrders = await prisma.order.count();
    let tempOrderId: string | null = null;
    if (totalOrders === 0) {
      const temp = await prisma.order.create({
        data: {
          orderCode: `ORD_HIST_${Date.now()}`,
          totalAmount: 50000,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      tempOrderId = temp.id;
      totalOrders = 1;
    }

    expect(totalOrders).toBeGreaterThan(0);

    const orders = await prisma.order.findMany({
      include: {
        orderItems: true,
        paymentIntents: true,
      },
    });

    for (const order of orders) {
      expect(order.orderCode).toMatch(/^ORD/);
      expect(order.totalAmount).toBeGreaterThan(0);
      expect(["PENDING", "PAID", "CANCELLED", "EXPIRED"]).toContain(order.status);
      expect(order.accessToken).toBeDefined();
      expect(order.accessToken.length).toBeGreaterThan(10);
    }

    if (tempOrderId) {
      await prisma.order.delete({ where: { id: tempOrderId } });
    }
  });

  it("5. Rollback Simulation on Cloned Database: Safe rollback preserves all order data", async () => {
    const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
    const clonePath = path.resolve(process.cwd(), "prisma/test_rollback_clone.db");

    // Copy current DB to isolated clone
    fs.copyFileSync(dbPath, clonePath);

    const clonePrisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${clonePath}`,
        },
      },
    });

    try {
      let originalTotalOrders = await clonePrisma.order.count();
      if (originalTotalOrders === 0) {
        await clonePrisma.order.create({
          data: {
            orderCode: `ORD_CLONE_TEST_${Date.now()}`,
            customerEmail: null,
            totalAmount: 50000,
            status: "PENDING",
            expiresAt: new Date(Date.now() + 600000),
          },
        });
        originalTotalOrders = 1;
      }
      expect(originalTotalOrders).toBeGreaterThan(0);

      // Verify nullable customerEmail before rollback
      const nullOrdersBefore = await clonePrisma.order.count({
        where: { customerEmail: null },
      });

      // Execute customer email rollback fallback update
      await clonePrisma.$executeRawUnsafe(
        `UPDATE "Order" SET "customerEmail" = 'guest@daitruong.store' WHERE "customerEmail" IS NULL;`
      );

      const nullOrdersAfter = await clonePrisma.order.count({
        where: { customerEmail: null },
      });
      expect(nullOrdersAfter).toBe(0);

      // Verify total orders unchanged after backfill
      const totalOrdersAfterBackfill = await clonePrisma.order.count();
      expect(totalOrdersAfterBackfill).toBe(originalTotalOrders);

      // Execute DROP COLUMN commands from rollback.sql
      await clonePrisma.$executeRawUnsafe(`ALTER TABLE "Order" DROP COLUMN "refundStatus";`);
      await clonePrisma.$executeRawUnsafe(`ALTER TABLE "Order" DROP COLUMN "refundProof";`);
      await clonePrisma.$executeRawUnsafe(`ALTER TABLE "Order" DROP COLUMN "refundedAt";`);

      // Verify orders table still fully accessible and row count unchanged
      const rawOrderCount = (await clonePrisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "Order";`
      )) as Array<{ count: bigint | number }>;
      expect(Number(rawOrderCount[0].count)).toBe(originalTotalOrders);

      // Verify remaining columns in Order
      const updatedTableInfo = (await clonePrisma.$queryRawUnsafe(
        `PRAGMA table_info("Order");`
      )) as Array<{ name: string }>;
      const columnNames = updatedTableInfo.map((c) => c.name);
      expect(columnNames).not.toContain("refundStatus");
      expect(columnNames).not.toContain("refundProof");
      expect(columnNames).not.toContain("refundedAt");
      expect(columnNames).toContain("orderCode");
      expect(columnNames).toContain("totalAmount");
      expect(columnNames).toContain("customerEmail");
    } finally {
      await clonePrisma.$disconnect();
      if (fs.existsSync(clonePath)) {
        try {
          fs.unlinkSync(clonePath);
        } catch {
          // ignore lock release delay on windows
        }
      }
    }
  });
});
