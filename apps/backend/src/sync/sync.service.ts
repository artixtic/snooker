import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncPushRequest, SyncPushResponse, ConflictResponse, SyncPullResponse } from './dto/sync.dto';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async push(clientId: string, operations: any[]): Promise<SyncPushResponse> {
    const processed: string[] = [];
    const createdServerIds: Record<string, string> = {};
    const conflicts: ConflictResponse[] = [];
    const errors: any[] = [];

    for (const op of operations) {
      try {
        const result = await this.processOperation(op, clientId);
        if ('conflict' in result && result.conflict) {
          conflicts.push(result.conflict);
        } else {
          processed.push(op.opId);
          if ('serverId' in result && result.serverId) {
            createdServerIds[op.opId] = result.serverId;
          }
        }
      } catch (error: any) {
        errors.push({
          opId: op.opId,
          error: error.message,
        });
      }
    }

    return {
      processed: processed.length,
      createdServerIds,
      conflicts,
      errors,
    };
  }

  private async processOperation(op: any, clientId: string) {
    // Use transaction for atomicity
    return this.prisma.$transaction(async (tx) => {
      switch (op.entity) {
        case 'product':
          return this.syncProduct(op, clientId, tx);
        case 'sale':
          return this.syncSale(op, clientId, tx);
        case 'inventory_movement':
          return this.syncInventoryMovement(op, clientId, tx);
        case 'table':
          return this.syncTable(op, clientId, tx);
        case 'shift':
          return this.syncShift(op, clientId, tx);
        case 'game':
          return this.syncGame(op, clientId, tx);
        case 'expense':
          return this.syncExpense(op, clientId, tx);
        default:
          throw new BadRequestException(`Unknown entity type: ${op.entity}`);
      }
    });
  }

  private async syncProduct(op: any, clientId: string, tx: any): Promise<{ conflict?: ConflictResponse; serverId?: string }> {
    const payload = op.payload;
    const clientUpdatedAt = new Date(op.clientUpdatedAt);

    if (op.action === 'create') {
      // Check if product with same SKU/barcode exists (conflict check)
      let existing = null;
      if (payload.sku) {
        existing = await tx.product.findUnique({ where: { sku: payload.sku } });
      }
      if (!existing && payload.barcode) {
        existing = await tx.product.findUnique({ where: { barcode: payload.barcode } });
      }

      if (existing && !existing.deleted) {
        // Conflict: product already exists
        return {
          conflict: {
            opId: op.opId,
            entity: 'product',
            action: op.action,
            conflictType: 'state',
            clientData: payload,
            serverData: existing,
            message: 'Product with same SKU/barcode already exists',
          },
        };
      }

      const product = await tx.product.create({
        data: {
          ...payload,
          lastModifiedBy: clientId,
        },
      });

      return { serverId: product.id };
    }

    if (op.action === 'update') {
      const product = await tx.product.findUnique({ where: { id: payload.id } });
      if (!product) {
        throw new BadRequestException(`Product ${payload.id} not found`);
      }

      // Last Writer Wins: compare timestamps
      if (product.updatedAt > clientUpdatedAt) {
        return {
          conflict: {
            opId: op.opId,
            entity: 'product',
            action: op.action,
            conflictType: 'timestamp',
            clientData: payload,
            serverData: product,
            message: 'Server version is newer',
          },
        };
      }

      await tx.product.update({
        where: { id: payload.id },
        data: {
          ...payload,
          id: undefined, // Don't update ID
          version: product.version + 1,
          lastModifiedBy: clientId,
        },
      });

      return { serverId: product.id };
    }

    if (op.action === 'delete') {
      await tx.product.update({
        where: { id: payload.id },
        data: { deleted: true, lastModifiedBy: clientId },
      });
      return { serverId: payload.id };
    }

    throw new BadRequestException(`Unknown action: ${op.action}`);
  }

  private async syncSale(op: any, clientId: string, tx: any): Promise<{ conflict?: ConflictResponse; serverId?: string }> {
    // Sales are append-only - always create new record
    if (op.action !== 'create') {
      throw new BadRequestException('Sale can only be created (append-only)');
    }

    const payload = op.payload;
    const receiptNumber = await this.generateReceiptNumber(tx);

    const sale = await tx.sale.create({
      data: {
        ...payload,
        receiptNumber,
        items: {
          create: payload.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            subtotal: item.subtotal,
            notes: item.notes,
          })),
        },
      },
    });

    return { serverId: sale.id };
  }

  private async syncInventoryMovement(op: any, clientId: string, tx: any): Promise<{ conflict?: ConflictResponse; serverId?: string }> {
    if (op.action !== 'create') {
      throw new BadRequestException('Inventory movement can only be created');
    }

    const payload = op.payload;
    const movement = await tx.inventoryMovement.create({
      data: {
        productId: payload.productId,
        change: payload.change,
        reason: payload.reason,
        userId: payload.userId || clientId,
      },
    });

    // Update product stock
    await tx.product.update({
      where: { id: payload.productId },
      data: {
        stock: { increment: payload.change },
      },
    });

    return { serverId: movement.id };
  }

  private async syncTable(op: any, clientId: string, tx: any): Promise<{ conflict?: ConflictResponse; serverId?: string }> {
    const payload = op.payload;

    if (op.action === 'create' || op.action === 'update') {
      // Check if table exists by ID or tableNumber
      let existing = null;
      if (payload.id) {
        existing = await tx.tableSession.findUnique({ where: { id: payload.id } });
      }
      if (!existing && payload.tableNumber) {
        existing = await tx.tableSession.findUnique({ where: { tableNumber: payload.tableNumber } });
      }

      if (existing) {
        // Update existing table
        const table = await tx.tableSession.update({
          where: { id: existing.id },
          data: {
            ...payload,
            id: undefined, // Don't update ID
          },
        });
        return { serverId: table.id };
      } else {
        // Create new table
        const table = await tx.tableSession.create({
          data: payload,
        });
        return { serverId: table.id };
      }
    }

    if (op.action === 'delete') {
      await tx.tableSession.delete({
        where: { id: payload.id },
      });
      return { serverId: payload.id };
    }

    throw new BadRequestException(`Unknown action for table: ${op.action}`);
  }

  private async syncShift(op: any, clientId: string, tx: any): Promise<{ conflict?: ConflictResponse; serverId?: string }> {
    const payload = op.payload;

    if (op.action === 'create') {
      const shift = await tx.shift.create({
        data: payload,
      });
      return { serverId: shift.id };
    }

    if (op.action === 'update') {
      const shift = await tx.shift.update({
        where: { id: payload.id },
        data: {
          ...payload,
          id: undefined,
        },
      });
      return { serverId: shift.id };
    }

    throw new BadRequestException(`Unknown action for shift: ${op.action}`);
  }

  private async syncGame(op: any, clientId: string, tx: any): Promise<{ conflict?: ConflictResponse; serverId?: string }> {
    const payload = op.payload;
    const clientUpdatedAt = new Date(op.clientUpdatedAt);

    if (op.action === 'create') {
      // Check if game with same name exists
      const existing = await tx.game.findUnique({ where: { name: payload.name } });
      if (existing) {
        return {
          conflict: {
            opId: op.opId,
            entity: 'game',
            action: op.action,
            conflictType: 'state',
            clientData: payload,
            serverData: existing,
            message: 'Game with same name already exists',
          },
        };
      }

      const game = await tx.game.create({
        data: payload,
      });
      return { serverId: game.id };
    }

    if (op.action === 'update') {
      const game = await tx.game.findUnique({ where: { id: payload.id } });
      if (!game) {
        throw new BadRequestException(`Game ${payload.id} not found`);
      }

      // Last Writer Wins
      if (game.updatedAt > clientUpdatedAt) {
        return {
          conflict: {
            opId: op.opId,
            entity: 'game',
            action: op.action,
            conflictType: 'timestamp',
            clientData: payload,
            serverData: game,
            message: 'Server version is newer',
          },
        };
      }

      const updated = await tx.game.update({
        where: { id: payload.id },
        data: {
          ...payload,
          id: undefined,
        },
      });
      return { serverId: updated.id };
    }

    if (op.action === 'delete') {
      await tx.game.delete({
        where: { id: payload.id },
      });
      return { serverId: payload.id };
    }

    throw new BadRequestException(`Unknown action for game: ${op.action}`);
  }

  private async syncExpense(op: any, clientId: string, tx: any): Promise<{ conflict?: ConflictResponse; serverId?: string }> {
    const payload = op.payload;

    if (op.action === 'create') {
      const expense = await tx.expense.create({
        data: payload,
      });
      return { serverId: expense.id };
    }

    if (op.action === 'update') {
      const expense = await tx.expense.update({
        where: { id: payload.id },
        data: {
          ...payload,
          id: undefined,
        },
      });
      return { serverId: expense.id };
    }

    if (op.action === 'delete') {
      await tx.expense.delete({
        where: { id: payload.id },
      });
      return { serverId: payload.id };
    }

    throw new BadRequestException(`Unknown action for expense: ${op.action}`);
  }

  private async generateReceiptNumber(tx: any): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await tx.sale.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });
    return `RCP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async pull(since: Date, limit: number = 1000): Promise<SyncPullResponse> {
    const changes: any[] = [];

    // Get all entity changes since timestamp
    // Note: Prisma models use camelCase, not PascalCase
    const productRecords = await this.prisma.product.findMany({
      where: {
        updatedAt: { gte: since },
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });

    const saleRecords = await this.prisma.sale.findMany({
      where: {
        updatedAt: { gte: since },
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });

    const inventoryRecords = await this.prisma.inventoryMovement.findMany({
      where: {
        createdAt: { gte: since },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    const tableRecords = await this.prisma.tableSession.findMany({
      where: {
        updatedAt: { gte: since },
      },
      include: {
        game: true,
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });

    const shiftRecords = await this.prisma.shift.findMany({
      where: {
        updatedAt: { gte: since },
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });

    const gameRecords = await this.prisma.game.findMany({
      where: {
        updatedAt: { gte: since },
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });

    const expenseRecords = await this.prisma.expense.findMany({
      where: {
        updatedAt: { gte: since },
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });

    // Combine all records
    const allRecords = [
      ...productRecords.map((r) => ({ ...r, _entity: 'product' })),
      ...saleRecords.map((r) => ({ ...r, _entity: 'sale' })),
      ...inventoryRecords.map((r) => ({ ...r, _entity: 'inventory_movement' })),
      ...tableRecords.map((r) => ({ ...r, _entity: 'table' })),
      ...shiftRecords.map((r) => ({ ...r, _entity: 'shift' })),
      ...gameRecords.map((r) => ({ ...r, _entity: 'game' })),
      ...expenseRecords.map((r) => ({ ...r, _entity: 'expense' })),
    ];

    for (const record of allRecords) {
      const entityName = record._entity as string;
      const { _entity, ...recordData } = record;

      const updatedAt = 'updatedAt' in recordData && recordData.updatedAt 
        ? (recordData.updatedAt as Date).toISOString()
        : 'createdAt' in recordData && recordData.createdAt
        ? (recordData.createdAt as Date).toISOString()
        : new Date().toISOString();

      changes.push({
        entity: entityName,
        id: recordData.id,
        action: (recordData as any).deleted ? 'delete' : 'update',
        data: recordData,
        updatedAt,
        deleted: (recordData as any).deleted || false,
      });
    }

    return {
      changes,
      lastSyncTime: new Date().toISOString(),
      hasMore: changes.length >= limit,
    };
  }
}

