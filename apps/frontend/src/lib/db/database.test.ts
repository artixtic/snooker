/**
 * TDD Tests for Database Schema
 * 
 * These tests define the expected behavior of our IndexedDB database
 * using Dexie.js. We'll implement the database to make these tests pass.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from './database';

describe('Database Schema', () => {
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

  describe('Games Table', () => {
    it('should store a game', async () => {
      const game = {
        id: 'game-1',
        name: 'Snooker',
        description: 'Classic snooker game',
        rateType: 'PER_HOUR' as const,
        defaultRate: 100,
        createdAt: new Date().toISOString(),
      };

      await db.games.add(game);
      const stored = await db.games.get('game-1');
      
      expect(stored).toEqual(game);
    });

    it('should retrieve all games', async () => {
      const games = [
        { id: 'game-1', name: 'Snooker', rateType: 'PER_HOUR' as const, defaultRate: 100, createdAt: new Date().toISOString() },
        { id: 'game-2', name: 'Pool', rateType: 'PER_MINUTE' as const, defaultRate: 5, createdAt: new Date().toISOString() },
      ];

      await db.games.bulkAdd(games);
      const allGames = await db.games.toArray();
      
      expect(allGames).toHaveLength(2);
    });

    it('should update a game', async () => {
      const game = {
        id: 'game-1',
        name: 'Snooker',
        rateType: 'PER_HOUR' as const,
        defaultRate: 100,
        createdAt: new Date().toISOString(),
      };

      await db.games.add(game);
      await db.games.update('game-1', { name: 'Updated Snooker' });
      const updated = await db.games.get('game-1');
      
      expect(updated?.name).toBe('Updated Snooker');
    });

    it('should delete a game', async () => {
      const game = {
        id: 'game-1',
        name: 'Snooker',
        rateType: 'PER_HOUR' as const,
        defaultRate: 100,
        createdAt: new Date().toISOString(),
      };

      await db.games.add(game);
      await db.games.delete('game-1');
      const deleted = await db.games.get('game-1');
      
      expect(deleted).toBeUndefined();
    });
  });

  describe('Tables Table', () => {
    it('should store a table', async () => {
      const table = {
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
      };

      await db.tableRecords.add(table);
      const stored = await db.tableRecords.get('table-1');
      
      expect(stored).toEqual(table);
    });

    it('should query tables by gameId', async () => {
      const tables = [
        { id: 'table-1', tableNumber: 1, gameId: 'game-1', status: 'AVAILABLE', ratePerHour: 100, createdAt: new Date().toISOString() },
        { id: 'table-2', tableNumber: 2, gameId: 'game-1', status: 'OCCUPIED', ratePerHour: 100, createdAt: new Date().toISOString() },
        { id: 'table-3', tableNumber: 3, gameId: 'game-2', status: 'AVAILABLE', ratePerHour: 50, createdAt: new Date().toISOString() },
      ];

      await db.tableRecords.bulkAdd(tables);
      const game1Tables = await db.tableRecords.where('gameId').equals('game-1').toArray();
      
      expect(game1Tables).toHaveLength(2);
    });
  });

  describe('Products Table', () => {
    it('should store a product', async () => {
      const product = {
        id: 'product-1',
        name: 'Coca Cola',
        price: 50,
        stock: 100,
        category: 'Beverages',
        createdAt: new Date().toISOString(),
      };

      await db.products.add(product);
      const stored = await db.products.get('product-1');
      
      expect(stored).toEqual(product);
    });
  });

  describe('Sales Table', () => {
    it('should store a sale', async () => {
      const sale = {
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
      };

      await db.sales.add(sale);
      const stored = await db.sales.get('sale-1');
      
      expect(stored).toEqual(sale);
    });
  });

  describe('Queued Requests Table', () => {
    it('should store a queued request', async () => {
      const request = {
        id: 'req-1',
        method: 'POST' as const,
        url: '/tables/table-1/start',
        data: { ratePerHour: 100 },
        timestamp: Date.now(),
        retryCount: 0,
      };

      await db.queuedRequests.add(request);
      const stored = await db.queuedRequests.get('req-1');
      
      expect(stored).toEqual(request);
    });

    it('should retrieve requests sorted by timestamp (FIFO)', async () => {
      const now = Date.now();
      const requests = [
        { id: 'req-1', method: 'POST' as const, url: '/test', data: {}, timestamp: now + 2000, retryCount: 0 },
        { id: 'req-2', method: 'PUT' as const, url: '/test', data: {}, timestamp: now + 1000, retryCount: 0 },
        { id: 'req-3', method: 'DELETE' as const, url: '/test', data: {}, timestamp: now, retryCount: 0 },
      ];

      await db.queuedRequests.bulkAdd(requests);
      const sorted = await db.queuedRequests.orderBy('timestamp').toArray();
      
      expect(sorted[0].id).toBe('req-3');
      expect(sorted[1].id).toBe('req-2');
      expect(sorted[2].id).toBe('req-1');
    });
  });
});

