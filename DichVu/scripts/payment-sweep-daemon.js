// Standalone Daemon Script for Fly.io process group or background worker
// Usage: node scripts/payment-sweep-daemon.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SWEEP_INTERVAL_SECONDS = parseInt(process.env.SWEEP_INTERVAL_SECONDS || "60", 10);

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
  console.log(`[PaymentSweepDaemon] Starting background sweep worker (interval: ${SWEEP_INTERVAL_SECONDS}s)...`);
  
  // Initial run
  await runSweepCycle();

  // Periodic loop
  setInterval(runSweepCycle, SWEEP_INTERVAL_SECONDS * 1000);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[PaymentSweepDaemon] Received shutdown signal. Closing DB connection...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[PaymentSweepDaemon Fatal Error]:", err);
    process.exit(1);
  });
}

module.exports = { runSweepCycle };
