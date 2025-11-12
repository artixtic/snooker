/**
 * TDD Tests for Request Queue Storage
 * 
 * Tests for storing and managing queued API requests for offline sync.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { requestQueueStorage } from './request-queue-storage';
import { db } from './database';
import type { QueuedRequest } from './database';

describe('Request Queue Storage', () => {
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
    await db.queuedRequests.clear();
  });

  afterEach(async () => {
    await db.queuedRequests.clear();
    try {
      await db.close();
    } catch (e) {
      // Ignore errors
    }
  });

  describe('Queue Request', () => {
    it('should queue a POST request', async () => {
      const request = {
        method: 'POST' as const,
        url: '/tables/table-1/start',
        data: { ratePerHour: 100 },
      };

      const id = await requestQueueStorage.queue(request);
      
      expect(id).toBeDefined();
      const stored = await db.queuedRequests.get(id);
      expect(stored?.method).toBe('POST');
      expect(stored?.url).toBe('/tables/table-1/start');
    });

    it('should queue a PUT request', async () => {
      const request = {
        method: 'PUT' as const,
        url: '/tables/table-1',
        data: { status: 'PAUSED' },
      };

      const id = await requestQueueStorage.queue(request);
      const stored = await db.queuedRequests.get(id);
      
      expect(stored?.method).toBe('PUT');
    });

    it('should queue a DELETE request', async () => {
      const request = {
        method: 'DELETE' as const,
        url: '/tables/table-1',
      };

      const id = await requestQueueStorage.queue(request);
      const stored = await db.queuedRequests.get(id);
      
      expect(stored?.method).toBe('DELETE');
    });

    it('should include timestamp when queuing', async () => {
      const request = {
        method: 'POST' as const,
        url: '/test',
        data: {},
      };

      const beforeTime = Date.now();
      const id = await requestQueueStorage.queue(request);
      const afterTime = Date.now();
      const stored = await db.queuedRequests.get(id);
      
      expect(stored?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(stored?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should initialize retryCount to 0', async () => {
      const request = {
        method: 'POST' as const,
        url: '/test',
        data: {},
      };

      const id = await requestQueueStorage.queue(request);
      const stored = await db.queuedRequests.get(id);
      
      expect(stored?.retryCount).toBe(0);
    });
  });

  describe('Get Queued Requests', () => {
    it('should get all queued requests sorted by timestamp (FIFO)', async () => {
      const now = Date.now();
      const requests = [
        {
          id: 'req-1',
          method: 'POST' as const,
          url: '/test',
          data: {},
          timestamp: now + 2000,
          retryCount: 0,
        },
        {
          id: 'req-2',
          method: 'PUT' as const,
          url: '/test',
          data: {},
          timestamp: now + 1000,
          retryCount: 0,
        },
        {
          id: 'req-3',
          method: 'DELETE' as const,
          url: '/test',
          timestamp: now,
          retryCount: 0,
        },
      ];

      await db.queuedRequests.bulkAdd(requests);
      const queued = await requestQueueStorage.getAll();
      
      expect(queued).toHaveLength(3);
      expect(queued[0].id).toBe('req-3'); // Oldest first
      expect(queued[1].id).toBe('req-2');
      expect(queued[2].id).toBe('req-1');
    });

    it('should return empty array when no requests queued', async () => {
      const queued = await requestQueueStorage.getAll();
      
      expect(queued).toHaveLength(0);
    });
  });

  describe('Remove Request', () => {
    it('should remove a queued request', async () => {
      const request = {
        method: 'POST' as const,
        url: '/test',
        data: {},
      };

      const id = await requestQueueStorage.queue(request);
      await requestQueueStorage.remove(id);
      const stored = await db.queuedRequests.get(id);
      
      expect(stored).toBeUndefined();
    });

    it('should not throw when removing non-existent request', async () => {
      await expect(requestQueueStorage.remove('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Increment Retry Count', () => {
    it('should increment retry count', async () => {
      const request = {
        method: 'POST' as const,
        url: '/test',
        data: {},
      };

      const id = await requestQueueStorage.queue(request);
      const count1 = await requestQueueStorage.incrementRetryCount(id);
      const count2 = await requestQueueStorage.incrementRetryCount(id);
      
      expect(count1).toBe(1);
      expect(count2).toBe(2);
      
      const stored = await db.queuedRequests.get(id);
      expect(stored?.retryCount).toBe(2);
    });

    it('should return 0 if request does not exist', async () => {
      const count = await requestQueueStorage.incrementRetryCount('non-existent');
      
      expect(count).toBe(0);
    });
  });

  describe('Get Queue Size', () => {
    it('should return correct queue size', async () => {
      const requests = [
        { method: 'POST' as const, url: '/test1', data: {} },
        { method: 'POST' as const, url: '/test2', data: {} },
        { method: 'POST' as const, url: '/test3', data: {} },
      ];

      for (const req of requests) {
        await requestQueueStorage.queue(req);
      }

      const size = await requestQueueStorage.getSize();
      
      expect(size).toBe(3);
    });

    it('should return 0 when queue is empty', async () => {
      const size = await requestQueueStorage.getSize();
      
      expect(size).toBe(0);
    });
  });

  describe('Clear Queue', () => {
    it('should clear all queued requests', async () => {
      const requests = [
        { method: 'POST' as const, url: '/test1', data: {} },
        { method: 'POST' as const, url: '/test2', data: {} },
      ];

      for (const req of requests) {
        await requestQueueStorage.queue(req);
      }

      await requestQueueStorage.clear();
      const size = await requestQueueStorage.getSize();
      
      expect(size).toBe(0);
    });
  });
});

