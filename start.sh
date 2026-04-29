#!/bin/sh
set -e

# Pastikan provider di schema adalah postgresql (sudah diubah saat build)
# Gunakan db push karena migrate deploy butuh file migrasi spesifik Postgres
node ./node_modules/prisma/build/index.js db push --accept-data-loss

# Jalankan server Next.js standalone
node server.js
