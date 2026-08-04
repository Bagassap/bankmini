-- CreateTable
CREATE TABLE "simpanan_hari_raya_anggota" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "terdaftarPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpanan_hari_raya_anggota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simpanan_hari_raya_anggota_nasabahId_idx" ON "simpanan_hari_raya_anggota"("nasabahId");

-- AddForeignKey
ALTER TABLE "simpanan_hari_raya_anggota" ADD CONSTRAINT "simpanan_hari_raya_anggota_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_hari_raya_anggota" ADD CONSTRAINT "simpanan_hari_raya_anggota_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
