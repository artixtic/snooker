/**
 * Sync Queue Manager
 * 
 * Manages processing of queued requests when the app comes online.
 * Processes requests in FIFO order and handles retries.
 */

import { requestQueueStorage } from './request-queue-storage';
import api from '@/lib/api';
import { QueryClient } from '@tanstack/react-query';

// Get QueryClient instance - we'll need to pass it or get it from context
let queryClientInstance: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClientInstance = client;
}

type SyncListener = (isProcessing: boolean) => void;

/**
 * Sync Queue Manager
 */
class SyncQueue {
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private isProcessingQueue = false;
  private listeners: Set<SyncListener> = new Set();
  private maxRetries = 3;

  /**
   * Process all queued requests in FIFO order
   */
  async processQueue(): Promise<void> {
    // Don't process if already processing or offline (including simulated offline)
    const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);
    if (this.isProcessingQueue || isOffline) {
      return;
    }

    this.isProcessingQueue = true;
    this.notifyListeners(true);

    try {
      const requests = await requestQueueStorage.getAll();

      if (requests.length === 0) {
        this.isProcessingQueue = false;
        this.notifyListeners(false);
        return;
      }

      console.log(`🔄 Processing ${requests.length} queued requests in FIFO order...`);

      const initialQueueSize = requests.length;
      let processedCount = 0;
      let failedCount = 0;

      // Dispatch start event with total count
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syncStart', { 
          detail: { total: initialQueueSize } 
        }));
      }

      for (const request of requests) {
        // Stop if went offline during processing (including simulated offline)
        const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);
        if (isOffline) {
          console.log('⚠️ Went offline during queue processing, stopping sync');
          break;
        }

        try {
          await this.processRequest(request);
          await requestQueueStorage.remove(request.id);
          processedCount++;
          console.log(`✅ Processed request ${processedCount}/${requests.length}: ${request.method} ${request.url}`);
          
          // Dispatch progress event for UI updates
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncProgress', { 
              detail: { processed: processedCount, total: requests.length } 
            }));
          }
        } catch (error: any) {
          console.error(`❌ Failed to process request ${request.id}:`, error);
          failedCount++;
          const retryCount = await requestQueueStorage.incrementRetryCount(request.id);
          
          if (retryCount >= this.maxRetries) {
            console.warn(`⚠️ Request ${request.id} exceeded max retries, removing from queue`);
            await requestQueueStorage.remove(request.id);
          }
        }
      }

      // Remove failed requests that exceeded max retries
      await requestQueueStorage.removeFailed(this.maxRetries);

      const remaining = await requestQueueStorage.getSize();
      if (remaining > 0) {
        console.log(`⚠️ ${remaining} requests still in queue after processing (${processedCount} succeeded, ${failedCount} failed)`);
      } else {
        console.log(`✅ All queued requests processed successfully (${processedCount} total)`);
        this.notifySyncComplete();
      }

      // Invalidate queries to sync UI with server state after queue processing
      // This ensures the UI reflects the actual server state after all optimistic updates
      if (queryClientInstance && processedCount > 0) {
        console.log('🔄 Invalidating queries to sync UI with server state...');
        await queryClientInstance.invalidateQueries({ queryKey: ['tables'] });
        await queryClientInstance.invalidateQueries({ queryKey: ['sales'] });
        await queryClientInstance.invalidateQueries({ queryKey: ['products'] });
        console.log('✅ Queries invalidated, UI will refresh with server state');
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessingQueue = false;
      this.notifyListeners(false);
    }
  }

  /**
   * Process a single request
   */
  private async processRequest(request: any): Promise<void> {
    const { method, url, data, config } = request;

    console.log(`🔄 Processing queued request: ${method} ${url}`, { data, config });

    try {
      let response;
      switch (method) {
        case 'POST':
          response = await api.post(url, data, config);
          break;
        case 'PUT':
          response = await api.put(url, data, config);
          break;
        case 'PATCH':
          response = await api.patch(url, data, config);
          break;
        case 'DELETE':
          response = await api.delete(url, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      console.log(`✅ Request processed successfully: ${method} ${url}`, response?.data);
      return response;
    } catch (error: any) {
      console.error(`❌ Request failed: ${method} ${url}`, error?.response?.data || error?.message);
      throw error;
    }
  }

  /**
   * Start automatic sync (checks queue periodically)
   */
  startAutoSync(intervalMs: number = 5000): void {
    if (this.autoSyncInterval) {
      this.stopAutoSync();
    }

    // Process immediately if online (and not in simulated offline mode)
    const isOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);
    if (!isOffline) {
      this.processQueue().catch(console.error);
    }

    // Then set up periodic checks
    this.autoSyncInterval = setInterval(() => {
      const isCurrentlyOffline = !navigator.onLine || (typeof window !== 'undefined' && (window as any).__forceOfflineMode === true);
      if (!isCurrentlyOffline && !this.isProcessingQueue) {
        this.processQueue().catch(console.error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  /**
   * Check if queue is currently processing
   */
  isProcessing(): boolean {
    return this.isProcessingQueue;
  }

  /**
   * Subscribe to processing state changes
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(isProcessing: boolean): void {
    this.listeners.forEach(listener => listener(isProcessing));
  }

  /**
   * Notify that sync is complete
   */
  private notifySyncComplete(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('syncComplete'));
    }
  }
}

export const syncQueue = new SyncQueue();

