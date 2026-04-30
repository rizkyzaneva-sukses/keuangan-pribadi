-- AlterTable
ALTER TABLE "TemplateAlokasi" ADD COLUMN "archivedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AlokasiLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trxId" INTEGER,
    "devidenId" INTEGER,
    "imbalHasilDiterimaId" INTEGER,
    "posId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlokasiLog_trxId_fkey" FOREIGN KEY ("trxId") REFERENCES "TrxInvestasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlokasiLog_devidenId_fkey" FOREIGN KEY ("devidenId") REFERENCES "Deviden" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlokasiLog_imbalHasilDiterimaId_fkey" FOREIGN KEY ("imbalHasilDiterimaId") REFERENCES "ImbalHasilDiterima" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlokasiLog_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosAlokasi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AlokasiLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AlokasiLog" ("createdAt", "id", "nominal", "posId", "templateId", "trxId") SELECT "createdAt", "id", "nominal", "posId", "templateId", "trxId" FROM "AlokasiLog";
DROP TABLE "AlokasiLog";
ALTER TABLE "new_AlokasiLog" RENAME TO "AlokasiLog";
CREATE INDEX "AlokasiLog_trxId_idx" ON "AlokasiLog"("trxId");
CREATE INDEX "AlokasiLog_devidenId_idx" ON "AlokasiLog"("devidenId");
CREATE INDEX "AlokasiLog_imbalHasilDiterimaId_idx" ON "AlokasiLog"("imbalHasilDiterimaId");
CREATE INDEX "AlokasiLog_posId_idx" ON "AlokasiLog"("posId");
CREATE TABLE "new_Deviden" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "investasiTemanId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "tanggal" DATETIME NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sudahDialokasikan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deviden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deviden_investasiTemanId_fkey" FOREIGN KEY ("investasiTemanId") REFERENCES "InvestasiTeman" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deviden_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deviden" ("createdAt", "id", "investasiTemanId", "jumlah", "tanggal", "updatedAt", "userId") SELECT "createdAt", "id", "investasiTemanId", "jumlah", "tanggal", "updatedAt", "userId" FROM "Deviden";
DROP TABLE "Deviden";
ALTER TABLE "new_Deviden" RENAME TO "Deviden";
CREATE INDEX "Deviden_investasiTemanId_tanggal_idx" ON "Deviden"("investasiTemanId", "tanggal");
CREATE INDEX "Deviden_templateId_idx" ON "Deviden"("templateId");
CREATE TABLE "new_ImbalHasilDiterima" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "murobahahId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "tanggal" DATETIME NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sudahDialokasikan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImbalHasilDiterima_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImbalHasilDiterima_murobahahId_fkey" FOREIGN KEY ("murobahahId") REFERENCES "Murobahah" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImbalHasilDiterima_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ImbalHasilDiterima" ("createdAt", "id", "jumlah", "murobahahId", "tanggal", "updatedAt", "userId") SELECT "createdAt", "id", "jumlah", "murobahahId", "tanggal", "updatedAt", "userId" FROM "ImbalHasilDiterima";
DROP TABLE "ImbalHasilDiterima";
ALTER TABLE "new_ImbalHasilDiterima" RENAME TO "ImbalHasilDiterima";
CREATE INDEX "ImbalHasilDiterima_murobahahId_tanggal_idx" ON "ImbalHasilDiterima"("murobahahId", "tanggal");
CREATE INDEX "ImbalHasilDiterima_templateId_idx" ON "ImbalHasilDiterima"("templateId");
CREATE TABLE "new_InvestasiTeman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "namaTeman" TEXT NOT NULL,
    "modal" INTEGER NOT NULL,
    "tanggalMulai" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestasiTeman_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvestasiTeman_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InvestasiTeman" ("catatan", "createdAt", "id", "modal", "namaTeman", "status", "tanggalMulai", "updatedAt", "userId") SELECT "catatan", "createdAt", "id", "modal", "namaTeman", "status", "tanggalMulai", "updatedAt", "userId" FROM "InvestasiTeman";
DROP TABLE "InvestasiTeman";
ALTER TABLE "new_InvestasiTeman" RENAME TO "InvestasiTeman";
CREATE INDEX "InvestasiTeman_userId_status_idx" ON "InvestasiTeman"("userId", "status");
CREATE INDEX "InvestasiTeman_templateId_idx" ON "InvestasiTeman"("templateId");
CREATE TABLE "new_Murobahah" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "namaPartner" TEXT NOT NULL,
    "pokok" INTEGER NOT NULL,
    "totalImbalHasil" INTEGER NOT NULL,
    "tanggalMulai" DATETIME NOT NULL,
    "jatuhTempo" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Murobahah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Murobahah_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateAlokasi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Murobahah" ("catatan", "createdAt", "id", "jatuhTempo", "namaPartner", "pokok", "status", "tanggalMulai", "totalImbalHasil", "updatedAt", "userId") SELECT "catatan", "createdAt", "id", "jatuhTempo", "namaPartner", "pokok", "status", "tanggalMulai", "totalImbalHasil", "updatedAt", "userId" FROM "Murobahah";
DROP TABLE "Murobahah";
ALTER TABLE "new_Murobahah" RENAME TO "Murobahah";
CREATE INDEX "Murobahah_userId_status_idx" ON "Murobahah"("userId", "status");
CREATE INDEX "Murobahah_templateId_idx" ON "Murobahah"("templateId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TemplateAlokasi_userId_archivedAt_idx" ON "TemplateAlokasi"("userId", "archivedAt");
