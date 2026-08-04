-- CreateTable
CREATE TABLE "simpanan_hari_raya" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "periode" TEXT NOT NULL,
    "tanggalSetor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpanan_hari_raya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpanan_hari_raya_pencairan" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "totalDicairkan" DECIMAL(15,2) NOT NULL,
    "jumlahSetoran" INTEGER NOT NULL,
    "tanggalCair" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpanan_hari_raya_pencairan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simpanan_hari_raya_nasabahId_idx" ON "simpanan_hari_raya"("nasabahId");

-- CreateIndex
CREATE INDEX "simpanan_hari_raya_pencairan_nasabahId_idx" ON "simpanan_hari_raya_pencairan"("nasabahId");

-- AddForeignKey
ALTER TABLE "simpanan_hari_raya" ADD CONSTRAINT "simpanan_hari_raya_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_hari_raya" ADD CONSTRAINT "simpanan_hari_raya_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_hari_raya_pencairan" ADD CONSTRAINT "simpanan_hari_raya_pencairan_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_hari_raya_pencairan" ADD CONSTRAINT "simpanan_hari_raya_pencairan_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
