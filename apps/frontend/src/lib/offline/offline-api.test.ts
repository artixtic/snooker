/**
 * TDD Tests for Offline API Wrapper
 * 
 * Tests for the API wrapper that integrates with IndexedDB storage
 * and request queuing for offline functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineApi } from './offline-api';
import { storage } from '../db/storage';
import { requestQueueStorage } from '../db/request-queue-storage';
import { db } from '../db/database';
import api from '@/lib/api';

// Mock the regular API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Offline API Wrapper', () => {
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
    vi.clearAllMocks();
    
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(async () => {
    try {
      await db.close();
    } catch (e) {
      // Ignore errors
    }
  });

  describe('GET Requests (Read Operations)', () => {
    it('should fetch from API when online and cache response', async () => {
      const games = [{ id: 'game-1', name: 'Snooker', rateType: 'PER_HOUR', defaultRate: 100, createdAt: new Date().toISOString() }];
      (api.get as any).mockResolvedValue({ 
        data: games,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const response = await offlineApi.get('/games');

      expect(api.get).toHaveBeenCalledWith('/games', undefined);
      expect(response.data).toEqual(games);
      
      // Verify cached in IndexedDB
      const cached = await storage.games.getAll();
      expect(cached).toHaveLength(1);
    });

    it('should serve from IndexedDB when offline', async () => {
      // First, cache some data
      const games = [{ id: 'game-1', name: 'Snooker', rateType: 'PER_HOUR', defaultRate: 100, createdAt: new Date().toISOString() }];
      await storage.games.saveAll(games);

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const response = await offlineApi.get('/games');

      expect(api.get).not.toHaveBeenCalled();
      expect(response.data).toEqual(games);
    });

    it('should fallback to cache on network error', async () => {
      const games = [{ id: 'game-1', name: 'Snooker', rateType: 'PER_HOUR', defaultRate: 100, createdAt: new Date().toISOString() }];
      await storage.games.saveAll(games);
      (api.get as any).mockRejectedValue(new Error('Network error'));

      const response = await offlineApi.get('/games');

      expect(response.data).toEqual(games);
    });
  });

  describe('POST Requests (Mutations)', () => {
    it('should make API call when online', async () => {
      (api.post as any).mockResolvedValue({ data: { id: 'table-1' } });

      const response = await offlineApi.post('/tables', { tableNumber: 1 });

      expect(api.post).toHaveBeenCalledWith('/tables', { tableNumber: 1 }, undefined);
      expect(response.data.id).toBe('table-1');
    });

    it('should queue request when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const response = await offlineApi.post('/tables', { tableNumber: 1 });

      expect(api.post).not.toHaveBeenCalled();
      expect(response.status).toBe(202);
      expect(response.data.queued).toBe(true);
      
      const queueSize = await requestQueueStorage.getSize();
      expect(queueSize).toBe(1);
    });

    it('should queue request on network error', async () => {
      (api.post as any).mockRejectedValue({ code: 'ERR_NETWORK' });

      const response = await offlineApi.post('/tables', { tableNumber: 1 });

      expect(response.status).toBe(202);
      expect(response.data.queued).toBe(true);
    });
  });

  describe('PUT/PATCH/DELETE Requests', () => {
    it('should queue PUT requests when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      await offlineApi.put('/tables/table-1', { status: 'PAUSED' });

      const queueSize = await requestQueueStorage.getSize();
      expect(queueSize).toBe(1);
    });

    it('should queue DELETE requests when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      await offlineApi.delete('/tables/table-1');

      const queueSize = await requestQueueStorage.getSize();
      expect(queueSize).toBe(1);
    });
  });
});

