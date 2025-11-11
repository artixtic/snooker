// Offline-first API utilities
import api from './api';
import { db } from './db';
import { addToSyncQueue } from './sync';

/**
 * Offline-first API call that:
 * 1. Tries to call the server if online
 * 2. Falls back to IndexedDB if offline
 * 3. Queues for sync if offline
 */
export async function offlineApiCall<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  options?: {
    entity?: string;
    action?: 'create' | 'update' | 'delete';
    localId?: string;
    transformResponse?: (data: any) => T;
  }
): Promise<T> {
  const isOnline = navigator.onLine;

  // If online, try to call the server
  if (isOnline) {
    try {
      let response;
      switch (method) {
        case 'GET':
          response = await api.get(url);
          break;
        case 'POST':
          response = await api.post(url, data);
          break;
        case 'PATCH':
          response = await api.patch(url, data);
          break;
        case 'DELETE':
          response = await api.delete(url);
          break;
      }

      const result = options?.transformResponse 
        ? options.transformResponse(response.data) 
        : response.data;

      // Also save to local DB for offline access
      if (method === 'GET' && options?.entity) {
        await saveToLocalDB(options.entity, result);
      }

      return result;
    } catch (error: any) {
      // If error and we have offline fallback, use it
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        return await offlineFallback(method, url, data, options);
      }
      throw error;
    }
  }

  // Offline: use local DB
  return await offlineFallback(method, url, data, options);
}

async function offlineFallback<T>(
  method: string,
  url: string,
  data?: any,
  options?: any
): Promise<T> {
  // For GET requests, try to get from local DB
  if (method === 'GET' && options?.entity) {
    const localData = await getFromLocalDB(options.entity, url);
    if (localData) {
      return localData as T;
    }
  }

  // For mutations (POST, PATCH, DELETE), save to local DB and queue for sync
  if (['POST', 'PATCH', 'DELETE'].includes(method) && options?.entity && options?.action) {
    const localId = options.localId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save to local DB
    await saveToLocalDB(options.entity, { ...data, id: localId }, options.action);

    // Queue for sync
    if (options.entity && options.action) {
      await addToSyncQueue(options.entity, options.action, localId, data);
    }

    return { ...data, id: localId, synced: false } as T;
  }

  throw new Error('Offline operation not supported for this endpoint');
}

async function saveToLocalDB(entity: string, data: any, action?: string) {
  if (Array.isArray(data)) {
    // Bulk save
    for (const item of data) {
      await saveSingleToLocalDB(entity, item);
    }
  } else {
    await saveSingleToLocalDB(entity, data);
  }
}

async function saveSingleToLocalDB(entity: string, item: any) {
  switch (entity) {
    case 'product':
      await db.products.put(item);
      break;
    case 'sale':
      await db.sales.put({ ...item, synced: false });
      break;
    case 'table':
      await db.tables.put(item);
      break;
    case 'shift':
      await db.shifts.put(item);
      break;
    case 'game':
      await db.games.put(item);
      break;
    case 'expense':
      await db.expenses.put(item);
      break;
  }
}

async function getFromLocalDB(entity: string, url: string): Promise<any> {
  // Parse URL to determine what to fetch
  if (url.includes('/products')) {
    if (url.includes('/products/')) {
      // Single product
      const id = url.split('/products/')[1].split('?')[0];
      return await db.products.get(id);
    } else {
      // All products
      return await db.products.where('deleted').equals(0).toArray();
    }
  }

  if (url.includes('/tables')) {
    if (url.includes('/tables/')) {
      const id = url.split('/tables/')[1].split('?')[0];
      return await db.tables.get(id);
    } else {
      return await db.tables.toArray();
    }
  }

  if (url.includes('/shifts')) {
    if (url.includes('/shifts/')) {
      const id = url.split('/shifts/')[1].split('?')[0];
      return await db.shifts.get(id);
    } else {
      return await db.shifts.toArray();
    }
  }

  if (url.includes('/games')) {
    if (url.includes('/games/')) {
      const id = url.split('/games/')[1].split('?')[0];
      return await db.games.get(id);
    } else {
      return await db.games.where('isActive').equals(1).toArray();
    }
  }

  if (url.includes('/sales')) {
    if (url.includes('/sales/')) {
      const id = url.split('/sales/')[1].split('?')[0];
      return await db.sales.get(id);
    } else {
      return await db.sales.toArray();
    }
  }

  return null;
}

/**
 * Initialize offline data by pulling from server
 */
export async function initializeOfflineData() {
  if (!navigator.onLine) return;
  
  // Check if user is authenticated
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.warn('Cannot initialize offline data: User not authenticated');
    return;
  }

  try {
    // Pull initial data from server
    const [products, games, tables, shifts] = await Promise.all([
      api.get('/products').catch((err) => {
        if (err.response?.status === 401) {
          console.warn('Authentication required for products');
        }
        return { data: [] };
      }),
      api.get('/games').catch((err) => {
        if (err.response?.status === 401) {
          console.warn('Authentication required for games');
        }
        return { data: [] };
      }),
      api.get('/tables').catch((err) => {
        if (err.response?.status === 401) {
          console.warn('Authentication required for tables');
        }
        return { data: [] };
      }),
      api.get('/shifts?status=ACTIVE').catch((err) => {
        if (err.response?.status === 401) {
          console.warn('Authentication required for shifts');
        }
        return { data: [] };
      }),
    ]);

    // Save to local DB
    if (products.data) {
      for (const product of products.data) {
        await db.products.put(product);
      }
    }

    if (games.data) {
      for (const game of games.data) {
        await db.games.put(game);
      }
    }

    if (tables.data) {
      for (const table of tables.data) {
        await db.tables.put(table);
      }
    }

    if (shifts.data) {
      for (const shift of shifts.data) {
        await db.shifts.put(shift);
      }
    }
  } catch (error) {
    console.error('Failed to initialize offline data:', error);
  }
}

