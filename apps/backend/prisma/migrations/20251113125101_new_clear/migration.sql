-- CreateTable
CREATE TABLE "backup_history" (
    "id" TEXT NOT NULL,
    "backupType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "size" BIGINT,
    "filePath" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_state" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "mainUpdatedAt" TIMESTAMP(3) NOT NULL,
    "backupUpdatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncDirection" TEXT,
    "conflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictData" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "backup_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backup_history_createdAt_idx" ON "backup_history"("createdAt");

-- CreateIndex
CREATE INDEX "backup_history_status_idx" ON "backup_history"("status");

-- CreateIndex
CREATE INDEX "sync_state_entity_idx" ON "sync_state"("entity");

-- CreateIndex
CREATE INDEX "sync_state_lastSyncedAt_idx" ON "sync_state"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "sync_state_conflict_idx" ON "sync_state"("conflict");

-- CreateIndex
CREATE UNIQUE INDEX "sync_state_entity_entityId_key" ON "sync_state"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "backup_config_key_key" ON "backup_config"("key");
