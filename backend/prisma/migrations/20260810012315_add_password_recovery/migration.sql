-- AlterTable
ALTER TABLE "nasabah" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passwordPlainEncrypted" TEXT;
