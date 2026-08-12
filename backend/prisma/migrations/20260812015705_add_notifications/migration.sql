-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('staff_broadcast', 'nasabah');

-- AlterTable
ALTER TABLE "nasabah" ADD COLUMN     "lastNotificationReadAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastNotificationReadAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientType" "NotificationRecipientType" NOT NULL,
    "nasabahId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipientType_createdAt_idx" ON "notifications"("recipientType", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_nasabahId_createdAt_idx" ON "notifications"("nasabahId", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
