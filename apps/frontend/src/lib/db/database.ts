/**
 * IndexedDB Database Schema using Dexie.js
 * 
 * This database stores all application data for offline functionality:
 * - Games, Tables, Products, Sales, Shifts
 * - Queued requests for offline sync
 */

import Dexie, { Table as DexieTable } from 'dexie';

// Define interfaces for our data models
export interface Game {
  id: string;
  name: string;
  description?: string;
  rateType: 'PER_HOUR' | 'PER_MINUTE';
  defaultRate: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Table {
  id: string;
  tableNumber: number;
  gameId: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'PAUSED';
  ratePerHour: number;
  startedAt: string | null;
  pausedAt: string | null;
  lastResumedAt: string | null;
  totalPausedMs: number;
  currentCharge: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  category?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  tableId?: string;
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
  cashReceived?: number;
  change?: number;
  items: SaleItem[];
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  subtotal: number;
}

export interface Shift {
  id: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  endingCash?: number;
  userId: string;
  createdAt: string;
}

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  config?: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Database class extending Dexie
 */
export class SnookerDatabase extends Dexie {
  games!: DexieTable<Game, string>;
  tableRecords!: DexieTable<Table, string>;
  products!: DexieTable<Product, string>;
  sales!: DexieTable<Sale, string>;
  shifts!: DexieTable<Shift, string>;
  queuedRequests!: DexieTable<QueuedRequest, string>;

  constructor() {
    super('SnookerPOSDB');
    
    // Define database schema
    // Version 1: Initial schema
    this.version(1).stores({
      games: 'id, name, createdAt',
      tableRecords: 'id, tableNumber, gameId, status, createdAt',
      products: 'id, name, category, createdAt',
      sales: 'id, tableId, createdAt',
      shifts: 'id, userId, startTime, endTime',
      queuedRequests: 'id, timestamp, method, url',
    });
    
    // Version 2: Added retryCount index to queuedRequests
    this.version(2).stores({
      games: 'id, name, createdAt',
      tableRecords: 'id, tableNumber, gameId, status, createdAt',
      products: 'id, name, category, createdAt',
      sales: 'id, tableId, createdAt',
      shifts: 'id, userId, startTime, endTime',
      queuedRequests: 'id, timestamp, method, url, retryCount',
    }).upgrade(async (tx) => {
      // Migration: Add retryCount to existing queued requests if missing
      const requests = await tx.table('queuedRequests').toCollection().toArray();
      for (const request of requests) {
        if (request.retryCount === undefined) {
          await tx.table('queuedRequests').update(request.id, { retryCount: 0 });
        }
      }
    });
  }
}

// Create and export database instance
export const db = new SnookerDatabase();

