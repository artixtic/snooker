/**
 * Request Queue Storage
 * 
 * Manages queued API requests for offline synchronization.
 * Stores requests in IndexedDB and provides FIFO ordering.
 */

import { db } from './database';
import type { QueuedRequest } from './database';

export interface QueueRequestInput {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  config?: any;
}

/**
 * Request Queue Storage Service
 */
class RequestQueueStorage {
  /**
   * Queue a request for later processing
   */
  async queue(request: QueueRequestInput): Promise<string> {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedRequest: QueuedRequest = {
      id,
      method: request.method,
      url: request.url,
      data: request.data,
      config: request.config,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await db.queuedRequests.add(queuedRequest);
    return id;
  }

  /**
   * Get all queued requests sorted by timestamp (FIFO - oldest first)
   */
  async getAll(): Promise<QueuedRequest[]> {
    return await db.queuedRequests.orderBy('timestamp').toArray();
  }

  /**
   * Get a queued request by id
   */
  async getById(id: string): Promise<QueuedRequest | undefined> {
    return await db.queuedRequests.get(id);
  }

  /**
   * Remove a queued request
   */
  async remove(id: string): Promise<void> {
    await db.queuedRequests.delete(id);
  }

  /**
   * Increment retry count for a request
   */
  async incrementRetryCount(id: string): Promise<number> {
    const request = await db.queuedRequests.get(id);
    if (!request) {
      return 0;
    }

    const newCount = request.retryCount + 1;
    await db.queuedRequests.update(id, { retryCount: newCount });
    return newCount;
  }

  /**
   * Get the current queue size
   */
  async getSize(): Promise<number> {
    return await db.queuedRequests.count();
  }

  /**
   * Clear all queued requests
   */
  async clear(): Promise<void> {
    await db.queuedRequests.clear();
  }

  /**
   * Remove requests that have exceeded max retries
   */
  async removeFailed(maxRetries: number = 3): Promise<number> {
    // Get all requests and filter in memory to avoid index issues
    const allRequests = await db.queuedRequests.toArray();
    const failed = allRequests.filter(r => r.retryCount > maxRetries);
    
    const ids = failed.map(r => r.id);
    if (ids.length > 0) {
      await db.queuedRequests.bulkDelete(ids);
    }
    
    return ids.length;
  }
}

export const requestQueueStorage = new RequestQueueStorage();

