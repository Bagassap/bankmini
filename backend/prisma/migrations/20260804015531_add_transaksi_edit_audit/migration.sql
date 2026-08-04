/*
  Warnings:

  - Added the required column `updatedAt` to the `transaksi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaksi" ADD COLUMN     "editedById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Backfill existing rows: an untouched transaction's "last updated" time is
-- simply when it was created.
UPDATE "transaksi" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

ALTER TABLE "transaksi" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
