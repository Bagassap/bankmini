/*
  Warnings:

  - You are about to drop the column `jasaAnggota` on the `piutang` table. All the data in the column will be lost.
  - Added the required column `jenisPiutang` to the `piutang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nominalJasaFlat` to the `piutang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `persentaseAdm` to the `piutang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `persentaseJasa` to the `piutang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenor` to the `piutang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bulanKe` to the `piutang_angsuran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jenisPembayaran` to the `piutang_angsuran` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JenisPiutang" AS ENUM ('bulanan', 'berkala');

-- CreateEnum
CREATE TYPE "JenisPembayaranAngsuran" AS ENUM ('pokok_dan_jasa', 'jasa_saja', 'pelunasan');

-- AlterTable
ALTER TABLE "piutang" DROP COLUMN "jasaAnggota",
ADD COLUMN     "jenisPiutang" "JenisPiutang" NOT NULL,
ADD COLUMN     "nominalAngsuranPokokPerBulan" DECIMAL(15,2),
ADD COLUMN     "nominalJasaFlat" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "persentaseAdm" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "persentaseJasa" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "tenor" INTEGER NOT NULL,
ALTER COLUMN "provisiAdm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "piutang_angsuran" ADD COLUMN     "bulanKe" INTEGER NOT NULL,
ADD COLUMN     "jenisPembayaran" "JenisPembayaranAngsuran" NOT NULL;
