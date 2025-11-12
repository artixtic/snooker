/**
 * Logout Utilities
 * 
 * Provides functions to clear all user data on logout:
 * - localStorage items
 * - IndexedDB data
 * - React Query cache
 */

import { db } from './db/database';
import { storage } from './db/storage';
import { requestQueueStorage } from './db/request-queue-storage';
import { dataCache } from './data-cache';

/**
 * Clear all application data (localStorage and IndexedDB)
 */
export async function clearAllData(): Promise<void> {
  try {
    // Clear IndexedDB stores
    await Promise.all([
      storage.games.clear(),
      storage.tables.clear(),
      storage.products.clear(),
      storage.sales.clear(),
      storage.shifts.clear(),
      requestQueueStorage.clear(),
    ]);

    // Clear localStorage items
    // Remove all items that start with our cache prefix
    const cachePrefix = 'snooker_cache_';
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(cachePrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear cart storage (zustand persists to localStorage)
    localStorage.removeItem('snooker-pos-cart');

    // Clear specific localStorage items
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('client_id');
    localStorage.removeItem('devMode');

    // Clear data cache
    dataCache.clear();

    console.log('✅ All application data cleared');
  } catch (error) {
    console.error('Error clearing application data:', error);
    // Even if IndexedDB clearing fails, still clear localStorage
    localStorage.clear();
  }
}

/**
 * Check if the application is offline
 */
export function isOffline(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check both actual offline status and simulated offline mode
  const isOffline = !navigator.onLine || (window as any).__forceOfflineMode === true;
  return isOffline;
}

