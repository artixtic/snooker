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
  game?: any; // Game relation
}

export interface DBShift extends Shift {
  id: string;
}

export interface DBGame {
  id: string;
  name: string;
  description?: string;
  rateType: 'PER_MINUTE' | 'PER_HOUR';
  defaultRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBExpense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
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
  games!: Table<DBGame, string>;
  expenses!: Table<DBExpense, string>;
  sync_log!: Table<DBSyncLog, number>;

  constructor() {
    super('snooker_pos_db');
    
    // Version 1 - Initial schema
    this.version(1).stores({
      products: 'id, name, sku, barcode, price, updatedAt, deleted',
      sales: 'id, createdAt, total, synced, clientId',
      sale_items: '++id, saleId, productId, qty, unitPrice',
      inventory_movements: 'id, productId, change, reason, createdAt',
      tables: 'id, tableNumber, status, startedAt, updatedAt',
      shifts: 'id, employeeId, startedAt, endedAt, status',
      sync_log: '++id, entity, action, entityId, createdAt, status, clientId',
    });
    
    // Version 2 - Added games and expenses tables, updated indexes
    this.version(2).stores({
      products: 'id, name, sku, barcode, price, updatedAt, deleted',
      sales: 'id, createdAt, total, synced, clientId, tableId',
      sale_items: '++id, saleId, productId, qty, unitPrice',
      inventory_movements: 'id, productId, change, reason, createdAt',
      tables: 'id, tableNumber, status, startedAt, updatedAt, gameId',
      shifts: 'id, employeeId, startedAt, endedAt, status',
      games: 'id, name, rateType, isActive, updatedAt',
      expenses: 'id, date, userId, category, createdAt',
      sync_log: '++id, entity, action, entityId, createdAt, status, clientId',
    }).upgrade(async (tx) => {
      // Migration logic if needed
      // Tables and shifts already exist, just adding games and expenses
    });
  }
}

// Only initialize database on client side (not during SSR)
let db: SnookerPOSDatabase | null = null;

function getDb(): SnookerPOSDatabase {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Database can only be accessed on the client side');
  }

  if (!db) {
    db = new SnookerPOSDatabase();
    
    // Ensure database is open
    db.open().catch((err) => {
      console.error('Failed to open database:', err);
      // If database can't be opened, try to delete and recreate
      if (err.name === 'VersionError' || err.name === 'OpenFailedError') {
        console.warn('Database version mismatch. Please clear IndexedDB in DevTools → Application → IndexedDB → snooker_pos_db → Delete database');
      }
    });
  }

  return db;
}

// Export a getter that ensures client-side only access
export { getDb };
export const db = new Proxy({} as SnookerPOSDatabase, {
  get(target, prop) {
    return getDb()[prop as keyof SnookerPOSDatabase];
  },
});

