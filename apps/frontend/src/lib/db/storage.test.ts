/**
 * TDD Tests for Data Storage Layer
 * 
 * Tests for the storage service that wraps IndexedDB operations
 * and provides a clean API for storing/retrieving application data.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storage } from './storage';
import { db } from './database';
import type { Game, Table, Product, Sale } from './database';

describe('Data Storage Layer', () => {
  beforeEach(async () => {
    // Close and delete database before each test
    try {
      await db.close();
      await db.delete();
    } catch (e) {
      // Ignore errors if database doesn't exist
    }
    // Open database to initialize schema
    await db.open();
  });

  afterEach(async () => {
    // Close database after each test
    try {
      await db.close();
    } catch (e) {
      // Ignore errors
    }
  });

  describe('Games Storage', () => {
    it('should save games to IndexedDB', async () => {
      const games: Game[] = [
        {
          id: 'game-1',
          name: 'Snooker',
          rateType: 'PER_HOUR',
          defaultRate: 100,
          createdAt: new Date().toISOString(),
        },
      ];

      await storage.games.saveAll(games);
      const stored = await db.games.toArray();
      
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Snooker');
    });

    it('should retrieve all games from IndexedDB', async () => {
      const games: Game[] = [
        {
          id: 'game-1',
          name: 'Snooker',
          rateType: 'PER_HOUR',
          defaultRate: 100,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'game-2',
          name: 'Pool',
          rateType: 'PER_MINUTE',
          defaultRate: 5,
          createdAt: new Date().toISOString(),
        },
      ];

      await db.games.bulkAdd(games);
      const retrieved = await storage.games.getAll();
      
      expect(retrieved).toHaveLength(2);
    });

    it('should get a game by id', async () => {
      const game: Game = {
        id: 'game-1',
        name: 'Snooker',
        rateType: 'PER_HOUR',
        defaultRate: 100,
        createdAt: new Date().toISOString(),
      };

      await db.games.add(game);
      const retrieved = await storage.games.getById('game-1');
      
      expect(retrieved?.name).toBe('Snooker');
    });

    it('should update a game', async () => {
      const game: Game = {
        id: 'game-1',
        name: 'Snooker',
        rateType: 'PER_HOUR',
        defaultRate: 100,
        createdAt: new Date().toISOString(),
      };

      await db.games.add(game);
      await storage.games.update('game-1', { name: 'Updated Snooker' });
      const updated = await storage.games.getById('game-1');
      
      expect(updated?.name).toBe('Updated Snooker');
    });

    it('should clear all games', async () => {
      const games: Game[] = [
        {
          id: 'game-1',
          name: 'Snooker',
          rateType: 'PER_HOUR',
          defaultRate: 100,
          createdAt: new Date().toISOString(),
        },
      ];

      await db.games.bulkAdd(games);
      await storage.games.clear();
      const all = await storage.games.getAll();
      
      expect(all).toHaveLength(0);
    });
  });

  describe('Tables Storage', () => {
    it('should save tables to IndexedDB', async () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          tableNumber: 1,
          gameId: 'game-1',
          status: 'AVAILABLE',
          ratePerHour: 100,
          startedAt: null,
          pausedAt: null,
          lastResumedAt: null,
          totalPausedMs: 0,
          currentCharge: 0,
          createdAt: new Date().toISOString(),
        },
      ];

      await storage.tables.saveAll(tables);
      const stored = await db.tableRecords.toArray();
      
      expect(stored).toHaveLength(1);
    });

    it('should get tables by gameId', async () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          tableNumber: 1,
          gameId: 'game-1',
          status: 'AVAILABLE',
          ratePerHour: 100,
          startedAt: null,
          pausedAt: null,
          lastResumedAt: null,
          totalPausedMs: 0,
          currentCharge: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'table-2',
          tableNumber: 2,
          gameId: 'game-2',
          status: 'OCCUPIED',
          ratePerHour: 50,
          startedAt: new Date().toISOString(),
          pausedAt: null,
          lastResumedAt: null,
          totalPausedMs: 0,
          currentCharge: 0,
          createdAt: new Date().toISOString(),
        },
      ];

      await db.tableRecords.bulkAdd(tables);
      const game1Tables = await storage.tables.getByGameId('game-1');
      
      expect(game1Tables).toHaveLength(1);
      expect(game1Tables[0].id).toBe('table-1');
    });
  });

  describe('Products Storage', () => {
    it('should save products to IndexedDB', async () => {
      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Coca Cola',
          price: 50,
          stock: 100,
          createdAt: new Date().toISOString(),
        },
      ];

      await storage.products.saveAll(products);
      const stored = await db.products.toArray();
      
      expect(stored).toHaveLength(1);
    });
  });

  describe('Sales Storage', () => {
    it('should save sales to IndexedDB', async () => {
      const sales: Sale[] = [
        {
          id: 'sale-1',
          tableId: 'table-1',
          subtotal: 100,
          tax: 15,
          total: 115,
          paymentMethod: 'CASH',
          cashReceived: 120,
          change: 5,
          items: [],
          createdAt: new Date().toISOString(),
        },
      ];

      await storage.sales.saveAll(sales);
      const stored = await db.sales.toArray();
      
      expect(stored).toHaveLength(1);
    });
  });
});

