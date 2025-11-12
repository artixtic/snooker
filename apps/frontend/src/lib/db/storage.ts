/**
 * Data Storage Layer
 * 
 * Provides a clean API for storing and retrieving data from IndexedDB.
 * This layer abstracts away Dexie operations and provides type-safe methods.
 */

import { db } from './database';
import type { Game, Table, Product, Sale, Shift } from './database';

/**
 * Storage service for Games
 */
const gamesStorage = {
  /**
   * Save all games (replaces existing)
   */
  async saveAll(games: Game[]): Promise<void> {
    await db.transaction('rw', db.games, async () => {
      await db.games.clear();
      await db.games.bulkAdd(games);
    });
  },

  /**
   * Get all games
   */
  async getAll(): Promise<Game[]> {
    return await db.games.toArray();
  },

  /**
   * Get a game by id
   */
  async getById(id: string): Promise<Game | undefined> {
    return await db.games.get(id);
  },

  /**
   * Save a single game
   */
  async save(game: Game): Promise<void> {
    await db.games.put(game);
  },

  /**
   * Update a game
   */
  async update(id: string, updates: Partial<Game>): Promise<void> {
    await db.games.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  /**
   * Delete a game
   */
  async delete(id: string): Promise<void> {
    await db.games.delete(id);
  },

  /**
   * Clear all games
   */
  async clear(): Promise<void> {
    await db.games.clear();
  },
};

/**
 * Storage service for Tables
 */
const tablesStorage = {
  /**
   * Save all tables (replaces existing)
   */
  async saveAll(tables: Table[]): Promise<void> {
    await db.transaction('rw', db.tableRecords, async () => {
      await db.tableRecords.clear();
      await db.tableRecords.bulkAdd(tables);
    });
  },

  /**
   * Get all tables
   */
  async getAll(): Promise<Table[]> {
    return await db.tableRecords.toArray();
  },

  /**
   * Get a table by id
   */
  async getById(id: string): Promise<Table | undefined> {
    return await db.tableRecords.get(id);
  },

  /**
   * Get tables by gameId
   */
  async getByGameId(gameId: string): Promise<Table[]> {
    return await db.tableRecords.where('gameId').equals(gameId).toArray();
  },

  /**
   * Save a single table
   */
  async save(table: Table): Promise<void> {
    await db.tableRecords.put(table);
  },

  /**
   * Update a table
   */
  async update(id: string, updates: Partial<Table>): Promise<void> {
    await db.tableRecords.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  /**
   * Delete a table
   */
  async delete(id: string): Promise<void> {
    await db.tableRecords.delete(id);
  },

  /**
   * Clear all tables
   */
  async clear(): Promise<void> {
    await db.tableRecords.clear();
  },
};

/**
 * Storage service for Products
 */
const productsStorage = {
  /**
   * Save all products (replaces existing)
   */
  async saveAll(products: Product[]): Promise<void> {
    await db.transaction('rw', db.products, async () => {
      await db.products.clear();
      await db.products.bulkAdd(products);
    });
  },

  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    return await db.products.toArray();
  },

  /**
   * Get a product by id
   */
  async getById(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  },

  /**
   * Save a single product
   */
  async save(product: Product): Promise<void> {
    await db.products.put(product);
  },

  /**
   * Update a product
   */
  async update(id: string, updates: Partial<Product>): Promise<void> {
    await db.products.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    await db.products.delete(id);
  },

  /**
   * Clear all products
   */
  async clear(): Promise<void> {
    await db.products.clear();
  },
};

/**
 * Storage service for Sales
 */
const salesStorage = {
  /**
   * Save all sales (replaces existing)
   */
  async saveAll(sales: Sale[]): Promise<void> {
    await db.transaction('rw', db.sales, async () => {
      await db.sales.clear();
      await db.sales.bulkAdd(sales);
    });
  },

  /**
   * Get all sales
   */
  async getAll(): Promise<Sale[]> {
    return await db.sales.toArray();
  },

  /**
   * Get a sale by id
   */
  async getById(id: string): Promise<Sale | undefined> {
    return await db.sales.get(id);
  },

  /**
   * Get sales by tableId
   */
  async getByTableId(tableId: string): Promise<Sale[]> {
    return await db.sales.where('tableId').equals(tableId).toArray();
  },

  /**
   * Save a single sale
   */
  async save(sale: Sale): Promise<void> {
    await db.sales.add(sale);
  },

  /**
   * Clear all sales
   */
  async clear(): Promise<void> {
    await db.sales.clear();
  },
};

/**
 * Storage service for Shifts
 */
const shiftsStorage = {
  /**
   * Save all shifts (replaces existing)
   */
  async saveAll(shifts: Shift[]): Promise<void> {
    await db.transaction('rw', db.shifts, async () => {
      await db.shifts.clear();
      await db.shifts.bulkAdd(shifts);
    });
  },

  /**
   * Get all shifts
   */
  async getAll(): Promise<Shift[]> {
    return await db.shifts.toArray();
  },

  /**
   * Get a shift by id
   */
  async getById(id: string): Promise<Shift | undefined> {
    return await db.shifts.get(id);
  },

  /**
   * Get active shift (no endTime)
   */
  async getActive(): Promise<Shift | undefined> {
    return await db.shifts.where('endTime').equals(null).first();
  },

  /**
   * Save a single shift
   */
  async save(shift: Shift): Promise<void> {
    await db.shifts.put(shift);
  },

  /**
   * Update a shift
   */
  async update(id: string, updates: Partial<Shift>): Promise<void> {
    await db.shifts.update(id, updates);
  },

  /**
   * Clear all shifts
   */
  async clear(): Promise<void> {
    await db.shifts.clear();
  },
};

/**
 * Unified storage interface
 */
export const storage = {
  games: gamesStorage,
  tables: tablesStorage,
  products: productsStorage,
  sales: salesStorage,
  shifts: shiftsStorage,
};

