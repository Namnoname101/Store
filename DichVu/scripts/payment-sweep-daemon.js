// Standalone Daemon Script for Fly.io process group or background worker
// Usage: node scripts/payment-sweep-daemon.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SWEEP_INTERVAL_SECONDS = parseInt(process.env.SWEEP_INTERVAL_SECONDS || "60", 10);
const SUPPLIER_SYNC_INTERVAL_SECONDS = parseInt(
  process.env.SUPPLIER_SYNC_INTERVAL_SECONDS || "120",
  10
);
const CRON_SECRET = process.env.CRON_SECRET || "internal_sync_secret_token";
const APP_PORT = process.env.PORT || "3000";

async function triggerSupplierSync() {
  const url = `http://127.0.0.1:${APP_PORT}/api/cron/sync-suppliers`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-cron-secret": CRON_SECRET,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[SupplierSyncDaemon] Sync failed (HTTP ${res.status}):`, text);
      return;
    }
    const data = await res.json();
    if (data.ok) {
      console.log(
        `[SupplierSyncDaemon ${new Date().toISOString()}] Synced ${data.syncedCount}/${data.totalMappings} supplier mappings (${data.pausedCount} out of stock) in ${data.durationMs}ms.`
      );
      if (data.errors && data.errors.length > 0) {
        console.warn(`[SupplierSyncDaemon] Errors during sync:`, data.errors);
      }
    }
  } catch (err) {
    console.warn(`[SupplierSyncDaemon] Warning: could not connect to sync endpoint (${err.message}). Will retry.`);
  }
}

async function runSweepCycle() {
  const now = new Date();
  const startTime = Date.now();

  try {
    // 1. Mark expired active payment intents
    const expiredIntents = await prisma.paymentIntent.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // 2. Mark pending orders past expiration as EXPIRED
    const expiredOrders = await prisma.order.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // 3. Release unconfirmed inventory reservations
    const releasedStock = await prisma.productItem.updateMany({
      where: {
        status: "RESERVED",
        reservedUntil: { lt: now },
      },
      data: {
        status: "AVAILABLE",
        orderId: null,
        reservedUntil: null,
      },
    });

    const durationMs = Date.now() - startTime;
    if (expiredIntents.count > 0 || expiredOrders.count > 0 || releasedStock.count > 0) {
      console.log(
        `[PaymentSweepDaemon ${new Date().toISOString()}] Expired: ${expiredIntents.count} intents, ` +
        `${expiredOrders.count} orders. Released: ${releasedStock.count} stock items (${durationMs}ms)`
      );
    }
  } catch (error) {
    console.error("[PaymentSweepDaemon Error]:", error);
  }
}

async function main() {
  console.log(
    `[DaemonRunner] Starting background workers: Payment Sweep (every ${SWEEP_INTERVAL_SECONDS}s), Supplier Sync (every ${SUPPLIER_SYNC_INTERVAL_SECONDS}s)...`
  );
  
  // Initial sweep
  await runSweepCycle();

  // Periodic sweep loop
  setInterval(runSweepCycle, SWEEP_INTERVAL_SECONDS * 1000);

  // Initial supplier sync delayed by 10s to let Next.js boot
  setTimeout(triggerSupplierSync, 10000);

  // Periodic supplier sync loop
  setInterval(triggerSupplierSync, SUPPLIER_SYNC_INTERVAL_SECONDS * 1000);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[DaemonRunner] Received shutdown signal. Closing DB connection...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[DaemonRunner Fatal Error]:", err);
    process.exit(1);
  });
}

module.exports = { runSweepCycle };
