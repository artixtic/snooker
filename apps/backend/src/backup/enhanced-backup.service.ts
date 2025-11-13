import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient, Prisma } from '@prisma/client';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

interface SyncChange {
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  updatedAt: Date;
  source: 'MAIN' | 'BACKUP';
}

interface BackupStats {
  totalRecords: number;
  duration: number;
  size: number;
  tables: Record<string, number>;
}

@Injectable()
export class EnhancedBackupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EnhancedBackupService.name);
  private backupPrisma: PrismaClient | null = null;
  private isBackupEnabled = false;
  private isTwoWaySyncEnabled = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastBackupTime: Date | null = null;
  private backupRetentionDays = 30;
  private backupDirectory = './backups';
  private syncIntervalMs = 30000; // 30 seconds for two-way sync
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 5;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => WebSocketGateway))
    private wsGateway: WebSocketGateway,
  ) {}

  async onModuleInit() {
    // Check if backup service is enabled
    const enableBackupService = this.configService.get<string>('ENABLE_BACKUP_SERVICE', 'false');
    const isEnabled = enableBackupService === 'true' || enableBackupService === '1';
    
    if (!isEnabled) {
      this.logger.log('Backup service is disabled (ENABLE_BACKUP_SERVICE is not set to true)');
      return;
    }

    const backupDatabaseUrl = this.configService.get<string>('BACKUP_DATABASE_URL');
    
    if (!backupDatabaseUrl) {
      this.logger.warn('BACKUP_DATABASE_URL not configured. Backup service will be disabled.');
      return;
    }

    // Check if two-way sync is enabled
    const enableTwoWaySync = this.configService.get<string>('ENABLE_TWO_WAY_SYNC', 'true');
    this.isTwoWaySyncEnabled = enableTwoWaySync === 'true' || enableTwoWaySync === '1';

    try {
      // Create backup directory
      await this.ensureBackupDirectory();

      // Initialize backup Prisma client
      this.backupPrisma = new PrismaClient({
        datasources: {
          db: {
            url: backupDatabaseUrl,
          },
        },
      });

      await this.backupPrisma.$connect();
      this.isBackupEnabled = true;
      this.logger.log('✅ Backup database connected successfully');

      // Load configuration
      await this.loadConfiguration();

      // Initialize sync state tracking
      await this.initializeSyncState();

      // Start two-way sync if enabled
      if (this.isTwoWaySyncEnabled) {
        this.startTwoWaySync();
        this.logger.log('✅ Two-way sync enabled and started');
      }

      // Cleanup old backups
      await this.cleanupOldBackups();

      this.logger.log('✅ Enhanced backup service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize backup service:', error);
      this.isBackupEnabled = false;
    }
  }

  private async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDirectory, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create backup directory:', error);
    }
  }

  private async loadConfiguration() {
    try {
      // Load retention days
      const retention = await this.prisma.backupConfig.findUnique({
        where: { key: 'retention_days' },
      });
      if (retention) {
        this.backupRetentionDays = parseInt(retention.value, 10);
      }

      // Load sync interval
      const interval = await this.prisma.backupConfig.findUnique({
        where: { key: 'sync_interval_ms' },
      });
      if (interval) {
        this.syncIntervalMs = parseInt(interval.value, 10);
      }
    } catch (error) {
      this.logger.warn('Could not load backup configuration, using defaults');
    }
  }

  private async initializeSyncState() {
    // This will be called to ensure sync_state table exists and is ready
    // The table should already exist from migrations
  }

  private startTwoWaySync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.performTwoWaySync();
        this.consecutiveFailures = 0;
      } catch (error) {
        this.consecutiveFailures++;
        this.logger.error(`Two-way sync failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error);
        
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          this.logger.error('Max consecutive failures reached. Stopping two-way sync.');
          if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
          }
        }
      }
    }, this.syncIntervalMs);
  }

  /**
   * Full backup - runs every minute (configurable)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleFullBackup() {
    if (!this.isBackupEnabled || !this.backupPrisma) {
      return;
    }

    this.logger.log('🔄 Starting full database backup...');
    const startTime = Date.now();
    let backupHistoryId: string | null = null;

    try {
      // Create backup history record
      const history = await this.prisma.backupHistory.create({
        data: {
          backupType: 'FULL',
          status: 'IN_PROGRESS',
          recordCount: 0,
        },
      });
      backupHistoryId = history.id;

      const stats = await this.performFullBackup();
      this.lastBackupTime = new Date();

      // Update backup history
      await this.prisma.backupHistory.update({
        where: { id: backupHistoryId },
        data: {
          status: 'SUCCESS',
          recordCount: stats.totalRecords,
          duration: stats.duration,
          size: BigInt(stats.size),
        },
      });

      this.logger.log(`✅ Full backup completed: ${stats.totalRecords} records in ${stats.duration}ms`);
      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;
      this.logger.error('❌ Full backup failed:', error);

      if (backupHistoryId) {
        await this.prisma.backupHistory.update({
          where: { id: backupHistoryId },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.logger.error('Max consecutive failures reached. Backup service may need attention.');
        // Could send alert here
      }
    }
  }

  /**
   * Perform full backup with batch operations
   */
  private async performFullBackup(): Promise<BackupStats> {
    if (!this.backupPrisma) {
      throw new Error('Backup database not initialized');
    }

    const startTime = Date.now();
    const stats: BackupStats = {
      totalRecords: 0,
      duration: 0,
      size: 0,
      tables: {},
    };

    const batchSize = 1000; // Process in batches of 1000

    // Backup in order respecting foreign key constraints
    const tables = [
      { name: 'users', method: this.backupUsers.bind(this) },
      { name: 'games', method: this.backupGames.bind(this) },
      { name: 'products', method: this.backupProducts.bind(this) },
      { name: 'tables', method: this.backupTableSessions.bind(this) },
      { name: 'shifts', method: this.backupShifts.bind(this) },
      { name: 'inventory_movements', method: this.backupInventoryMovements.bind(this) },
      { name: 'expenses', method: this.backupExpenses.bind(this) },
      { name: 'bookings', method: this.backupBookings.bind(this) },
      { name: 'table_maintenance', method: this.backupTableMaintenance.bind(this) },
      { name: 'table_rate_rules', method: this.backupTableRateRules.bind(this) },
      { name: 'sales', method: this.backupSales.bind(this) },
      { name: 'sale_items', method: this.backupSaleItems.bind(this) },
      { name: 'kitchen_orders', method: this.backupKitchenOrders.bind(this) },
      { name: 'matches', method: this.backupMatches.bind(this) },
      { name: 'match_players', method: this.backupMatchPlayers.bind(this) },
      { name: 'tournaments', method: this.backupTournaments.bind(this) },
      { name: 'tournament_players', method: this.backupTournamentPlayers.bind(this) },
      { name: 'tournament_matches', method: this.backupTournamentMatches.bind(this) },
      { name: 'activity_logs', method: this.backupActivityLogs.bind(this) },
    ];

    for (const table of tables) {
      try {
        const count = await table.method(batchSize);
        stats.tables[table.name] = count;
        stats.totalRecords += count;
      } catch (error) {
        this.logger.error(`Failed to backup ${table.name}:`, error);
        throw error;
      }
    }

    stats.duration = Date.now() - startTime;
    return stats;
  }

  /**
   * Two-way sync - syncs changes from both databases
   */
  private async performTwoWaySync() {
    if (!this.isBackupEnabled || !this.backupPrisma) {
      return;
    }

    // Get changes from main database
    const mainChanges = await this.getChangesFromMain();
    
    // Get changes from backup database
    const backupChanges = await this.getChangesFromBackup();

    // Apply main changes to backup
    for (const change of mainChanges) {
      await this.applyChangeToBackup(change);
    }

    // Apply backup changes to main
    let hasBackupChanges = false;
    for (const change of backupChanges) {
      await this.applyChangeToMain(change);
      hasBackupChanges = true;
    }

    // If there were changes from backup, emit refresh event
    if (hasBackupChanges && this.wsGateway?.server) {
      this.wsGateway.server.emit('backup:sync:refresh-required', {
        message: 'Data synced from backup database',
        timestamp: new Date().toISOString(),
      });
    }

    // Update sync state
    await this.updateSyncState(mainChanges, backupChanges);
  }

  /**
   * Get changes from main database since last sync
   */
  private async getChangesFromMain(): Promise<SyncChange[]> {
    const changes: SyncChange[] = [];
    const lastSync = this.lastBackupTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24h ago

    // Get all tables and check for changes using sync_state table
    const tables = [
      { name: 'User', model: 'user' },
      { name: 'Product', model: 'product' },
      { name: 'Game', model: 'game' },
      { name: 'TableSession', model: 'tableSession' },
      { name: 'Sale', model: 'sale' },
      { name: 'Expense', model: 'expense' },
    ];
    
    for (const table of tables) {
      try {
        const records = await (this.prisma as any)[table.model].findMany({
          where: {
            updatedAt: {
              gte: lastSync,
            },
          },
        });

        for (const record of records) {
          changes.push({
            entity: table.name,
            entityId: record.id,
            action: 'UPDATE',
            data: record,
            updatedAt: record.updatedAt,
            source: 'MAIN',
          });
        }
      } catch (error) {
        this.logger.warn(`Could not get changes from main for ${table.name}:`, error);
      }
    }

    return changes;
  }

  /**
   * Get changes from backup database since last sync
   */
  private async getChangesFromBackup(): Promise<SyncChange[]> {
    if (!this.backupPrisma) return [];

    const changes: SyncChange[] = [];
    const lastSync = this.lastBackupTime || new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tables = [
      { name: 'User', model: 'user' },
      { name: 'Product', model: 'product' },
      { name: 'Game', model: 'game' },
      { name: 'TableSession', model: 'tableSession' },
      { name: 'Sale', model: 'sale' },
      { name: 'Expense', model: 'expense' },
    ];
    
    for (const table of tables) {
      try {
        const records = await (this.backupPrisma as any)[table.model].findMany({
          where: {
            updatedAt: {
              gte: lastSync,
            },
          },
        });

        for (const record of records) {
          changes.push({
            entity: table.name,
            entityId: record.id,
            action: 'UPDATE',
            data: record,
            updatedAt: record.updatedAt,
            source: 'BACKUP',
          });
        }
      } catch (error) {
        this.logger.warn(`Could not get changes from backup for ${table.name}:`, error);
      }
    }

    return changes;
  }

  /**
   * Apply change from main to backup
   */
  private async applyChangeToBackup(change: SyncChange) {
    if (!this.backupPrisma) return;

    try {
      const syncState = await this.prisma.syncState.findUnique({
        where: {
          entity_entityId: {
            entity: change.entity,
            entityId: change.entityId,
          },
        },
      });

      // Check for conflicts
      if (syncState && syncState.backupUpdatedAt > change.updatedAt) {
        // Conflict detected - backup is newer
        await this.handleConflict(change, syncState, 'BACKUP_NEWER');
        return;
      }

      // Apply change - handle JSON fields properly
      const model = (this.backupPrisma as any)[change.entity.toLowerCase()];
      if (!model) return;

      // Prepare data with proper JSON handling
      const dataToUpsert = this.prepareDataForUpsert(change.entity, change.data);

      await model.upsert({
        where: { id: change.entityId },
        update: dataToUpsert,
        create: dataToUpsert,
      });

      // Update sync state
      await this.prisma.syncState.upsert({
        where: {
          entity_entityId: {
            entity: change.entity,
            entityId: change.entityId,
          },
        },
        update: {
          mainUpdatedAt: change.updatedAt,
          lastSyncedAt: new Date(),
          syncDirection: 'MAIN_TO_BACKUP',
          conflict: false,
        },
        create: {
          entity: change.entity,
          entityId: change.entityId,
          mainUpdatedAt: change.updatedAt,
          backupUpdatedAt: change.updatedAt,
          lastSyncedAt: new Date(),
          syncDirection: 'MAIN_TO_BACKUP',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to apply change to backup:`, error);
    }
  }

  /**
   * Apply change from backup to main
   */
  private async applyChangeToMain(change: SyncChange) {
    try {
      const syncState = await this.prisma.syncState.findUnique({
        where: {
          entity_entityId: {
            entity: change.entity,
            entityId: change.entityId,
          },
        },
      });

      // Check for conflicts
      if (syncState && syncState.mainUpdatedAt > change.updatedAt) {
        // Conflict detected - main is newer
        await this.handleConflict(change, syncState, 'MAIN_NEWER');
        return;
      }

      // Apply change - handle JSON fields properly
      const model = (this.prisma as any)[change.entity.toLowerCase()];
      if (!model) return;

      // Prepare data with proper JSON handling
      const dataToUpsert = this.prepareDataForUpsert(change.entity, change.data);

      await model.upsert({
        where: { id: change.entityId },
        update: dataToUpsert,
        create: dataToUpsert,
      });

      // Update sync state
      await this.prisma.syncState.upsert({
        where: {
          entity_entityId: {
            entity: change.entity,
            entityId: change.entityId,
          },
        },
        update: {
          backupUpdatedAt: change.updatedAt,
          lastSyncedAt: new Date(),
          syncDirection: 'BACKUP_TO_MAIN',
          conflict: false,
        },
        create: {
          entity: change.entity,
          entityId: change.entityId,
          mainUpdatedAt: change.updatedAt,
          backupUpdatedAt: change.updatedAt,
          lastSyncedAt: new Date(),
          syncDirection: 'BACKUP_TO_MAIN',
        },
      });

      // Emit WebSocket event to trigger page refresh
      if (this.wsGateway?.server) {
        this.wsGateway.server.emit('backup:sync:backup-to-main', {
          entity: change.entity,
          entityId: change.entityId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to apply change to main:`, error);
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(change: SyncChange, syncState: any, conflictType: string) {
    await this.prisma.syncState.update({
      where: {
        entity_entityId: {
          entity: change.entity,
          entityId: change.entityId,
        },
      },
      data: {
        conflict: true,
        conflictData: {
          type: conflictType,
          mainData: syncState.mainUpdatedAt,
          backupData: change.updatedAt,
          change: change.data,
        },
      },
    });

    this.logger.warn(`Conflict detected for ${change.entity}:${change.entityId} - ${conflictType}`);
  }

  /**
   * Update sync state after sync
   */
  private async updateSyncState(mainChanges: SyncChange[], backupChanges: SyncChange[]) {
    // Sync state is updated in applyChangeToBackup and applyChangeToMain
    // This method can be used for additional post-sync operations
  }

  /**
   * Prepare data for upsert, handling JSON fields properly
   */
  private prepareDataForUpsert(entity: string, data: any): any {
    const prepared = { ...data };
    
    // Handle JSON fields based on entity type
    if (entity === 'KitchenOrder' && prepared.items !== undefined) {
      prepared.items = prepared.items === null ? Prisma.JsonNull : prepared.items;
    }
    if (entity === 'Match') {
      if (prepared.score !== undefined) {
        prepared.score = prepared.score === null ? Prisma.JsonNull : prepared.score;
      }
      if (prepared.metadata !== undefined) {
        prepared.metadata = prepared.metadata === null ? Prisma.JsonNull : prepared.metadata;
      }
    }
    if (entity === 'Tournament' && prepared.bracket !== undefined) {
      prepared.bracket = prepared.bracket === null ? Prisma.JsonNull : prepared.bracket;
    }
    if (entity === 'ActivityLog' && prepared.payload !== undefined) {
      prepared.payload = prepared.payload === null ? Prisma.JsonNull : prepared.payload;
    }
    
    return prepared;
  }

  // Batch backup methods (similar to original but with batching)
  private async backupUsers(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    
    const users = await this.prisma.user.findMany();
    if (users.length === 0) return 0;

    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE;');
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(
        batch.map((user) =>
          this.backupPrisma!.user.upsert({
            where: { id: user.id },
            update: { ...user, id: user.id },
            create: user,
          })
        )
      );
    }

    return users.length;
  }

  // Similar batch methods for other tables...
  // For brevity, I'll include a few key ones and note that others follow the same pattern

  private async backupGames(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const games = await this.prisma.game.findMany();
    if (games.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "games" CASCADE;');
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      await Promise.all(batch.map((game) => this.backupPrisma!.game.upsert({ where: { id: game.id }, update: { ...game, id: game.id }, create: game })));
    }
    return games.length;
  }

  private async backupProducts(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const products = await this.prisma.product.findMany();
    if (products.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "products" CASCADE;');
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await Promise.all(batch.map((product) => this.backupPrisma!.product.upsert({ where: { id: product.id }, update: { ...product, id: product.id }, create: product })));
    }
    return products.length;
  }

  // Continue with other backup methods following the same pattern...
  // I'll add the essential ones and note that the rest follow the same pattern

  private async backupTableSessions(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const tables = await this.prisma.tableSession.findMany();
    if (tables.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "tables" CASCADE;');
    for (let i = 0; i < tables.length; i += batchSize) {
      const batch = tables.slice(i, i + batchSize);
      await Promise.all(batch.map((table) => this.backupPrisma!.tableSession.upsert({ where: { id: table.id }, update: { ...table, id: table.id }, create: table })));
    }
    return tables.length;
  }

  private async backupShifts(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const shifts = await this.prisma.shift.findMany();
    if (shifts.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "shifts" CASCADE;');
    for (let i = 0; i < shifts.length; i += batchSize) {
      const batch = shifts.slice(i, i + batchSize);
      await Promise.all(batch.map((shift) => this.backupPrisma!.shift.upsert({ where: { id: shift.id }, update: { ...shift, id: shift.id }, create: shift })));
    }
    return shifts.length;
  }

  private async backupInventoryMovements(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const movements = await this.prisma.inventoryMovement.findMany();
    if (movements.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "inventory_movements" CASCADE;');
    for (let i = 0; i < movements.length; i += batchSize) {
      const batch = movements.slice(i, i + batchSize);
      await Promise.all(batch.map((movement) => this.backupPrisma!.inventoryMovement.upsert({ where: { id: movement.id }, update: { ...movement, id: movement.id }, create: movement })));
    }
    return movements.length;
  }

  private async backupExpenses(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const expenses = await this.prisma.expense.findMany();
    if (expenses.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "expenses" CASCADE;');
    for (let i = 0; i < expenses.length; i += batchSize) {
      const batch = expenses.slice(i, i + batchSize);
      await Promise.all(batch.map((expense) => this.backupPrisma!.expense.upsert({ where: { id: expense.id }, update: { ...expense, id: expense.id }, create: expense })));
    }
    return expenses.length;
  }

  private async backupBookings(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const bookings = await this.prisma.booking.findMany();
    if (bookings.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "bookings" CASCADE;');
    for (let i = 0; i < bookings.length; i += batchSize) {
      const batch = bookings.slice(i, i + batchSize);
      await Promise.all(batch.map((booking) => this.backupPrisma!.booking.upsert({ where: { id: booking.id }, update: { ...booking, id: booking.id }, create: booking })));
    }
    return bookings.length;
  }

  private async backupTableMaintenance(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const maintenance = await this.prisma.tableMaintenance.findMany();
    if (maintenance.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "table_maintenance" CASCADE;');
    for (let i = 0; i < maintenance.length; i += batchSize) {
      const batch = maintenance.slice(i, i + batchSize);
      await Promise.all(batch.map((record) => this.backupPrisma!.tableMaintenance.upsert({ where: { id: record.id }, update: { ...record, id: record.id }, create: record })));
    }
    return maintenance.length;
  }

  private async backupTableRateRules(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const rules = await this.prisma.tableRateRule.findMany();
    if (rules.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "table_rate_rules" CASCADE;');
    for (let i = 0; i < rules.length; i += batchSize) {
      const batch = rules.slice(i, i + batchSize);
      await Promise.all(batch.map((rule) => this.backupPrisma!.tableRateRule.upsert({ where: { id: rule.id }, update: { ...rule, id: rule.id }, create: rule })));
    }
    return rules.length;
  }

  private async backupSales(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const sales = await this.prisma.sale.findMany();
    if (sales.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "sales" CASCADE;');
    for (let i = 0; i < sales.length; i += batchSize) {
      const batch = sales.slice(i, i + batchSize);
      await Promise.all(batch.map((sale) => this.backupPrisma!.sale.upsert({ where: { id: sale.id }, update: { ...sale, id: sale.id }, create: sale })));
    }
    return sales.length;
  }

  private async backupSaleItems(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const saleItems = await this.prisma.saleItem.findMany();
    if (saleItems.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "sale_items" CASCADE;');
    for (let i = 0; i < saleItems.length; i += batchSize) {
      const batch = saleItems.slice(i, i + batchSize);
      await Promise.all(batch.map((item) => this.backupPrisma!.saleItem.upsert({ where: { id: item.id }, update: { ...item, id: item.id }, create: item })));
    }
    return saleItems.length;
  }

  private async backupKitchenOrders(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const orders = await this.prisma.kitchenOrder.findMany();
    if (orders.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "kitchen_orders" CASCADE;');
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      await Promise.all(batch.map((order) => {
        const { id, ...orderData } = order;
        return this.backupPrisma!.kitchenOrder.upsert({
          where: { id },
          update: {
            ...orderData,
            items: orderData.items === null ? Prisma.JsonNull : orderData.items,
          },
          create: {
            ...orderData,
            items: orderData.items === null ? Prisma.JsonNull : orderData.items,
          },
        });
      }));
    }
    return orders.length;
  }

  private async backupMatches(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const matches = await this.prisma.match.findMany();
    if (matches.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "matches" CASCADE;');
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      await Promise.all(batch.map((match) => {
        const { id, ...matchData } = match;
        return this.backupPrisma!.match.upsert({
          where: { id },
          update: {
            ...matchData,
            score: matchData.score === null ? Prisma.JsonNull : matchData.score,
            metadata: matchData.metadata === null ? Prisma.JsonNull : matchData.metadata,
          },
          create: {
            ...matchData,
            score: matchData.score === null ? Prisma.JsonNull : matchData.score,
            metadata: matchData.metadata === null ? Prisma.JsonNull : matchData.metadata,
          },
        });
      }));
    }
    return matches.length;
  }

  private async backupMatchPlayers(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const players = await this.prisma.matchPlayer.findMany();
    if (players.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "match_players" CASCADE;');
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      await Promise.all(batch.map((player) => this.backupPrisma!.matchPlayer.upsert({ where: { id: player.id }, update: { ...player, id: player.id }, create: player })));
    }
    return players.length;
  }

  private async backupTournaments(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const tournaments = await this.prisma.tournament.findMany();
    if (tournaments.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "tournaments" CASCADE;');
    for (let i = 0; i < tournaments.length; i += batchSize) {
      const batch = tournaments.slice(i, i + batchSize);
      await Promise.all(batch.map((tournament) => {
        const { id, ...tournamentData } = tournament;
        return this.backupPrisma!.tournament.upsert({
          where: { id },
          update: {
            ...tournamentData,
            bracket: tournamentData.bracket === null ? Prisma.JsonNull : tournamentData.bracket,
          },
          create: {
            ...tournamentData,
            bracket: tournamentData.bracket === null ? Prisma.JsonNull : tournamentData.bracket,
          },
        });
      }));
    }
    return tournaments.length;
  }

  private async backupTournamentPlayers(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const players = await this.prisma.tournamentPlayer.findMany();
    if (players.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "tournament_players" CASCADE;');
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      await Promise.all(batch.map((player) => this.backupPrisma!.tournamentPlayer.upsert({ where: { id: player.id }, update: { ...player, id: player.id }, create: player })));
    }
    return players.length;
  }

  private async backupTournamentMatches(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const matches = await this.prisma.tournamentMatch.findMany();
    if (matches.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "tournament_matches" CASCADE;');
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      await Promise.all(batch.map((match) => this.backupPrisma!.tournamentMatch.upsert({ where: { id: match.id }, update: { ...match, id: match.id }, create: match })));
    }
    return matches.length;
  }

  private async backupActivityLogs(batchSize: number): Promise<number> {
    if (!this.backupPrisma) return 0;
    const logs = await this.prisma.activityLog.findMany();
    if (logs.length === 0) return 0;
    await this.backupPrisma.$executeRawUnsafe('TRUNCATE TABLE "activity_logs" CASCADE;');
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      await Promise.all(batch.map((log) => {
        const { id, ...logData } = log;
        return this.backupPrisma!.activityLog.upsert({
          where: { id },
          update: {
            ...logData,
            payload: logData.payload === null ? Prisma.JsonNull : logData.payload,
          },
          create: {
            ...logData,
            payload: logData.payload === null ? Prisma.JsonNull : logData.payload,
          },
        });
      }));
    }
    return logs.length;
  }

  /**
   * Export backup to compressed file
   */
  async exportBackup(includeHistory = false): Promise<string> {
    if (!this.backupPrisma) {
      throw new Error('Backup database not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json.gz`;
    const filepath = path.join(this.backupDirectory, filename);

    this.logger.log(`📦 Exporting backup to ${filepath}...`);

    const backupData: any = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {},
    };

    // Export all tables
    const tableConfigs = [
      { name: 'users', getData: () => this.backupPrisma!.user.findMany() },
      { name: 'games', getData: () => this.backupPrisma!.game.findMany() },
      { name: 'products', getData: () => this.backupPrisma!.product.findMany() },
      { name: 'tables', getData: () => this.backupPrisma!.tableSession.findMany() },
      { name: 'shifts', getData: () => this.backupPrisma!.shift.findMany() },
      { name: 'sales', getData: () => this.backupPrisma!.sale.findMany() },
      { name: 'sale_items', getData: () => this.backupPrisma!.saleItem.findMany() },
      { name: 'expenses', getData: () => this.backupPrisma!.expense.findMany() },
      { name: 'bookings', getData: () => this.backupPrisma!.booking.findMany() },
      { name: 'matches', getData: () => this.backupPrisma!.match.findMany() },
      { name: 'tournaments', getData: () => this.backupPrisma!.tournament.findMany() },
    ];

    for (const table of tableConfigs) {
      try {
        const data = await table.getData();
        backupData.tables[table.name] = data;
      } catch (error) {
        this.logger.warn(`Could not export ${table.name}:`, error);
      }
    }

    // Include backup history if requested
    if (includeHistory) {
      backupData.history = await this.prisma.backupHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    // Compress and write to file
    const jsonData = JSON.stringify(backupData);
    const compressed = await gzip(Buffer.from(jsonData));
    await fs.writeFile(filepath, compressed);

    const stats = await fs.stat(filepath);
    this.logger.log(`✅ Backup exported: ${filepath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    return filepath;
  }

  /**
   * Restore from backup file
   */
  async restoreFromFile(filepath: string, target: 'MAIN' | 'BACKUP' = 'MAIN'): Promise<void> {
    this.logger.log(`🔄 Restoring from ${filepath} to ${target}...`);

    // Read and decompress file
    const compressed = await fs.readFile(filepath);
    const decompressed = await gunzip(compressed);
    const backupData = JSON.parse(decompressed.toString());

    const targetPrisma = target === 'MAIN' ? this.prisma : this.backupPrisma;
    if (!targetPrisma) {
      throw new Error('Target database not available');
    }

    // Restore tables in order
    const restoreOrder = [
      'users',
      'games',
      'products',
      'tables',
      'shifts',
      'sales',
      'sale_items',
      'expenses',
      'bookings',
      'matches',
      'tournaments',
    ];

    for (const tableName of restoreOrder) {
      if (backupData.tables[tableName]) {
        const model = (targetPrisma as any)[this.getModelName(tableName)];
        if (model) {
          // Clear existing data
          await (targetPrisma as any).$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
          
          // Restore data
          const records = backupData.tables[tableName];
          for (const record of records) {
            const preparedData = this.prepareDataForUpsert(this.getEntityNameFromTable(tableName), record);
            await model.upsert({
              where: { id: record.id },
              update: preparedData,
              create: preparedData,
            });
          }
        }
      }
    }

    this.logger.log(`✅ Restore completed to ${target}`);
  }

  private getModelName(tableName: string): string {
    const mapping: Record<string, string> = {
      users: 'user',
      games: 'game',
      products: 'product',
      tables: 'tableSession',
      shifts: 'shift',
      sales: 'sale',
      sale_items: 'saleItem',
      expenses: 'expense',
      bookings: 'booking',
      matches: 'match',
      tournaments: 'tournament',
    };
    return mapping[tableName] || tableName;
  }

  private getEntityNameFromTable(tableName: string): string {
    const mapping: Record<string, string> = {
      users: 'User',
      games: 'Game',
      products: 'Product',
      tables: 'TableSession',
      shifts: 'Shift',
      sales: 'Sale',
      sale_items: 'SaleItem',
      expenses: 'Expense',
      bookings: 'Booking',
      matches: 'Match',
      tournaments: 'Tournament',
      kitchen_orders: 'KitchenOrder',
      activity_logs: 'ActivityLog',
    };
    return mapping[tableName] || tableName;
  }

  /**
   * Cleanup old backups
   */
  private async cleanupOldBackups() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupRetentionDays);

      // Delete old backup files
      const files = await fs.readdir(this.backupDirectory);
      for (const file of files) {
        if (file.startsWith('backup-') && file.endsWith('.json.gz')) {
          const filepath = path.join(this.backupDirectory, file);
          const stats = await fs.stat(filepath);
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filepath);
            this.logger.log(`🗑️  Deleted old backup: ${file}`);
          }
        }
      }

      // Delete old backup history records
      await this.prisma.backupHistory.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
    } catch (error) {
      this.logger.warn('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Get backup status
   */
  getStatus() {
    return {
      enabled: this.isBackupEnabled,
      twoWaySyncEnabled: this.isTwoWaySyncEnabled,
      connected: this.backupPrisma !== null,
      lastBackup: this.lastBackupTime?.toISOString() || null,
      consecutiveFailures: this.consecutiveFailures,
      syncInterval: this.syncIntervalMs,
      retentionDays: this.backupRetentionDays,
    };
  }

  /**
   * Manually trigger backup
   */
  async triggerBackup(): Promise<void> {
    if (!this.isBackupEnabled || !this.backupPrisma) {
      throw new Error('Backup service is not enabled or not initialized');
    }

    this.logger.log('🔄 Manual backup triggered...');
    await this.performFullBackup();
    this.logger.log('✅ Manual backup completed');
  }

  /**
   * Get backup history
   */
  async getBackupHistory(limit = 50) {
    return this.prisma.backupHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get sync conflicts
   */
  async getSyncConflicts() {
    return this.prisma.syncState.findMany({
      where: { conflict: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(entity: string, entityId: string, resolution: 'MAIN' | 'BACKUP' | 'MERGE') {
    const syncState = await this.prisma.syncState.findUnique({
      where: {
        entity_entityId: {
          entity,
          entityId,
        },
      },
    });

    if (!syncState || !syncState.conflict) {
      throw new Error('No conflict found for this entity');
    }

    if (resolution === 'MAIN') {
      // Use main database version
      const mainData = await (this.prisma as any)[entity.toLowerCase()].findUnique({
        where: { id: entityId },
      });
      if (mainData && this.backupPrisma) {
        const preparedData = this.prepareDataForUpsert(entity, mainData);
        await (this.backupPrisma as any)[entity.toLowerCase()].upsert({
          where: { id: entityId },
          update: preparedData,
          create: preparedData,
        });
      }
    } else if (resolution === 'BACKUP') {
      // Use backup database version
      if (this.backupPrisma) {
        const backupData = await (this.backupPrisma as any)[entity.toLowerCase()].findUnique({
          where: { id: entityId },
        });
        if (backupData) {
          const preparedData = this.prepareDataForUpsert(entity, backupData);
          await (this.prisma as any)[entity.toLowerCase()].upsert({
            where: { id: entityId },
            update: preparedData,
            create: preparedData,
          });
        }
      }
    }
    // MERGE would require custom logic based on entity type

    // Clear conflict
    await this.prisma.syncState.update({
      where: {
        entity_entityId: {
          entity,
          entityId,
        },
      },
      data: {
        conflict: false,
        conflictData: Prisma.JsonNull,
        lastSyncedAt: new Date(),
      },
    });
  }

  async onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.backupPrisma) {
      await this.backupPrisma.$disconnect();
    }
  }
}

