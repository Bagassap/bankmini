-- CreateTable
CREATE TABLE "piutang" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "pinjamanKe" INTEGER NOT NULL,
    "jumlahPinjaman" DECIMAL(15,2) NOT NULL,
    "jasaAnggota" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "provisiAdm" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "tanggalPinjam" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piutang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piutang_angsuran" (
    "id" TEXT NOT NULL,
    "piutangId" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piutang_angsuran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "piutang_nasabahId_idx" ON "piutang"("nasabahId");

-- CreateIndex
CREATE INDEX "piutang_angsuran_piutangId_idx" ON "piutang_angsuran"("piutangId");

-- AddForeignKey
ALTER TABLE "piutang" ADD CONSTRAINT "piutang_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piutang" ADD CONSTRAINT "piutang_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piutang_angsuran" ADD CONSTRAINT "piutang_angsuran_piutangId_fkey" FOREIGN KEY ("piutangId") REFERENCES "piutang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piutang_angsuran" ADD CONSTRAINT "piutang_angsuran_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
