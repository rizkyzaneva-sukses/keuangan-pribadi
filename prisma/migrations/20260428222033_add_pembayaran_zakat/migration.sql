-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KategoriKas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KategoriKas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "kategoriId" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "jenis" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kas_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriKas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Investasi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "partner" TEXT,
    "tipe" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrxInvestasi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "investasiId" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "arah" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "principal" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "metodeBayar" TEXT,
    "akun" TEXT,
    "catatan" TEXT,
    "sudahDialokasikan" BOOLEAN NOT NULL DEFAULT false,
    "sudahDizakati" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrxInvestasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrxInvestasi_investasiId_fkey" FOREIGN KEY ("investasiId") REFERENCES "Investasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateAlokasi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "catatan" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateAlokasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosAlokasi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "persentase" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PosAlokasi_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "investasiId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateAssignment_investasiId_fkey" FOREIGN KEY ("investasiId") REFERENCES "Investasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateAssignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WalletPos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "posId" INTEGER NOT NULL,
    "saldoSaatIni" INTEGER NOT NULL DEFAULT 0,
    "totalMasuk" INTEGER NOT NULL DEFAULT 0,
    "totalKeluar" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletPos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalletPos_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosAlokasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlokasiLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trxId" INTEGER NOT NULL,
    "posId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlokasiLog_trxId_fkey" FOREIGN KEY ("trxId") REFERENCES "TrxInvestasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlokasiLog_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosAlokasi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AlokasiLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Penarikan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "walletPosId" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "akun" TEXT,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Penarikan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Penarikan_walletPosId_fkey" FOREIGN KEY ("walletPosId") REFERENCES "WalletPos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestasiTeman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "namaTeman" TEXT NOT NULL,
    "modal" INTEGER NOT NULL,
    "tanggalMulai" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestasiTeman_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deviden" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "investasiTemanId" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deviden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deviden_investasiTemanId_fkey" FOREIGN KEY ("investasiTemanId") REFERENCES "InvestasiTeman" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Murobahah" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "namaPartner" TEXT NOT NULL,
    "pokok" INTEGER NOT NULL,
    "totalImbalHasil" INTEGER NOT NULL,
    "tanggalMulai" DATETIME NOT NULL,
    "jatuhTempo" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Murobahah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImbalHasilDiterima" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "murobahahId" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImbalHasilDiterima_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImbalHasilDiterima_murobahahId_fkey" FOREIGN KEY ("murobahahId") REFERENCES "Murobahah" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestasiBisnis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestasiBisnis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NilaiAktiva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "investasiBisnisId" INTEGER NOT NULL,
    "tahunHaul" INTEGER NOT NULL,
    "nilai" INTEGER NOT NULL,
    "tanggalHaul" DATETIME NOT NULL,
    "sudahDizakati" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NilaiAktiva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NilaiAktiva_investasiBisnisId_fkey" FOREIGN KEY ("investasiBisnisId") REFERENCES "InvestasiBisnis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Zakat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "sumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BELUM',
    "tahun" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sudahDibayar" INTEGER NOT NULL DEFAULT 0,
    "tanggalWajib" DATETIME NOT NULL,
    "tanggalBayar" DATETIME,
    "catatan" TEXT,
    "devidenId" INTEGER,
    "imbalHasilDiterimaId" INTEGER,
    "nilaiAktivaId" INTEGER,
    "trxInvestasiId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Zakat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Zakat_devidenId_fkey" FOREIGN KEY ("devidenId") REFERENCES "Deviden" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Zakat_imbalHasilDiterimaId_fkey" FOREIGN KEY ("imbalHasilDiterimaId") REFERENCES "ImbalHasilDiterima" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Zakat_nilaiAktivaId_fkey" FOREIGN KEY ("nilaiAktivaId") REFERENCES "NilaiAktiva" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Zakat_trxInvestasiId_fkey" FOREIGN KEY ("trxInvestasiId") REFERENCES "TrxInvestasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PembayaranZakat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "zakatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PembayaranZakat_zakatId_fkey" FOREIGN KEY ("zakatId") REFERENCES "Zakat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PembayaranZakat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "TemplateAlokasi_userId_isDefault_key" ON "TemplateAlokasi"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "PosAlokasi_templateId_idx" ON "PosAlokasi"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "PosAlokasi_templateId_nama_key" ON "PosAlokasi"("templateId", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateAssignment_investasiId_key" ON "TemplateAssignment"("investasiId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPos_posId_key" ON "WalletPos"("posId");

-- CreateIndex
CREATE INDEX "WalletPos_userId_idx" ON "WalletPos"("userId");

-- CreateIndex
CREATE INDEX "AlokasiLog_trxId_idx" ON "AlokasiLog"("trxId");

-- CreateIndex
CREATE INDEX "AlokasiLog_posId_idx" ON "AlokasiLog"("posId");

-- CreateIndex
CREATE INDEX "Penarikan_userId_tanggal_idx" ON "Penarikan"("userId", "tanggal");

-- CreateIndex
CREATE INDEX "InvestasiTeman_userId_status_idx" ON "InvestasiTeman"("userId", "status");

-- CreateIndex
CREATE INDEX "Deviden_investasiTemanId_tanggal_idx" ON "Deviden"("investasiTemanId", "tanggal");

-- CreateIndex
CREATE INDEX "Murobahah_userId_status_idx" ON "Murobahah"("userId", "status");

-- CreateIndex
CREATE INDEX "ImbalHasilDiterima_murobahahId_tanggal_idx" ON "ImbalHasilDiterima"("murobahahId", "tanggal");

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
