-- AlterTable
ALTER TABLE "Investasi" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InvestasiTeman" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Murobahah" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Investasi_userId_archivedAt_idx" ON "Investasi"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "InvestasiTeman_userId_archivedAt_idx" ON "InvestasiTeman"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "Murobahah_userId_archivedAt_idx" ON "Murobahah"("userId", "archivedAt");
