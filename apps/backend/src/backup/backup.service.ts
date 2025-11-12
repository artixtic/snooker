import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private backupPrisma: PrismaClient | null = null;
  private isBackupEnabled = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Check if backup service is enabled via environment variable
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

    try {
      // Create a separate Prisma client for backup database
      this.backupPrisma = new PrismaClient({
        datasources: {
          db: {
            url: backupDatabaseUrl,
          },
        },
      });

      // Test connection
      await this.backupPrisma.$connect();
      this.isBackupEnabled = true;
      this.logger.log('✅ Backup database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to backup database:', error);
      this.isBackupEnabled = false;
    }
  }

  /**
   * Run backup every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleBackup() {
    if (!this.isBackupEnabled || !this.backupPrisma) {
      return;
    }

    this.logger.log('🔄 Starting database backup...');
    const startTime = Date.now();

    try {
      await this.performBackup();
      const duration = Date.now() - startTime;
      this.logger.log(`✅ Backup completed successfully in ${duration}ms`);
    } catch (error) {
      this.logger.error('❌ Backup failed:', error);
    }
  }

  /**
   * Perform the actual backup operation
   */
  private async performBackup() {
    if (!this.backupPrisma) {
      throw new Error('Backup database not initialized');
    }

    try {
      // Backup in order respecting foreign key constraints
      // Start with independent tables first
      await this.backupUsers();
      await this.backupGames();
      await this.backupProducts();
      await this.backupTableSessions();
      await this.backupShifts();
      await this.backupInventoryMovements();
      await this.backupExpenses();
      await this.backupBookings();
      await this.backupTableMaintenance();
      await this.backupTableRateRules();
      await this.backupSales();
      await this.backupSaleItems();
      await this.backupKitchenOrders();
      await this.backupMatches();
      await this.backupMatchPlayers();
      await this.backupTournaments();
      await this.backupTournamentPlayers();
      await this.backupTournamentMatches();
      await this.backupActivityLogs();
      await this.backupSyncLog();
    } catch (error) {
      this.logger.error('Backup operation failed:', error);
      throw error;
    }
  }

  /**
   * Backup Users
   */
  private async backupUsers() {
    const users = await this.prisma.user.findMany();
    if (users.length === 0) return;

    // Clear and insert
    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE;');
    for (const user of users) {
      await this.backupPrisma!.user.upsert({
        where: { id: user.id },
        update: {
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          deleted: user.deleted,
          wins: user.wins,
          losses: user.losses,
          totalMatches: user.totalMatches,
        },
        create: {
          id: user.id,
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          deleted: user.deleted,
          wins: user.wins,
          losses: user.losses,
          totalMatches: user.totalMatches,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${users.length} users`);
  }

  /**
   * Backup Games
   */
  private async backupGames() {
    const games = await this.prisma.game.findMany();
    if (games.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "games" CASCADE;');
    for (const game of games) {
      await this.backupPrisma!.game.upsert({
        where: { id: game.id },
        update: {
          name: game.name,
          description: game.description,
          rateType: game.rateType,
          defaultRate: game.defaultRate,
          isActive: game.isActive,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        },
        create: {
          id: game.id,
          name: game.name,
          description: game.description,
          rateType: game.rateType,
          defaultRate: game.defaultRate,
          isActive: game.isActive,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${games.length} games`);
  }

  /**
   * Backup Products
   */
  private async backupProducts() {
    const products = await this.prisma.product.findMany();
    if (products.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "products" CASCADE;');
    for (const product of products) {
      await this.backupPrisma!.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          category: product.category,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          deleted: product.deleted,
          version: product.version,
          lastModifiedBy: product.lastModifiedBy,
        },
        create: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          category: product.category,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          deleted: product.deleted,
          version: product.version,
          lastModifiedBy: product.lastModifiedBy,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${products.length} products`);
  }

  /**
   * Backup TableSessions
   */
  private async backupTableSessions() {
    const tables = await this.prisma.tableSession.findMany();
    if (tables.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "tables" CASCADE;');
    for (const table of tables) {
      await this.backupPrisma!.tableSession.upsert({
        where: { id: table.id },
        update: {
          tableNumber: table.tableNumber,
          gameId: table.gameId,
          status: table.status,
          startedAt: table.startedAt,
          endedAt: table.endedAt,
          pausedAt: table.pausedAt,
          totalPausedMs: table.totalPausedMs,
          lastResumedAt: table.lastResumedAt,
          ratePerHour: table.ratePerHour,
          discount: table.discount,
          currentCharge: table.currentCharge,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
        },
        create: {
          id: table.id,
          tableNumber: table.tableNumber,
          gameId: table.gameId,
          status: table.status,
          startedAt: table.startedAt,
          endedAt: table.endedAt,
          pausedAt: table.pausedAt,
          totalPausedMs: table.totalPausedMs,
          lastResumedAt: table.lastResumedAt,
          ratePerHour: table.ratePerHour,
          discount: table.discount,
          currentCharge: table.currentCharge,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${tables.length} tables`);
  }

  /**
   * Backup Shifts
   */
  private async backupShifts() {
    const shifts = await this.prisma.shift.findMany();
    if (shifts.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "shifts" CASCADE;');
    for (const shift of shifts) {
      await this.backupPrisma!.shift.upsert({
        where: { id: shift.id },
        update: {
          employeeId: shift.employeeId,
          startedAt: shift.startedAt,
          endedAt: shift.endedAt,
          openingCash: shift.openingCash,
          closingCash: shift.closingCash,
          status: shift.status,
          salesTotal: shift.salesTotal,
          cashDiscrepancy: shift.cashDiscrepancy,
          notes: shift.notes,
          createdAt: shift.createdAt,
          updatedAt: shift.updatedAt,
        },
        create: {
          id: shift.id,
          employeeId: shift.employeeId,
          startedAt: shift.startedAt,
          endedAt: shift.endedAt,
          openingCash: shift.openingCash,
          closingCash: shift.closingCash,
          status: shift.status,
          salesTotal: shift.salesTotal,
          cashDiscrepancy: shift.cashDiscrepancy,
          notes: shift.notes,
          createdAt: shift.createdAt,
          updatedAt: shift.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${shifts.length} shifts`);
  }

  /**
   * Backup Sales
   */
  private async backupSales() {
    const sales = await this.prisma.sale.findMany();
    if (sales.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "sales" CASCADE;');
    for (const sale of sales) {
      await this.backupPrisma!.sale.upsert({
        where: { id: sale.id },
        update: {
          receiptNumber: sale.receiptNumber,
          tableId: sale.tableId,
          employeeId: sale.employeeId,
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          cashReceived: sale.cashReceived,
          change: sale.change,
          notes: sale.notes,
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt,
          synced: sale.synced,
          clientId: sale.clientId,
        },
        create: {
          id: sale.id,
          receiptNumber: sale.receiptNumber,
          tableId: sale.tableId,
          employeeId: sale.employeeId,
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          cashReceived: sale.cashReceived,
          change: sale.change,
          notes: sale.notes,
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt,
          synced: sale.synced,
          clientId: sale.clientId,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${sales.length} sales`);
  }

  /**
   * Backup SaleItems
   */
  private async backupSaleItems() {
    const saleItems = await this.prisma.saleItem.findMany();
    if (saleItems.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "sale_items" CASCADE;');
    for (const item of saleItems) {
      await this.backupPrisma!.saleItem.upsert({
        where: { id: item.id },
        update: {
          saleId: item.saleId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal,
          notes: item.notes,
        },
        create: {
          id: item.id,
          saleId: item.saleId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal,
          notes: item.notes,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${saleItems.length} sale items`);
  }

  /**
   * Backup InventoryMovements
   */
  private async backupInventoryMovements() {
    const movements = await this.prisma.inventoryMovement.findMany();
    if (movements.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "inventory_movements" CASCADE;');
    for (const movement of movements) {
      await this.backupPrisma!.inventoryMovement.upsert({
        where: { id: movement.id },
        update: {
          productId: movement.productId,
          change: movement.change,
          reason: movement.reason,
          userId: movement.userId,
          createdAt: movement.createdAt,
        },
        create: {
          id: movement.id,
          productId: movement.productId,
          change: movement.change,
          reason: movement.reason,
          userId: movement.userId,
          createdAt: movement.createdAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${movements.length} inventory movements`);
  }

  /**
   * Backup Expenses
   */
  private async backupExpenses() {
    const expenses = await this.prisma.expense.findMany();
    if (expenses.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "expenses" CASCADE;');
    for (const expense of expenses) {
      await this.backupPrisma!.expense.upsert({
        where: { id: expense.id },
        update: {
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          employeeId: expense.employeeId,
          receiptUrl: expense.receiptUrl,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
        },
        create: {
          id: expense.id,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          employeeId: expense.employeeId,
          receiptUrl: expense.receiptUrl,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${expenses.length} expenses`);
  }

  /**
   * Backup Bookings
   */
  private async backupBookings() {
    const bookings = await this.prisma.booking.findMany();
    if (bookings.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "bookings" CASCADE;');
    for (const booking of bookings) {
      await this.backupPrisma!.booking.upsert({
        where: { id: booking.id },
        update: {
          tableId: booking.tableId,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          notes: booking.notes,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
        create: {
          id: booking.id,
          tableId: booking.tableId,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          notes: booking.notes,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${bookings.length} bookings`);
  }

  /**
   * Backup TableMaintenance
   */
  private async backupTableMaintenance() {
    const maintenance = await this.prisma.tableMaintenance.findMany();
    if (maintenance.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "table_maintenance" CASCADE;');
    for (const record of maintenance) {
      await this.backupPrisma!.tableMaintenance.upsert({
        where: { id: record.id },
        update: {
          tableId: record.tableId,
          type: record.type,
          scheduledDate: record.scheduledDate,
          completedDate: record.completedDate,
          status: record.status,
          cost: record.cost,
          description: record.description,
          employeeId: record.employeeId,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
        create: {
          id: record.id,
          tableId: record.tableId,
          type: record.type,
          scheduledDate: record.scheduledDate,
          completedDate: record.completedDate,
          status: record.status,
          cost: record.cost,
          description: record.description,
          employeeId: record.employeeId,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${maintenance.length} maintenance records`);
  }

  /**
   * Backup TableRateRules
   */
  private async backupTableRateRules() {
    const rules = await this.prisma.tableRateRule.findMany();
    if (rules.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "table_rate_rules" CASCADE;');
    for (const rule of rules) {
      await this.backupPrisma!.tableRateRule.upsert({
        where: { id: rule.id },
        update: {
          tableId: rule.tableId,
          ruleType: rule.ruleType,
          name: rule.name,
          description: rule.description,
          startTime: rule.startTime,
          endTime: rule.endTime,
          daysOfWeek: rule.daysOfWeek,
          discountPercent: rule.discountPercent,
          ratePerHour: rule.ratePerHour,
          isActive: rule.isActive,
          priority: rule.priority,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
        },
        create: {
          id: rule.id,
          tableId: rule.tableId,
          ruleType: rule.ruleType,
          name: rule.name,
          description: rule.description,
          startTime: rule.startTime,
          endTime: rule.endTime,
          daysOfWeek: rule.daysOfWeek,
          discountPercent: rule.discountPercent,
          ratePerHour: rule.ratePerHour,
          isActive: rule.isActive,
          priority: rule.priority,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${rules.length} rate rules`);
  }

  /**
   * Backup KitchenOrders
   */
  private async backupKitchenOrders() {
    const orders = await this.prisma.kitchenOrder.findMany();
    if (orders.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "kitchen_orders" CASCADE;');
    for (const order of orders) {
      await this.backupPrisma!.kitchenOrder.upsert({
        where: { id: order.id },
        update: {
          saleId: order.saleId,
          status: order.status,
          items: order.items as any,
          notes: order.notes,
          estimatedTime: order.estimatedTime,
          startedAt: order.startedAt,
          readyAt: order.readyAt,
          servedAt: order.servedAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        create: {
          id: order.id,
          saleId: order.saleId,
          status: order.status,
          items: order.items as any,
          notes: order.notes,
          estimatedTime: order.estimatedTime,
          startedAt: order.startedAt,
          readyAt: order.readyAt,
          servedAt: order.servedAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${orders.length} kitchen orders`);
  }

  /**
   * Backup Matches
   */
  private async backupMatches() {
    const matches = await this.prisma.match.findMany();
    if (matches.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "matches" CASCADE;');
    for (const match of matches) {
      await this.backupPrisma!.match.upsert({
        where: { id: match.id },
        update: {
          tableId: match.tableId,
          status: match.status,
          gameType: match.gameType,
          startTime: match.startTime,
          endTime: match.endTime,
          score: match.score as any,
          metadata: match.metadata as any,
          saleId: match.saleId,
          isPaid: match.isPaid,
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
        },
        create: {
          id: match.id,
          tableId: match.tableId,
          status: match.status,
          gameType: match.gameType,
          startTime: match.startTime,
          endTime: match.endTime,
          score: match.score as any,
          metadata: match.metadata as any,
          saleId: match.saleId,
          isPaid: match.isPaid,
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${matches.length} matches`);
  }

  /**
   * Backup MatchPlayers
   */
  private async backupMatchPlayers() {
    const players = await this.prisma.matchPlayer.findMany();
    if (players.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "match_players" CASCADE;');
    for (const player of players) {
      await this.backupPrisma!.matchPlayer.upsert({
        where: { id: player.id },
        update: {
          matchId: player.matchId,
          playerId: player.playerId,
          seatNumber: player.seatNumber,
          result: player.result,
          score: player.score,
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
        },
        create: {
          id: player.id,
          matchId: player.matchId,
          playerId: player.playerId,
          seatNumber: player.seatNumber,
          result: player.result,
          score: player.score,
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${players.length} match players`);
  }

  /**
   * Backup Tournaments
   */
  private async backupTournaments() {
    const tournaments = await this.prisma.tournament.findMany();
    if (tournaments.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "tournaments" CASCADE;');
    for (const tournament of tournaments) {
      await this.backupPrisma!.tournament.upsert({
        where: { id: tournament.id },
        update: {
          name: tournament.name,
          format: tournament.format,
          bracket: tournament.bracket as any,
          status: tournament.status,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          maxPlayers: tournament.maxPlayers,
          entryFee: tournament.entryFee,
          prizePool: tournament.prizePool,
          description: tournament.description,
          createdById: tournament.createdById,
          createdAt: tournament.createdAt,
          updatedAt: tournament.updatedAt,
        },
        create: {
          id: tournament.id,
          name: tournament.name,
          format: tournament.format,
          bracket: tournament.bracket as any,
          status: tournament.status,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          maxPlayers: tournament.maxPlayers,
          entryFee: tournament.entryFee,
          prizePool: tournament.prizePool,
          description: tournament.description,
          createdById: tournament.createdById,
          createdAt: tournament.createdAt,
          updatedAt: tournament.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${tournaments.length} tournaments`);
  }

  /**
   * Backup TournamentPlayers
   */
  private async backupTournamentPlayers() {
    const players = await this.prisma.tournamentPlayer.findMany();
    if (players.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "tournament_players" CASCADE;');
    for (const player of players) {
      await this.backupPrisma!.tournamentPlayer.upsert({
        where: { id: player.id },
        update: {
          tournamentId: player.tournamentId,
          playerId: player.playerId,
          seed: player.seed,
          status: player.status,
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
        },
        create: {
          id: player.id,
          tournamentId: player.tournamentId,
          playerId: player.playerId,
          seed: player.seed,
          status: player.status,
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${players.length} tournament players`);
  }

  /**
   * Backup TournamentMatches
   */
  private async backupTournamentMatches() {
    const matches = await this.prisma.tournamentMatch.findMany();
    if (matches.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "tournament_matches" CASCADE;');
    for (const match of matches) {
      await this.backupPrisma!.tournamentMatch.upsert({
        where: { id: match.id },
        update: {
          tournamentId: match.tournamentId,
          matchId: match.matchId,
          round: match.round,
          bracketPosition: match.bracketPosition,
          createdAt: match.createdAt,
        },
        create: {
          id: match.id,
          tournamentId: match.tournamentId,
          matchId: match.matchId,
          round: match.round,
          bracketPosition: match.bracketPosition,
          createdAt: match.createdAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${matches.length} tournament matches`);
  }

  /**
   * Backup ActivityLogs
   */
  private async backupActivityLogs() {
    const logs = await this.prisma.activityLog.findMany();
    if (logs.length === 0) return;

    await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "activity_logs" CASCADE;');
    for (const log of logs) {
      await this.backupPrisma!.activityLog.upsert({
        where: { id: log.id },
        update: {
          userId: log.userId,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          payload: log.payload as any,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        },
        create: {
          id: log.id,
          userId: log.userId,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          payload: log.payload as any,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        },
      });
    }
    this.logger.debug(`✅ Backed up ${logs.length} activity logs`);
  }

  /**
   * Backup SyncLog
   */
  private async backupSyncLog() {
    try {
      const logs = await this.prisma.syncLog.findMany();
      if (logs.length === 0) return;

      await this.backupPrisma!.$executeRawUnsafe('TRUNCATE TABLE "sync_log" CASCADE;');
      for (const log of logs) {
        await this.backupPrisma!.syncLog.upsert({
          where: { id: log.id },
          update: {
            entity: log.entity,
            action: log.action,
            entityId: log.entityId,
            payload: log.payload as any,
            clientId: log.clientId,
            clientUpdatedAt: log.clientUpdatedAt,
            serverId: log.serverId,
            serverUpdatedAt: log.serverUpdatedAt,
            status: log.status,
            conflictData: log.conflictData as any,
            error: log.error,
            createdAt: log.createdAt,
          },
          create: {
            id: log.id,
            entity: log.entity,
            action: log.action,
            entityId: log.entityId,
            payload: log.payload as any,
            clientId: log.clientId,
            clientUpdatedAt: log.clientUpdatedAt,
            serverId: log.serverId,
            serverUpdatedAt: log.serverUpdatedAt,
            status: log.status,
            conflictData: log.conflictData as any,
            error: log.error,
            createdAt: log.createdAt,
          },
        });
      }
      this.logger.debug(`✅ Backed up ${logs.length} sync logs`);
    } catch (error) {
      // SyncLog might not exist in backup database, skip silently
      this.logger.debug('Skipping sync_log backup (table may not exist)');
    }
  }

  /**
   * Manually trigger backup (for testing or on-demand backup)
   */
  async triggerBackup(): Promise<void> {
    if (!this.isBackupEnabled || !this.backupPrisma) {
      throw new Error('Backup service is not enabled or not initialized');
    }

    this.logger.log('🔄 Manual backup triggered...');
    await this.performBackup();
    this.logger.log('✅ Manual backup completed');
  }

  /**
   * Get backup status
   */
  getBackupStatus() {
    return {
      enabled: this.isBackupEnabled,
      connected: this.backupPrisma !== null,
      lastBackup: new Date().toISOString(), // Could track this if needed
    };
  }
}

