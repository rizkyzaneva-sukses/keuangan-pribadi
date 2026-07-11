-- CreateTable
CREATE TABLE "Dokumen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tipe" TEXT NOT NULL,
    "refId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'LAINNYA',
    "filePath" TEXT NOT NULL,
    "originalName" TEXT,
    "mime" TEXT,
    "size" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "Dokumen_userId_tipe_refId_idx" ON "Dokumen" ("userId", "tipe", "refId");
