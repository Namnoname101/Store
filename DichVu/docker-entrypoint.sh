#!/bin/sh
set -e

mkdir -p /data
if [ ! -f /data/dev.db ]; then
  if [ -f ./prisma/dev.db ]; then
    echo "Initializing database from prisma/dev.db..."
    cp ./prisma/dev.db /data/dev.db
  else
    touch /data/dev.db
  fi
fi

export DATABASE_URL="file:/data/dev.db"

echo "Applying Prisma schema..."
npx prisma db push --skip-generate || true

echo "Seeding HackTim products..."
node prisma/seed-hacktim.js || true

echo "Seeding Telegram Bot supplier..."
node prisma/seed-telegram.js || true

echo "Starting Next.js Server..."
exec node server.js
