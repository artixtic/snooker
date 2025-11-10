/*
  Warnings:

  - The values [MEMBER_DISCOUNT] on the enum `RateRuleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `memberId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `memberType` on the `table_rate_rules` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `tables` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `tournament_players` table. All the data in the column will be lost.
  - You are about to drop the `credit_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `members` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `playerId` on table `match_players` required. This step will fail if there are existing NULL values in that column.
  - Made the column `playerId` on table `tournament_players` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RateRuleType_new" AS ENUM ('TIME_BASED', 'DAY_BASED', 'PEAK_HOURS');
ALTER TABLE "table_rate_rules" ALTER COLUMN "ruleType" TYPE "RateRuleType_new" USING ("ruleType"::text::"RateRuleType_new");
ALTER TYPE "RateRuleType" RENAME TO "RateRuleType_old";
ALTER TYPE "RateRuleType_new" RENAME TO "RateRuleType";
DROP TYPE "RateRuleType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_memberId_fkey";

-- DropForeignKey
ALTER TABLE "credit_transactions" DROP CONSTRAINT "credit_transactions_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "credit_transactions" DROP CONSTRAINT "credit_transactions_memberId_fkey";

-- DropForeignKey
ALTER TABLE "credit_transactions" DROP CONSTRAINT "credit_transactions_saleId_fkey";

-- DropForeignKey
ALTER TABLE "match_players" DROP CONSTRAINT "match_players_memberId_fkey";

-- DropForeignKey
ALTER TABLE "match_players" DROP CONSTRAINT "match_players_playerId_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_memberId_fkey";

-- DropForeignKey
ALTER TABLE "tables" DROP CONSTRAINT "tables_memberId_fkey";

-- DropForeignKey
ALTER TABLE "tournament_players" DROP CONSTRAINT "tournament_players_memberId_fkey";

-- DropForeignKey
ALTER TABLE "tournament_players" DROP CONSTRAINT "tournament_players_playerId_fkey";

-- DropIndex
DROP INDEX "bookings_memberId_idx";

-- DropIndex
DROP INDEX "match_players_memberId_idx";

-- DropIndex
DROP INDEX "sales_memberId_idx";

-- DropIndex
DROP INDEX "tables_memberId_idx";

-- DropIndex
DROP INDEX "tournament_players_memberId_idx";

-- DropIndex
DROP INDEX "tournament_players_tournamentId_memberId_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "memberId";

-- AlterTable
ALTER TABLE "match_players" DROP COLUMN "memberId",
ALTER COLUMN "playerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "memberId";

-- AlterTable
ALTER TABLE "table_rate_rules" DROP COLUMN "memberType";

-- AlterTable
ALTER TABLE "tables" DROP COLUMN "memberId";

-- AlterTable
ALTER TABLE "tournament_players" DROP COLUMN "memberId",
ALTER COLUMN "playerId" SET NOT NULL;

-- DropTable
DROP TABLE "credit_transactions";

-- DropTable
DROP TABLE "members";

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
