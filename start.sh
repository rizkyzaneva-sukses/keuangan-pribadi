#!/bin/sh
set -e

# Pastikan provider di schema adalah postgresql (sudah diubah saat build, tapi untuk berjaga-jaga)
sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma

# Gunakan db push karena migrate deploy butuh file migrasi spesifik Postgres
npx prisma db push --accept-data-loss

# Jalankan server Next.js standalone
node server.js
