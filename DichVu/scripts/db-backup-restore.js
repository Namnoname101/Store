/**
 * Database Backup, Restore, and Integrity Verification Tool for SQLite (Fly.io / Local)
 *
 * Usage:
 *   node scripts/db-backup-restore.js backup [destPath]
 *   node scripts/db-backup-restore.js restore <sourcePath> [destDbPath]
 *   node scripts/db-backup-restore.js verify [dbPath]
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function resolveDbPath(url) {
  if (!url) return path.resolve(__dirname, "../prisma/dev.db");
  const raw = url.replace(/^file:/, "");
  if (path.isAbsolute(raw)) return raw;
  if (raw.startsWith("./prisma/") || raw.startsWith("prisma/")) return path.resolve(process.cwd(), raw);
  if (fs.existsSync(path.resolve(process.cwd(), "prisma", raw))) {
    return path.resolve(process.cwd(), "prisma", raw);
  }
  return path.resolve(process.cwd(), raw);
}

const DEFAULT_DB_PATH = resolveDbPath(process.env.DATABASE_URL);

async function checkpointDb(prisma) {
  try {
    await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE);");
  } catch (err) {
    // If not in WAL mode, ignore
  }
}

async function backup(customDest) {
  const sourceDb = path.resolve(DEFAULT_DB_PATH);
  if (!fs.existsSync(sourceDb)) {
    throw new Error(`Source database does not exist: ${sourceDb}`);
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destPath = customDest ? path.resolve(customDest) : path.join(backupDir, `db_backup_${timestamp}.db`);

  const prisma = new PrismaClient({ datasources: { db: { url: `file:${sourceDb}` } } });
  try {
    console.log(`[Backup] Checkpointing WAL on ${sourceDb}...`);
    await checkpointDb(prisma);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`[Backup] Copying database to ${destPath}...`);
  fs.copyFileSync(sourceDb, destPath);
  const sizeBytes = fs.statSync(destPath).size;
  console.log(`[Backup] Successfully created backup (${sizeBytes} bytes) at ${destPath}`);
  return destPath;
}

async function restore(backupPath, customTarget) {
  const sourceBackup = path.resolve(backupPath);
  if (!fs.existsSync(sourceBackup)) {
    throw new Error(`Backup file does not exist: ${sourceBackup}`);
  }

  const targetDb = customTarget ? path.resolve(customTarget) : path.resolve(DEFAULT_DB_PATH);

  // Close any potential locks by using fresh Prisma instance after restore
  console.log(`[Restore] Restoring ${sourceBackup} -> ${targetDb}...`);
  const targetDir = path.dirname(targetDb);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(sourceBackup, targetDb);

  // Clean up stale wal/shm files if any
  const walPath = `${targetDb}-wal`;
  const shmPath = `${targetDb}-shm`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

  console.log(`[Restore] Successfully restored database to ${targetDb}.`);
  return targetDb;
}

async function verify(customDbPath) {
  const dbPath = customDbPath ? path.resolve(customDbPath) : path.resolve(DEFAULT_DB_PATH);
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database does not exist: ${dbPath}`);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });
  try {
    console.log(`[Verify] Checking database integrity on ${dbPath}...`);

    // 1. SQLite PRAGMAs
    const integrity = await prisma.$queryRawUnsafe("PRAGMA integrity_check;");
    const foreignKeys = await prisma.$queryRawUnsafe("PRAGMA foreign_key_check;");

    console.log(`[Verify] Integrity: ${JSON.stringify(integrity)}`);
    if (foreignKeys.length > 0) {
      console.warn(`[Verify] Warning: Found ${foreignKeys.length} foreign key issues:`, foreignKeys);
    } else {
      console.log(`[Verify] Foreign keys: 0 violations (PERFECT)`);
    }

    // 2. Count Records
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const itemCount = await prisma.productItem.count();
    const orderCount = await prisma.order.count();
    const txCount = await prisma.paymentTransaction.count();
    const piCount = await prisma.paymentIntent.count();
    const auditCount = await prisma.auditLog.count();

    // Check null email guest orders
    const guestNullEmailCount = await prisma.order.count({
      where: { customerEmail: null },
    });

    console.log(`[Verify] Record Summary:`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Products: ${productCount}`);
    console.log(`  - Product Items: ${itemCount}`);
    console.log(`  - Orders: ${orderCount} (Guest orders with null email: ${guestNullEmailCount})`);
    console.log(`  - Payment Transactions: ${txCount}`);
    console.log(`  - Payment Intents: ${piCount}`);
    console.log(`  - Audit Logs: ${auditCount}`);

    return {
      integrity,
      foreignKeyViolations: foreignKeys.length,
      counts: {
        users: userCount,
        products: productCount,
        items: itemCount,
        orders: orderCount,
        guestNullEmailOrders: guestNullEmailCount,
        transactions: txCount,
        paymentIntents: piCount,
        auditLogs: auditCount,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const action = process.argv[2] || "verify";
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  (async () => {
    if (action === "backup") {
      await backup(arg1);
    } else if (action === "restore") {
      if (!arg1) {
        console.error("Error: backupPath is required for restore command.");
        process.exit(1);
      }
      await restore(arg1, arg2);
      await verify(arg2 || DEFAULT_DB_PATH);
    } else if (action === "verify") {
      await verify(arg1);
    } else {
      console.log("Usage: node scripts/db-backup-restore.js [backup|restore|verify] [args...]");
    }
  })().catch((err) => {
    console.error("[Fatal Error]:", err);
    process.exit(1);
  });
}

module.exports = { backup, restore, verify };
