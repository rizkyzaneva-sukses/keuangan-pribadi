Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ArahTransaksiInvestasi" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "KategoriTransaksiInvestasi" AS ENUM ('IN_DIVIDEND', 'IN_CAPITAL_RETURN', 'IN_CAPITAL_RETURN_PLUS_PROFIT', 'IN_OTHER', 'OUT_BUSINESS_CAPITAL', 'OUT_TOPUP_CAPITAL', 'OUT_OTHER');

-- CreateEnum
CREATE TYPE "StatusInvestasi" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TipeInvestasi" AS ENUM ('BISNIS', 'TEMAN', 'MUROBAHAH');

-- CreateEnum
CREATE TYPE "JenisKas" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "StatusInvestasiTeman" AS ENUM ('AKTIF', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusMurobahah" AS ENUM ('AKTIF', 'LUNAS');

-- CreateEnum
CREATE TYPE "SumberZakat" AS ENUM ('DEVIDEN', 'MUROBAHAH', 'BISNIS');

-- CreateEnum
CREATE TYPE "StatusZakat" AS ENUM ('BELUM', 'SEBAGIAN', 'SUDAH');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nama" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KategoriKas" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KategoriKas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kas" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kategoriId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jenis" "JenisKas" NOT NULL,
    "keterangan" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investasi" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "partner" TEXT,
    "tipe" "TipeInvestasi" NOT NULL,
    "status" "StatusInvestasi" NOT NULL DEFAULT 'ACTIVE',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrxInvestasi" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "investasiId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "arah" "ArahTransaksiInvestasi" NOT NULL,
    "kategori" "KategoriTransaksiInvestasi" NOT NULL,
    "principal" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "metodeBayar" TEXT,
    "akun" TEXT,
    "catatan" TEXT,
    "sudahDialokasikan" BOOLEAN NOT NULL DEFAULT false,
    "sudahDizakati" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrxInvestasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateAlokasi" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "catatan" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateAlokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosAlokasi" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "persentase" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosAlokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateAssignment" (
    "id" SERIAL NOT NULL,
    "investasiId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateOverride" (
    "id" SERIAL NOT NULL,
    "investasiId" INTEGER NOT NULL,
    "posId" INTEGER NOT NULL,
    "persentase" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletPos" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "posId" INTEGER NOT NULL,
    "saldoSaatIni" INTEGER NOT NULL DEFAULT 0,
    "totalMasuk" INTEGER NOT NULL DEFAULT 0,
    "totalKeluar" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletPos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlokasiLog" (
    "id" SERIAL NOT NULL,
    "trxId" INTEGER,
    "devidenId" INTEGER,
    "imbalHasilDiterimaId" INTEGER,
    "posId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlokasiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penarikan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "walletPosId" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "akun" TEXT,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penarikan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestasiTeman" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "namaTeman" TEXT NOT NULL,
    "modal" INTEGER NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "status" "StatusInvestasiTeman" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestasiTeman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deviden" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "investasiTemanId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sudahDialokasikan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deviden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Murobahah" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "namaPartner" TEXT NOT NULL,
    "pokok" INTEGER NOT NULL,
    "totalImbalHasil" INTEGER NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "jatuhTempo" TIMESTAMP(3) NOT NULL,
    "status" "StatusMurobahah" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Murobahah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImbalHasilDiterima" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "murobahahId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "pokokDiterima" INTEGER NOT NULL DEFAULT 0,
    "jumlah" INTEGER NOT NULL,
    "sudahDialokasikan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImbalHasilDiterima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestasiBisnis" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestasiBisnis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NilaiAktiva" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "investasiBisnisId" INTEGER NOT NULL,
    "tahunHaul" INTEGER NOT NULL,
    "nilai" INTEGER NOT NULL,
    "tanggalHaul" TIMESTAMP(3) NOT NULL,
    "sudahDizakati" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NilaiAktiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zakat" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sumber" "SumberZakat" NOT NULL,
    "status" "StatusZakat" NOT NULL DEFAULT 'BELUM',
    "tahun" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sudahDibayar" INTEGER NOT NULL DEFAULT 0,
    "tanggalWajib" TIMESTAMP(3) NOT NULL,
    "tanggalBayar" TIMESTAMP(3),
    "catatan" TEXT,
    "devidenId" INTEGER,
    "imbalHasilDiterimaId" INTEGER,
    "nilaiAktivaId" INTEGER,
    "trxInvestasiId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zakat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembayaranZakat" (
    "id" SERIAL NOT NULL,
    "zakatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PembayaranZakat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyImportItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" INTEGER,
    "title" TEXT,
    "subtitle" TEXT,
    "payloadJson" TEXT NOT NULL,
    "legacyCreatedAt" TIMESTAMP(3),
    "legacyUpdatedAt" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriKas_userId_nama_key" ON "KategoriKas"("userId", "nama");

-- CreateIndex
CREATE INDEX "Kas_userId_tanggal_idx" ON "Kas"("userId", "tanggal");

-- CreateIndex
CREATE INDEX "Kas_kategoriId_idx" ON "Kas"("kategoriId");

-- CreateIndex
CREATE INDEX "Investasi_userId_tipe_status_idx" ON "Investasi"("userId", "tipe", "status");

-- CreateIndex
CREATE INDEX "TrxInvestasi_investasiId_tanggal_idx" ON "TrxInvestasi"("investasiId", "tanggal");

-- CreateIndex
CREATE INDEX "TrxInvestasi_userId_tanggal_idx" ON "TrxInvestasi"("userId", "tanggal");

-- CreateIndex
CREATE INDEX "TemplateAlokasi_userId_isDefault_idx" ON "TemplateAlokasi"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "TemplateAlokasi_userId_archivedAt_idx" ON "TemplateAlokasi"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "PosAlokasi_templateId_idx" ON "PosAlokasi"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "PosAlokasi_templateId_nama_key" ON "PosAlokasi"("templateId", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateAssignment_investasiId_key" ON "TemplateAssignment"("investasiId");

-- CreateIndex
CREATE INDEX "TemplateOverride_investasiId_idx" ON "TemplateOverride"("investasiId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateOverride_investasiId_posId_key" ON "TemplateOverride"("investasiId", "posId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPos_posId_key" ON "WalletPos"("posId");

-- CreateIndex
CREATE INDEX "WalletPos_userId_idx" ON "WalletPos"("userId");

-- CreateIndex
CREATE INDEX "AlokasiLog_trxId_idx" ON "AlokasiLog"("trxId");

-- CreateIndex
CREATE INDEX "AlokasiLog_devidenId_idx" ON "AlokasiLog"("devidenId");

-- CreateIndex
CREATE INDEX "AlokasiLog_imbalHasilDiterimaId_idx" ON "AlokasiLog"("imbalHasilDiterimaId");

-- CreateIndex
CREATE INDEX "AlokasiLog_posId_idx" ON "AlokasiLog"("posId");

-- CreateIndex
CREATE INDEX "Penarikan_userId_tanggal_idx" ON "Penarikan"("userId", "tanggal");

-- CreateIndex
CREATE INDEX "InvestasiTeman_userId_status_idx" ON "InvestasiTeman"("userId", "status");

-- CreateIndex
CREATE INDEX "InvestasiTeman_templateId_idx" ON "InvestasiTeman"("templateId");

-- CreateIndex
CREATE INDEX "Deviden_investasiTemanId_tanggal_idx" ON "Deviden"("investasiTemanId", "tanggal");

-- CreateIndex
CREATE INDEX "Deviden_templateId_idx" ON "Deviden"("templateId");

-- CreateIndex
CREATE INDEX "Murobahah_userId_status_idx" ON "Murobahah"("userId", "status");

-- CreateIndex
CREATE INDEX "Murobahah_templateId_idx" ON "Murobahah"("templateId");

-- CreateIndex
CREATE INDEX "ImbalHasilDiterima_murobahahId_tanggal_idx" ON "ImbalHasilDiterima"("murobahahId", "tanggal");

-- CreateIndex
CREATE INDEX "ImbalHasilDiterima_templateId_idx" ON "ImbalHasilDiterima"("templateId");

-- CreateIndex
CREATE INDEX "InvestasiBisnis_userId_idx" ON "InvestasiBisnis"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NilaiAktiva_investasiBisnisId_tahunHaul_key" ON "NilaiAktiva"("investasiBisnisId", "tahunHaul");

-- CreateIndex
CREATE INDEX "Zakat_userId_status_tahun_idx" ON "Zakat"("userId", "status", "tahun");

-- CreateIndex
CREATE INDEX "PembayaranZakat_zakatId_idx" ON "PembayaranZakat"("zakatId");

-- CreateIndex
CREATE INDEX "PembayaranZakat_userId_tanggal_idx" ON "PembayaranZakat"("userId", "tanggal");

-- CreateIndex
CREATE INDEX "LegacyImportItem_userId_section_idx" ON "LegacyImportItem"("userId", "section");

-- CreateIndex
CREATE INDEX "LegacyImportItem_userId_importedAt_idx" ON "LegacyImportItem"("userId", "importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyImportItem_userId_section_legacyId_key" ON "LegacyImportItem"("userId", "section", "legacyId");

-- AddForeignKey
ALTER TABLE "KategoriKas" ADD CONSTRAINT "KategoriKas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kas" ADD CONSTRAINT "Kas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kas" ADD CONSTRAINT "Kas_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriKas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investasi" ADD CONSTRAINT "Investasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrxInvestasi" ADD CONSTRAINT "TrxInvestasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrxInvestasi" ADD CONSTRAINT "TrxInvestasi_investasiId_fkey" FOREIGN KEY ("investasiId") REFERENCES "Investasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAlokasi" ADD CONSTRAINT "TemplateAlokasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosAlokasi" ADD CONSTRAINT "PosAlokasi_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssignment" ADD CONSTRAINT "TemplateAssignment_investasiId_fkey" FOREIGN KEY ("investasiId") REFERENCES "Investasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssignment" ADD CONSTRAINT "TemplateAssignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateOverride" ADD CONSTRAINT "TemplateOverride_investasiId_fkey" FOREIGN KEY ("investasiId") REFERENCES "Investasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateOverride" ADD CONSTRAINT "TemplateOverride_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosAlokasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletPos" ADD CONSTRAINT "WalletPos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletPos" ADD CONSTRAINT "WalletPos_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosAlokasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlokasiLog" ADD CONSTRAINT "AlokasiLog_trxId_fkey" FOREIGN KEY ("trxId") REFERENCES "TrxInvestasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlokasiLog" ADD CONSTRAINT "AlokasiLog_devidenId_fkey" FOREIGN KEY ("devidenId") REFERENCES "Deviden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlokasiLog" ADD CONSTRAINT "AlokasiLog_imbalHasilDiterimaId_fkey" FOREIGN KEY ("imbalHasilDiterimaId") REFERENCES "ImbalHasilDiterima"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlokasiLog" ADD CONSTRAINT "AlokasiLog_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosAlokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlokasiLog" ADD CONSTRAINT "AlokasiLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penarikan" ADD CONSTRAINT "Penarikan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penarikan" ADD CONSTRAINT "Penarikan_walletPosId_fkey" FOREIGN KEY ("walletPosId") REFERENCES "WalletPos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestasiTeman" ADD CONSTRAINT "InvestasiTeman_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestasiTeman" ADD CONSTRAINT "InvestasiTeman_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deviden" ADD CONSTRAINT "Deviden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deviden" ADD CONSTRAINT "Deviden_investasiTemanId_fkey" FOREIGN KEY ("investasiTemanId") REFERENCES "InvestasiTeman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deviden" ADD CONSTRAINT "Deviden_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Murobahah" ADD CONSTRAINT "Murobahah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Murobahah" ADD CONSTRAINT "Murobahah_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImbalHasilDiterima" ADD CONSTRAINT "ImbalHasilDiterima_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImbalHasilDiterima" ADD CONSTRAINT "ImbalHasilDiterima_murobahahId_fkey" FOREIGN KEY ("murobahahId") REFERENCES "Murobahah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImbalHasilDiterima" ADD CONSTRAINT "ImbalHasilDiterima_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestasiBisnis" ADD CONSTRAINT "InvestasiBisnis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NilaiAktiva" ADD CONSTRAINT "NilaiAktiva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NilaiAktiva" ADD CONSTRAINT "NilaiAktiva_investasiBisnisId_fkey" FOREIGN KEY ("investasiBisnisId") REFERENCES "InvestasiBisnis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zakat" ADD CONSTRAINT "Zakat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zakat" ADD CONSTRAINT "Zakat_devidenId_fkey" FOREIGN KEY ("devidenId") REFERENCES "Deviden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zakat" ADD CONSTRAINT "Zakat_imbalHasilDiterimaId_fkey" FOREIGN KEY ("imbalHasilDiterimaId") REFERENCES "ImbalHasilDiterima"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zakat" ADD CONSTRAINT "Zakat_nilaiAktivaId_fkey" FOREIGN KEY ("nilaiAktivaId") REFERENCES "NilaiAktiva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zakat" ADD CONSTRAINT "Zakat_trxInvestasiId_fkey" FOREIGN KEY ("trxInvestasiId") REFERENCES "TrxInvestasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembayaranZakat" ADD CONSTRAINT "PembayaranZakat_zakatId_fkey" FOREIGN KEY ("zakatId") REFERENCES "Zakat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembayaranZakat" ADD CONSTRAINT "PembayaranZakat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyImportItem" ADD CONSTRAINT "LegacyImportItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

