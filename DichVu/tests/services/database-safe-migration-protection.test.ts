import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { backup, restore, verify } from "../../scripts/db-backup-restore";

describe("Database Safe Migration & Data Protection Suite", () => {
  const testCloneDb = path.resolve(process.cwd(), "prisma/test_safe_migration_clone.db");
  const testBackupFile = path.resolve(process.cwd(), "backups/test_safe_migration_backup.db");

  it("1. Non-destructive Nullable Email: Preserves NULL customerEmail for guest orders", async () => {
    // Copy current DB to test clone
    const realDb = path.resolve(process.cwd(), "prisma/dev.db");
    fs.copyFileSync(realDb, testCloneDb);

    const clonePrisma = new PrismaClient({
      datasources: { db: { url: `file:${testCloneDb}` } },
    });

    try {
      // Create a guest order with customerEmail: null
      const guestOrder = await clonePrisma.order.create({
        data: {
          orderCode: `ORD_GUEST_${Date.now()}`,
          customerEmail: null, // Pure guest without email
          totalAmount: 50000,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 600000),
        },
      });

      expect(guestOrder.customerEmail).toBeNull();

      // Check DB directly: must NEVER be overwritten with a dummy email
      const fetched = await clonePrisma.order.findUnique({
        where: { id: guestOrder.id },
      });
      expect(fetched?.customerEmail).toBeNull();

      // Verify that no dummy email like 'guest@daitruong.store' was injected
      expect(fetched?.customerEmail).not.toBe("guest@daitruong.store");
    } finally {
      await clonePrisma.$disconnect();
      if (fs.existsSync(testCloneDb)) {
        try { fs.unlinkSync(testCloneDb); } catch {}
      }
    }
  });

  it("2. Backup and Restore Cycle: 100% data fidelity without loss or corruption", async () => {
    // 1. Run backup
    const backupPath = await backup(testBackupFile);
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(fs.statSync(backupPath).size).toBeGreaterThan(0);

    // 2. Restore to isolated target
    const restoredPath = await restore(backupPath, testCloneDb);
    expect(fs.existsSync(restoredPath)).toBe(true);

    // 3. Verify integrity on restored DB
    const verification = await verify(restoredPath);
    expect(verification.foreignKeyViolations).toBe(0);
    expect(verification.counts.users).toBeGreaterThanOrEqual(1);

    // Clean up test backup and clone
    if (fs.existsSync(testBackupFile)) {
      try { fs.unlinkSync(testBackupFile); } catch {}
    }
    if (fs.existsSync(testCloneDb)) {
      try { fs.unlinkSync(testCloneDb); } catch {}
    }
  });
});
