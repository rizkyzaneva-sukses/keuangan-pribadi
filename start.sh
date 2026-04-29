#!/bin/sh
set -e

# Pastikan provider di schema adalah postgresql (sudah diubah saat build)
# Gunakan db push karena migrate deploy butuh file migrasi spesifik Postgres
node ./node_modules/prisma/build/index.js db push --accept-data-loss

# Seed data awal (user default, kategori, template) — skip jika sudah ada
node ./node_modules/.bin/tsx prisma/seed.ts

# Jalankan server Next.js standalone
node server.js
