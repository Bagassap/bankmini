-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'teller');

-- CreateEnum
CREATE TYPE "JenisNasabah" AS ENUM ('siswa', 'guru', 'umum');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusNasabah" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "JenisTransaksi" AS ENUM ('setor', 'tarik');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'teller',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasabah" (
    "id" TEXT NOT NULL,
    "noRekening" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenisNasabah" "JenisNasabah" NOT NULL,
    "nis" TEXT,
    "kelas" TEXT,
    "jurusan" TEXT,
    "nip" TEXT,
    "jabatan" TEXT,
    "alamat" TEXT,
    "noTelepon" TEXT,
    "jenisKelamin" "JenisKelamin",
    "tanggalLahir" TIMESTAMP(3),
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "StatusNasabah" NOT NULL DEFAULT 'aktif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL,
    "noTransaksi" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "jenisTransaksi" "JenisTransaksi" NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "saldoSebelum" DECIMAL(15,2) NOT NULL,
    "saldoSesudah" DECIMAL(15,2) NOT NULL,
    "keterangan" TEXT,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_noRekening_key" ON "nasabah"("noRekening");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_noTransaksi_key" ON "transaksi"("noTransaksi");

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
