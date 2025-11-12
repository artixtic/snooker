/**
 * Logout Utilities
 * 
 * Provides functions to clear all user data on logout:
 * - localStorage items
 */

/**
 * Clear all application data (localStorage)
 */
export async function clearAllData(): Promise<void> {
  try {
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

    console.log('✅ All application data cleared');
  } catch (error) {
    console.error('Error clearing application data:', error);
    localStorage.clear();
  }
}

