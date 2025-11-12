/**
 * Offline API Wrapper
 * 
 * Wraps the regular API client to provide offline functionality:
 * - Caches GET responses in IndexedDB
 * - Serves cached data when offline
 * - Queues mutations (POST, PUT, PATCH, DELETE) when offline
 */

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { axiosInstance } from '@/lib/api';
import { storage } from '../db/storage';
import { requestQueueStorage } from '../db/request-queue-storage';
import type { Game, Table, Product, Sale, Shift } from '../db/database';

/**
 * Map API endpoints to storage methods
 */
const getStorageForUrl = (url: string) => {
  if (url === '/games' || url.startsWith('/games')) {
    return { storage: storage.games, type: 'games' as const };
  }
  if (url === '/tables' || url.startsWith('/tables')) {
    return { storage: storage.tables, type: 'tables' as const };
  }
  if (url === '/products' || url.startsWith('/products')) {
    return { storage: storage.products, type: 'products' as const };
  }
  if (url.startsWith('/sales')) {
    return { storage: storage.sales, type: 'sales' as const };
  }
  if (url === '/shifts' || url.startsWith('/shifts')) {
    return { storage: storage.shifts, type: 'shifts' as const };
  }
  return null;
};

/**
 * Offline API wrapper
 */
export const offlineApi = {
  /**
   * GET request - cache responses and serve from cache when offline
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check both actual offline status and simulated offline mode
    const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);

    // If offline, try to serve from cache
    if (isOffline) {
      const storageInfo = getStorageForUrl(url);
      if (storageInfo) {
        const cached = await storageInfo.storage.getAll();
        if (cached.length > 0) {
          return {
            data: cached as T,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config: config as any,
          } as AxiosResponse<T>;
        }
      }
      throw new Error('Network request failed: Offline and no cached data available');
    }

    // Online - fetch from API and cache
    try {
      const response = await axiosInstance.get<T>(url, config);
      
      // Cache successful responses
      if (response.status === 200) {
        const storageInfo = getStorageForUrl(url);
        if (storageInfo && Array.isArray(response.data)) {
          await storageInfo.storage.saveAll(response.data);
        }
      }
      
      return response;
    } catch (error: any) {
      // On error, try to serve from cache
      const storageInfo = getStorageForUrl(url);
      if (storageInfo) {
        const cached = await storageInfo.storage.getAll();
        if (cached.length > 0) {
          return {
            data: cached as T,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config: config as any,
          } as AxiosResponse<T>;
        }
      }
      throw error;
    }
  },

  /**
   * POST request - queue when offline
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check both actual offline status and simulated offline mode
    const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);

    if (isOffline) {
      const requestId = await requestQueueStorage.queue({
        method: 'POST',
        url,
        data,
        config,
      });
      
      return {
        data: { queued: true, requestId } as any,
        status: 202,
        statusText: 'Accepted',
        headers: {},
        config: config as any,
      } as AxiosResponse<T>;
    }

    // Online - try to make request, queue on failure
    try {
      return await axiosInstance.post<T>(url, data, config);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        const requestId = await requestQueueStorage.queue({
          method: 'POST',
          url,
          data,
          config,
        });
        
        return {
          data: { queued: true, requestId } as any,
          status: 202,
          statusText: 'Accepted',
          headers: {},
          config: config as any,
        } as AxiosResponse<T>;
      }
      throw error;
    }
  },

  /**
   * PUT request - queue when offline
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check both actual offline status and simulated offline mode
    const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);

    if (isOffline) {
      const requestId = await requestQueueStorage.queue({
        method: 'PUT',
        url,
        data,
        config,
      });
      
      return {
        data: { queued: true, requestId } as any,
        status: 202,
        statusText: 'Accepted',
        headers: {},
        config: config as any,
      } as AxiosResponse<T>;
    }

    try {
      return await axiosInstance.put<T>(url, data, config);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        const requestId = await requestQueueStorage.queue({
          method: 'PUT',
          url,
          data,
          config,
        });
        
        return {
          data: { queued: true, requestId } as any,
          status: 202,
          statusText: 'Accepted',
          headers: {},
          config: config as any,
        } as AxiosResponse<T>;
      }
      throw error;
    }
  },

  /**
   * PATCH request - queue when offline
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check both actual offline status and simulated offline mode
    const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);

    if (isOffline) {
      const requestId = await requestQueueStorage.queue({
        method: 'PATCH',
        url,
        data,
        config,
      });
      
      return {
        data: { queued: true, requestId } as any,
        status: 202,
        statusText: 'Accepted',
        headers: {},
        config: config as any,
      } as AxiosResponse<T>;
    }

    try {
      return await axiosInstance.patch<T>(url, data, config);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        const requestId = await requestQueueStorage.queue({
          method: 'PATCH',
          url,
          data,
          config,
        });
        
        return {
          data: { queued: true, requestId } as any,
          status: 202,
          statusText: 'Accepted',
          headers: {},
          config: config as any,
        } as AxiosResponse<T>;
      }
      throw error;
    }
  },

  /**
   * DELETE request - queue when offline
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check both actual offline status and simulated offline mode
    const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);

    if (isOffline) {
      const requestId = await requestQueueStorage.queue({
        method: 'DELETE',
        url,
        config,
      });
      
      return {
        data: { queued: true, requestId } as any,
        status: 202,
        statusText: 'Accepted',
        headers: {},
        config: config as any,
      } as AxiosResponse<T>;
    }

    try {
      return await axiosInstance.delete<T>(url, config);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        const requestId = await requestQueueStorage.queue({
          method: 'DELETE',
          url,
          config,
        });
        
        return {
          data: { queued: true, requestId } as any,
          status: 202,
          statusText: 'Accepted',
          headers: {},
          config: config as any,
        } as AxiosResponse<T>;
      }
      throw error;
    }
  },
};

