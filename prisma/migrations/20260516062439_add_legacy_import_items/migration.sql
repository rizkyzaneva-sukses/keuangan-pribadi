-- CreateTable
CREATE TABLE "LegacyImportItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" INTEGER,
    "title" TEXT,
    "subtitle" TEXT,
    "payloadJson" TEXT NOT NULL,
    "legacyCreatedAt" DATETIME,
    "legacyUpdatedAt" DATETIME,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LegacyImportItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LegacyImportItem_userId_section_idx" ON "LegacyImportItem"("userId", "section");

-- CreateIndex
CREATE INDEX "LegacyImportItem_userId_importedAt_idx" ON "LegacyImportItem"("userId", "importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyImportItem_userId_section_legacyId_key" ON "LegacyImportItem"("userId", "section", "legacyId");
