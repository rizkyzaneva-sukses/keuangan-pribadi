-- CreateTable
CREATE TABLE "TemplateOverride" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "investasiId" INTEGER NOT NULL,
    "posId" INTEGER NOT NULL,
    "persentase" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateOverride_investasiId_fkey" FOREIGN KEY ("investasiId") REFERENCES "Investasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateOverride_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosAlokasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TemplateOverride_investasiId_idx" ON "TemplateOverride"("investasiId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateOverride_investasiId_posId_key" ON "TemplateOverride"("investasiId", "posId");
