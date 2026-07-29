-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('staff', 'nasabah');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_accountId_idx" ON "sessions"("accountId");
