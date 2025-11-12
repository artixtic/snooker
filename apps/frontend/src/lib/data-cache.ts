// Data cache manager for offline-first functionality
// Stores critical data in localStorage so it's available when offline

export interface CachedData {
  data: any;
  timestamp: number;
  version?: string;
}

const CACHE_PREFIX = 'snooker_cache_';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class DataCache {
  /**
   * Get cached data for a key
   */
  get<T = any>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const parsed: CachedData = JSON.parse(cached);
      
      // Check if cache is expired
      const age = Date.now() - parsed.timestamp;
      if (age > CACHE_EXPIRY) {
        this.remove(key);
        return null;
      }

      return parsed.data as T;
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data for a key
   */
  set(key: string, data: any): void {
    if (typeof window === 'undefined') return;

    try {
      const cached: CachedData = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
    } catch (error) {
      console.error(`Error saving cache for ${key}:`, error);
      // If storage is full, try to clear old caches
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldCaches();
        try {
          const cached: CachedData = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION,
          };
          localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
        } catch (retryError) {
          console.error(`Failed to save cache after cleanup:`, retryError);
        }
      }
    }
  }

  /**
   * Remove cached data for a key
   */
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear old caches to free up space
   */
  private clearOldCaches(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    const caches: Array<{ key: string; timestamp: number }> = [];

    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed: CachedData = JSON.parse(cached);
            caches.push({
              key,
              timestamp: parsed.timestamp,
            });
          }
        } catch (error) {
          // Invalid cache, remove it
          localStorage.removeItem(key);
        }
      }
    });

    // Sort by timestamp (oldest first) and remove oldest 50%
    caches.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.floor(caches.length / 2);
    caches.slice(0, toRemove).forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    if (typeof window === 'undefined') return [];

    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(CACHE_PREFIX))
      .map(key => key.replace(CACHE_PREFIX, ''));
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const dataCache = new DataCache();

// Cache keys for different data types
export const CACHE_KEYS = {
  GAMES: 'games',
  TABLES: 'tables',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  SHIFTS: 'shifts',
  USERS: 'users',
  SALES: 'sales',
  EXPENSES: 'expenses',
} as const;

