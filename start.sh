#!/bin/sh
set -e

# Production startup
# db push untuk sync schema (safe karena database sudah in sync)
# migrate deploy bisa dipakai nanti kalau sudah fully transition ke migrations
node ./node_modules/prisma/build/index.js db push --accept-data-loss 2>/dev/null || true

# Seed data awal (idempotent — skip jika user sudah ada)
node ./node_modules/.bin/tsx prisma/seed.ts

# Jalankan server Next.js standalone
exec node server.js
