#!/bin/sh
set -e

mkdir -p /data
export DATABASE_URL="file:/data/dev.db"

# 1. Fresh Database Initialization Guard
if [ ! -f /data/dev.db ]; then
  echo "[Entrypoint] No existing database found at /data/dev.db. Initializing fresh volume..."
  if [ -f ./prisma/dev.db ]; then
    echo "[Entrypoint] Copying baseline schema from ./prisma/dev.db..."
    cp ./prisma/dev.db /data/dev.db
  else
    touch /data/dev.db
    echo "[Entrypoint] Applying initial Prisma schema..."
    npx prisma db push --skip-generate || true
  fi

  # Run initial seed once only if explicitly requested on first setup
  if [ "$INITIAL_SEED" = "true" ] && [ ! -f /data/.seeded ]; then
    echo "[Entrypoint] Running one-time initial catalog seeds..."
    node prisma/seed-hacktim.js || true
    node prisma/seed-telegram.js || true
    node prisma/seed-genzshop.js || true
    touch /data/.seeded
  fi
  touch /data/.initialized
else
  echo "[Entrypoint] Existing database detected at /data/dev.db (Size: $(wc -c < /data/dev.db) bytes). Preserving real data."
  # Never blindly re-seed or push schema on existing production database unless explicitly opted in
  if [ "$PRISMA_AUTO_MIGRATE" = "true" ]; then
    echo "[Entrypoint] PRISMA_AUTO_MIGRATE=true: applying schema updates..."
    npx prisma db push --skip-generate || true
  fi
fi

# 2. Process Management & Signal Trap
SWEEP_PID=""
NEXT_PID=""

cleanup() {
  echo "[Entrypoint] Received termination signal. Shutting down gracefully..."
  if [ -n "$SWEEP_PID" ]; then
    kill -TERM "$SWEEP_PID" 2>/dev/null || true
  fi
  if [ -n "$NEXT_PID" ]; then
    kill -TERM "$NEXT_PID" 2>/dev/null || true
  fi
  wait
  echo "[Entrypoint] All processes stopped. Exiting."
  exit 0
}

trap cleanup SIGTERM SIGINT

# 3. Start Payment Sweep Background Worker Daemon
if [ -f scripts/payment-sweep-daemon.js ]; then
  echo "[Entrypoint] Starting background Payment Sweep Daemon..."
  node scripts/payment-sweep-daemon.js &
  SWEEP_PID=$!
  echo "[Entrypoint] Payment Sweep Daemon started with PID $SWEEP_PID."
else
  echo "[Entrypoint] Warning: scripts/payment-sweep-daemon.js not found. Skipping daemon startup."
fi

# 4. Sync GenzShop Catalog
if [ -f prisma/seed-genzshop.js ]; then
  echo "[Entrypoint] Syncing GenzShop products & thumbnails..."
  node prisma/seed-genzshop.js || true
fi

# 5. Start Next.js Standalone Server
echo "[Entrypoint] Starting Next.js Production Server on port $PORT..."
node server.js &
NEXT_PID=$!
echo "[Entrypoint] Next.js server started with PID $NEXT_PID."

# Wait for Next.js to exit
wait "$NEXT_PID"
EXIT_CODE=$?

# Cleanup background daemon if Next.js stops
if [ -n "$SWEEP_PID" ]; then
  kill -TERM "$SWEEP_PID" 2>/dev/null || true
fi

exit $EXIT_CODE
