-- CreateTable
CREATE TABLE "simpanan_pokok" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "tanggalSetor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpanan_pokok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpanan_wajib" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "periode" TEXT NOT NULL,
    "tanggalSetor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpanan_wajib_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simpanan_pokok_nasabahId_key" ON "simpanan_pokok"("nasabahId");

-- CreateIndex
CREATE INDEX "simpanan_wajib_nasabahId_idx" ON "simpanan_wajib"("nasabahId");

-- AddForeignKey
ALTER TABLE "simpanan_pokok" ADD CONSTRAINT "simpanan_pokok_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_pokok" ADD CONSTRAINT "simpanan_pokok_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_wajib" ADD CONSTRAINT "simpanan_wajib_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_wajib" ADD CONSTRAINT "simpanan_wajib_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
