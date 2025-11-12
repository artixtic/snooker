/**
 * TDD Tests for Optimistic Updates
 * 
 * Tests for optimistic update helpers that update React Query cache
 * and IndexedDB immediately before server confirmation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { applyOptimisticUpdate } from './optimistic-updates';
import { storage } from '../db/storage';
import { db } from '../db/database';
import type { Table, Game } from '../db/database';

describe('Optimistic Updates', () => {
  let queryClient: QueryClient;

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
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('Table Updates', () => {
    it('should optimistically update table status to PAUSED', async () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          tableNumber: 1,
          gameId: 'game-1',
          status: 'OCCUPIED',
          ratePerHour: 100,
          startedAt: new Date().toISOString(),
          pausedAt: null,
          lastResumedAt: null,
          totalPausedMs: 0,
          currentCharge: 50,
          createdAt: new Date().toISOString(),
        },
      ];

      queryClient.setQueryData(['tables'], tables);
      await storage.tables.saveAll(tables);

      await applyOptimisticUpdate(queryClient, {
        queryKey: ['tables'],
        updateFn: (data: Table[]) => {
          return data.map(table =>
            table.id === 'table-1'
              ? { ...table, status: 'PAUSED' as const, pausedAt: new Date().toISOString() }
              : table
          );
        },
        storageKey: 'tables',
      });

      const updated = queryClient.getQueryData<Table[]>(['tables']);
      expect(updated?.[0].status).toBe('PAUSED');
      
      // Verify IndexedDB was updated
      const dbTable = await storage.tables.getById('table-1');
      expect(dbTable?.status).toBe('PAUSED');
    });

    it('should optimistically update table status to OCCUPIED', async () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          tableNumber: 1,
          gameId: 'game-1',
          status: 'PAUSED',
          ratePerHour: 100,
          startedAt: new Date().toISOString(),
          pausedAt: new Date().toISOString(),
          lastResumedAt: null,
          totalPausedMs: 0,
          currentCharge: 50,
          createdAt: new Date().toISOString(),
        },
      ];

      queryClient.setQueryData(['tables'], tables);
      await storage.tables.saveAll(tables);

      await applyOptimisticUpdate(queryClient, {
        queryKey: ['tables'],
        updateFn: (data: Table[]) => {
          return data.map(table =>
            table.id === 'table-1'
              ? { ...table, status: 'OCCUPIED' as const, lastResumedAt: new Date().toISOString(), pausedAt: null }
              : table
          );
        },
        storageKey: 'tables',
      });

      const updated = queryClient.getQueryData<Table[]>(['tables']);
      expect(updated?.[0].status).toBe('OCCUPIED');
    });
  });

  describe('Sale Creation', () => {
    it('should optimistically add a sale', async () => {
      const sales: any[] = [];
      queryClient.setQueryData(['sales'], sales);
      await storage.sales.saveAll(sales);

      const newSale = {
        id: 'sale-1',
        tableId: 'table-1',
        subtotal: 100,
        tax: 15,
        total: 115,
        paymentMethod: 'CASH' as const,
        cashReceived: 120,
        change: 5,
        items: [],
        createdAt: new Date().toISOString(),
      };

      await applyOptimisticUpdate(queryClient, {
        queryKey: ['sales'],
        updateFn: (data: any[]) => {
          return [...data, newSale];
        },
        storageKey: 'sales',
      });

      const updated = queryClient.getQueryData<any[]>(['sales']);
      expect(updated).toHaveLength(1);
      expect(updated?.[0].id).toBe('sale-1');
    });
  });
});

