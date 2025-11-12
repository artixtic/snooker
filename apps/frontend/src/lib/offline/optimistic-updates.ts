/**
 * Optimistic Updates
 * 
 * Helper functions for applying optimistic updates to React Query cache
 * and IndexedDB. Updates are applied immediately before server confirmation.
 */

import { QueryClient } from '@tanstack/react-query';
import { storage } from '../db/storage';
import type { Table, Game, Product, Sale } from '../db/database';

export interface OptimisticUpdate<T> {
  queryKey: any[];
  updateFn: (data: T) => T;
  storageKey?: 'games' | 'tables' | 'products' | 'sales' | 'shifts';
}

/**
 * Apply an optimistic update to both React Query cache and IndexedDB
 */
export async function applyOptimisticUpdate<T>(
  queryClient: QueryClient,
  update: OptimisticUpdate<T>
): Promise<void> {
  // Update React Query cache
  queryClient.setQueryData<T>(update.queryKey, (oldData) => {
    if (!oldData) return oldData;
    return update.updateFn(oldData);
  });

  // Update IndexedDB if storage key is provided
  if (update.storageKey) {
    const currentData = queryClient.getQueryData<T>(update.queryKey);
    if (currentData && Array.isArray(currentData)) {
      const storageMethod = storage[update.storageKey];
      if (storageMethod && 'saveAll' in storageMethod) {
        await (storageMethod as any).saveAll(currentData);
      }
    }
  }
}

/**
 * Create optimistic update for pausing a table
 */
export function createPauseTableUpdate(tableId: string, currentCharge?: number) {
  return {
    queryKey: ['tables'],
    updateFn: (tables: Table[]) => {
      return tables.map((table) => {
        if (table.id === tableId && table.status === 'OCCUPIED') {
          return {
            ...table,
            status: 'PAUSED' as const,
            pausedAt: new Date().toISOString(),
            currentCharge: currentCharge !== undefined ? Math.ceil(currentCharge) : table.currentCharge,
          };
        }
        return table;
      });
    },
    storageKey: 'tables' as const,
  };
}

/**
 * Create optimistic update for resuming a table
 */
export function createResumeTableUpdate(tableId: string) {
  return {
    queryKey: ['tables'],
    updateFn: (tables: Table[]) => {
      return tables.map((table) => {
        if (table.id === tableId && table.status === 'PAUSED') {
          return {
            ...table,
            status: 'OCCUPIED' as const,
            lastResumedAt: new Date().toISOString(),
            pausedAt: null,
          };
        }
        return table;
      });
    },
    storageKey: 'tables' as const,
  };
}

/**
 * Create optimistic update for starting a table
 */
export function createStartTableUpdate(tableId: string, ratePerHour: number) {
  return {
    queryKey: ['tables'],
    updateFn: (tables: Table[]) => {
      return tables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            status: 'OCCUPIED' as const,
            startedAt: new Date().toISOString(),
            ratePerHour,
            pausedAt: null,
            lastResumedAt: null,
            totalPausedMs: 0,
            currentCharge: 0,
          };
        }
        return table;
      });
    },
    storageKey: 'tables' as const,
  };
}

/**
 * Create optimistic update for stopping a table (checkout)
 */
export function createStopTableUpdate(tableId: string) {
  return {
    queryKey: ['tables'],
    updateFn: (tables: Table[]) => {
      return tables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            status: 'AVAILABLE' as const,
            startedAt: null,
            pausedAt: null,
            lastResumedAt: null,
            totalPausedMs: 0,
            currentCharge: 0,
          };
        }
        return table;
      });
    },
    storageKey: 'tables' as const,
  };
}

/**
 * Create optimistic update for adding a sale
 */
export function createAddSaleUpdate(sale: Sale) {
  return {
    queryKey: ['sales'],
    updateFn: (sales: Sale[]) => {
      return [...sales, sale];
    },
    storageKey: 'sales' as const,
  };
}

/**
 * Create optimistic update for adding a sale
 */
export function createSaleUpdate(sale: Sale) {
  return {
    queryKey: ['sales'],
    updateFn: (sales: Sale[]) => {
      return [...sales, sale];
    },
    storageKey: 'sales' as const,
  };
}

/**
 * Create optimistic update for updating product stock
 */
export function createProductStockUpdate(productId: string, quantityChange: number) {
  return {
    queryKey: ['products'],
    updateFn: (products: Product[]) => {
      return products.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            stock: Math.max(0, product.stock + quantityChange),
          };
        }
        return product;
      });
    },
    storageKey: 'products' as const,
  };
}

