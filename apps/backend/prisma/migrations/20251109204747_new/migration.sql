-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'SUPPLIES', 'MAINTENANCE', 'SALARIES', 'MARKETING', 'OTHER');

-- CreateEnum
CREATE TYPE "RateRuleType" AS ENUM ('TIME_BASED', 'DAY_BASED', 'MEMBER_DISCOUNT', 'PEAK_HOURS');

-- CreateEnum
CREATE TYPE "KitchenOrderStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT';

-- AlterEnum
ALTER TYPE "TableStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "memberId" TEXT;

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "lastResumedAt" TIMESTAMP(3),
ADD COLUMN     "memberId" TEXT,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "totalPausedMs" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalMatches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberType" TEXT NOT NULL DEFAULT 'REGULAR',
    "discountPercent" DECIMAL(5,2) DEFAULT 0,
    "creditLimit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "saleId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "memberId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_maintenance" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cost" DECIMAL(10,2),
    "description" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_rate_rules" (
    "id" TEXT NOT NULL,
    "tableId" TEXT,
    "ruleType" "RateRuleType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "daysOfWeek" TEXT,
    "memberType" TEXT,
    "discountPercent" DECIMAL(5,2),
    "ratePerHour" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_rate_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_orders" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "status" "KitchenOrderStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB NOT NULL,
    "notes" TEXT,
    "estimatedTime" INTEGER,
    "startedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "gameType" TEXT NOT NULL DEFAULT 'snooker',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "score" JSONB,
    "metadata" JSONB,
    "saleId" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT,
    "memberId" TEXT,
    "seatNumber" INTEGER NOT NULL,
    "result" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "TournamentFormat" NOT NULL DEFAULT 'SINGLE_ELIMINATION',
    "bracket" JSONB,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxPlayers" INTEGER,
    "entryFee" DECIMAL(10,2),
    "prizePool" DECIMAL(10,2),
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_players" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT,
    "memberId" TEXT,
    "seed" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "bracketPosition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_memberNumber_key" ON "members"("memberNumber");

-- CreateIndex
CREATE INDEX "members_memberNumber_idx" ON "members"("memberNumber");

-- CreateIndex
CREATE INDEX "members_phone_idx" ON "members"("phone");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_isActive_idx" ON "members"("isActive");

-- CreateIndex
CREATE INDEX "credit_transactions_memberId_idx" ON "credit_transactions"("memberId");

-- CreateIndex
CREATE INDEX "credit_transactions_saleId_idx" ON "credit_transactions"("saleId");

-- CreateIndex
CREATE INDEX "credit_transactions_createdAt_idx" ON "credit_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "expenses_employeeId_idx" ON "expenses"("employeeId");

-- CreateIndex
CREATE INDEX "bookings_tableId_idx" ON "bookings"("tableId");

-- CreateIndex
CREATE INDEX "bookings_memberId_idx" ON "bookings"("memberId");

-- CreateIndex
CREATE INDEX "bookings_startTime_idx" ON "bookings"("startTime");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "table_maintenance_tableId_idx" ON "table_maintenance"("tableId");

-- CreateIndex
CREATE INDEX "table_maintenance_scheduledDate_idx" ON "table_maintenance"("scheduledDate");

-- CreateIndex
CREATE INDEX "table_maintenance_status_idx" ON "table_maintenance"("status");

-- CreateIndex
CREATE INDEX "table_rate_rules_tableId_idx" ON "table_rate_rules"("tableId");

-- CreateIndex
CREATE INDEX "table_rate_rules_ruleType_idx" ON "table_rate_rules"("ruleType");

-- CreateIndex
CREATE INDEX "table_rate_rules_isActive_idx" ON "table_rate_rules"("isActive");

-- CreateIndex
CREATE INDEX "table_rate_rules_priority_idx" ON "table_rate_rules"("priority");

-- CreateIndex
CREATE INDEX "kitchen_orders_saleId_idx" ON "kitchen_orders"("saleId");

-- CreateIndex
CREATE INDEX "kitchen_orders_status_idx" ON "kitchen_orders"("status");

-- CreateIndex
CREATE INDEX "kitchen_orders_createdAt_idx" ON "kitchen_orders"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "matches_saleId_key" ON "matches"("saleId");

-- CreateIndex
CREATE INDEX "matches_tableId_idx" ON "matches"("tableId");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_startTime_idx" ON "matches"("startTime");

-- CreateIndex
CREATE INDEX "matches_isPaid_idx" ON "matches"("isPaid");

-- CreateIndex
CREATE INDEX "match_players_matchId_idx" ON "match_players"("matchId");

-- CreateIndex
CREATE INDEX "match_players_playerId_idx" ON "match_players"("playerId");

-- CreateIndex
CREATE INDEX "match_players_memberId_idx" ON "match_players"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_matchId_seatNumber_key" ON "match_players"("matchId", "seatNumber");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournaments_startDate_idx" ON "tournaments"("startDate");

-- CreateIndex
CREATE INDEX "tournaments_createdById_idx" ON "tournaments"("createdById");

-- CreateIndex
CREATE INDEX "tournament_players_tournamentId_idx" ON "tournament_players"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_players_playerId_idx" ON "tournament_players"("playerId");

-- CreateIndex
CREATE INDEX "tournament_players_memberId_idx" ON "tournament_players"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_players_tournamentId_playerId_key" ON "tournament_players"("tournamentId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_players_tournamentId_memberId_key" ON "tournament_players"("tournamentId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_matches_matchId_key" ON "tournament_matches"("matchId");

-- CreateIndex
CREATE INDEX "tournament_matches_tournamentId_idx" ON "tournament_matches"("tournamentId");

-- CreateIndex
CREATE INDEX "sales_memberId_idx" ON "sales"("memberId");

-- CreateIndex
CREATE INDEX "tables_memberId_idx" ON "tables"("memberId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_maintenance" ADD CONSTRAINT "table_maintenance_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_maintenance" ADD CONSTRAINT "table_maintenance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
