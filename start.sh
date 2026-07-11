#!/bin/sh
set -e

# Production startup
# Jalankan migrations (safe, tidak akan hapus data)
node ./node_modules/prisma/build/index.js migrate deploy || true

# Seed data awal (idempotent — skip jika user sudah ada)
node ./node_modules/.bin/tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped (file not found or error)"

# Jalankan server Next.js standalone
exec node server.js
