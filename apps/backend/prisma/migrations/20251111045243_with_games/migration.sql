/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `games` will be added. If there are existing duplicate values, this will fail.
  - Made the column `gameId` on table `tables` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tables" DROP CONSTRAINT "tables_gameId_fkey";

-- AlterTable
ALTER TABLE "tables" ALTER COLUMN "gameId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "games_name_key" ON "games"("name");

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
