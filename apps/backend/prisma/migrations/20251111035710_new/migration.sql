-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('PER_MINUTE', 'PER_HOUR');

-- AlterTable
ALTER TABLE "sales" ALTER COLUMN "tax" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "gameId" TEXT;

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rateType" "RateType" NOT NULL DEFAULT 'PER_MINUTE',
    "defaultRate" DECIMAL(10,2) NOT NULL DEFAULT 8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tables_gameId_idx" ON "tables"("gameId");

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
