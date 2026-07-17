-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "minute" INTEGER,
ADD COLUMN     "score" TEXT;

-- AlterTable
ALTER TABLE "Moment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "swing" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'next_goal',
    "choice" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openMinute" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pick_matchId_status_idx" ON "Pick"("matchId", "status");

-- CreateIndex
CREATE INDEX "Pick_userId_createdAt_idx" ON "Pick"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Moment_createdAt_idx" ON "Moment"("createdAt");

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
