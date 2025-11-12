/**
 * TDD Tests for Sync Queue Manager
 * 
 * Tests for the sync queue that processes queued requests when online.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncQueue } from './sync-queue';
import { requestQueueStorage } from './request-queue-storage';
import { db } from './database';
import api from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Sync Queue Manager', () => {
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
    await requestQueueStorage.clear();
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(async () => {
    await requestQueueStorage.clear();
    syncQueue.stopAutoSync();
    try {
      await db.close();
    } catch (e) {
      // Ignore errors
    }
  });

  describe('Queue Processing', () => {
    it('should process queued requests in FIFO order', async () => {
      const callOrder: string[] = [];
      
      (api.post as any).mockImplementation((url: string) => {
        callOrder.push(url);
        return Promise.resolve({ data: {} });
      });

      await requestQueueStorage.queue({
        method: 'POST',
        url: '/first',
        data: {},
      });

      await requestQueueStorage.queue({
        method: 'POST',
        url: '/second',
        data: {},
      });

      await syncQueue.processQueue();

      expect(callOrder[0]).toBe('/first');
      expect(callOrder[1]).toBe('/second');
    });

    it('should remove successfully processed requests', async () => {
      (api.post as any).mockResolvedValue({ data: {} });

      const id1 = await requestQueueStorage.queue({
        method: 'POST',
        url: '/test',
        data: {},
      });

      await syncQueue.processQueue();
      const size = await requestQueueStorage.getSize();

      expect(size).toBe(0);
      const request = await requestQueueStorage.getById(id1);
      expect(request).toBeUndefined();
    });

    it('should increment retry count on failure', async () => {
      (api.post as any).mockRejectedValue(new Error('Network error'));

      const id = await requestQueueStorage.queue({
        method: 'POST',
        url: '/test',
        data: {},
      });

      await syncQueue.processQueue();
      const request = await requestQueueStorage.getById(id);

      expect(request?.retryCount).toBe(1);
    });

    it('should not process queue when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      await requestQueueStorage.queue({
        method: 'POST',
        url: '/test',
        data: {},
      });

      await syncQueue.processQueue();
      const size = await requestQueueStorage.getSize();

      expect(size).toBe(1);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should stop processing if goes offline during sync', async () => {
      let callCount = 0;
      (api.post as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Simulate going offline after first request
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
          });
        }
        return Promise.resolve({ data: {} });
      });

      await requestQueueStorage.queue({
        method: 'POST',
        url: '/first',
        data: {},
      });

      await requestQueueStorage.queue({
        method: 'POST',
        url: '/second',
        data: {},
      });

      await syncQueue.processQueue();

      expect(callCount).toBe(1);
    });
  });

  describe('Auto Sync', () => {
    it('should start auto sync when online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });

      (api.post as any).mockResolvedValue({ data: {} });

      await requestQueueStorage.queue({
        method: 'POST',
        url: '/test',
        data: {},
      });

      syncQueue.startAutoSync(100); // Check every 100ms

      // Wait for auto sync to process
      await new Promise(resolve => setTimeout(resolve, 200));

      syncQueue.stopAutoSync();
      const size = await requestQueueStorage.getSize();

      expect(size).toBe(0);
    });

    it('should stop auto sync when called', async () => {
      syncQueue.startAutoSync(100);
      syncQueue.stopAutoSync();

      // Verify it's stopped (no processing should happen)
      await requestQueueStorage.queue({
        method: 'POST',
        url: '/test',
        data: {},
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const size = await requestQueueStorage.getSize();
      expect(size).toBe(1); // Should still be queued
    });
  });

  describe('Status Tracking', () => {
    it('should track processing state', async () => {
      expect(syncQueue.isProcessing()).toBe(false);

      const processPromise = syncQueue.processQueue();
      expect(syncQueue.isProcessing()).toBe(true);

      await processPromise;
      expect(syncQueue.isProcessing()).toBe(false);
    });

    it('should notify listeners of processing state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = syncQueue.subscribe(listener);

      await requestQueueStorage.queue({
        method: 'POST',
        url: '/test',
        data: {},
      });

      (api.post as any).mockResolvedValue({ data: {} });

      await syncQueue.processQueue();

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });
  });
});

