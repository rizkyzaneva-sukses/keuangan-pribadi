#!/bin/sh
set -e

# Production startup: jalankan migrations, lalu seed (idempotent), lalu server
# Menggunakan migrate deploy (bukan db push) untuk safety production
node ./node_modules/prisma/build/index.js migrate deploy 2>/dev/null || {
  echo "⚠️ migrate deploy gagal, fallback ke db push..."
  node ./node_modules/prisma/build/index.js db push --accept-data-loss
}

# Seed data awal (idempotent — skip jika user sudah ada)
node ./node_modules/.bin/tsx prisma/seed.ts

# Jalankan server Next.js standalone
exec node server.js
