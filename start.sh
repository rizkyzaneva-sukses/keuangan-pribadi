#!/bin/sh
set -e

# Jalankan migrasi Prisma (akan otomatis apply ke DB SQLite atau Postgres sesuai setting)
npx prisma migrate deploy

# Jalankan server Next.js standalone
node server.js
