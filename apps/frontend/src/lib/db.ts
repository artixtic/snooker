// Dexie database setup for offline storage
import Dexie, { Table } from 'dexie';
import { Product, Sale, SaleItem, InventoryMovement, TableSession, Shift, SyncLog } from '@snooker-pos/shared';

export interface DBProduct extends Product {
  id: string;
}

export interface DBSale extends Sale {
  id: string;
  synced: boolean;
}

export interface DBSaleItem extends SaleItem {
  id?: number;
}

export interface DBInventoryMovement extends InventoryMovement {
  id: string;
}

export interface DBTable extends TableSession {
  id: string;
}

export interface DBShift extends Shift {
  id: string;
}

export interface DBSyncLog extends SyncLog {
  id?: number;
}

export class SnookerPOSDatabase extends Dexie {
  products!: Table<DBProduct, string>;
  sales!: Table<DBSale, string>;
  sale_items!: Table<DBSaleItem, number>;
  inventory_movements!: Table<DBInventoryMovement, string>;
  tables!: Table<DBTable, string>;
  shifts!: Table<DBShift, string>;
  sync_log!: Table<DBSyncLog, number>;

  constructor() {
    super('snooker_pos_db');
    
    this.version(1).stores({
      products: 'id, name, sku, barcode, price, updatedAt, deleted',
      sales: 'id, createdAt, total, synced, clientId',
      sale_items: '++id, saleId, productId, qty, unitPrice',
      inventory_movements: 'id, productId, change, reason, createdAt',
      tables: 'id, tableNumber, status, startedAt, updatedAt',
      shifts: 'id, employeeId, startedAt, endedAt, status',
      sync_log: '++id, entity, action, entityId, createdAt, status, clientId',
    });
  }
}

export const db = new SnookerPOSDatabase();

