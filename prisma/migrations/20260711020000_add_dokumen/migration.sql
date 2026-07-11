-- CreateTable
CREATE TABLE "Dokumen" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tipe" TEXT NOT NULL,
    "refId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'LAINNYA',
    "filePath" TEXT NOT NULL,
    "originalName" TEXT,
    "mime" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dokumen_userId_tipe_refId_idx" ON "Dokumen"("userId", "tipe", "refId");

-- AddForeignKey
ALTER TABLE "Dokumen" ADD CONSTRAINT "Dokumen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
