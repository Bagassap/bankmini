-- AlterEnum
ALTER TYPE "JenisNasabah" ADD VALUE 'kelas';

-- AlterTable
ALTER TABLE "nasabah" ADD COLUMN     "tahunAngkatan" TEXT;
