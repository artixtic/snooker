// Hook to initialize app data on startup
// Fetches all critical data and stores it in IndexedDB for offline use

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { storage } from '@/lib/db/storage';
import { dataCache, CACHE_KEYS } from '@/lib/data-cache';

export function useAppInitialization() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const initializeData = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return; // Don't fetch data if not authenticated
      }

      try {
        // Fetch all critical data in parallel
        const [gamesRes, tablesRes, productsRes, shiftsRes] = await Promise.allSettled([
          api.get('/games').catch(() => null),
          api.get('/tables').catch(() => null),
          api.get('/products').catch(() => null),
          api.get('/shifts').catch(() => null),
        ]);

        // Store successful responses in IndexedDB and React Query cache
        if (gamesRes.status === 'fulfilled' && gamesRes.value?.data) {
          await storage.games.saveAll(gamesRes.value.data);
          dataCache.set(CACHE_KEYS.GAMES, gamesRes.value.data); // Keep localStorage cache for compatibility
          queryClient.setQueryData(['games'], gamesRes.value.data);
        }

        if (tablesRes.status === 'fulfilled' && tablesRes.value?.data) {
          await storage.tables.saveAll(tablesRes.value.data);
          dataCache.set(CACHE_KEYS.TABLES, tablesRes.value.data);
          queryClient.setQueryData(['tables'], tablesRes.value.data);
        }

        if (productsRes.status === 'fulfilled' && productsRes.value?.data) {
          await storage.products.saveAll(productsRes.value.data);
          dataCache.set(CACHE_KEYS.PRODUCTS, productsRes.value.data);
          queryClient.setQueryData(['products'], productsRes.value.data);
        }

        if (shiftsRes.status === 'fulfilled' && shiftsRes.value?.data) {
          await storage.shifts.saveAll(shiftsRes.value.data);
          dataCache.set(CACHE_KEYS.SHIFTS, shiftsRes.value.data);
          queryClient.setQueryData(['shifts'], shiftsRes.value.data);
        }

        // Load cached data from IndexedDB if API calls failed
        const cachedGames = await storage.games.getAll();
        if (cachedGames.length > 0 && gamesRes.status === 'rejected') {
          queryClient.setQueryData(['games'], cachedGames);
          dataCache.set(CACHE_KEYS.GAMES, cachedGames);
        }

        const cachedTables = await storage.tables.getAll();
        if (cachedTables.length > 0 && tablesRes.status === 'rejected') {
          queryClient.setQueryData(['tables'], cachedTables);
          dataCache.set(CACHE_KEYS.TABLES, cachedTables);
        }

        const cachedProducts = await storage.products.getAll();
        if (cachedProducts.length > 0 && productsRes.status === 'rejected') {
          queryClient.setQueryData(['products'], cachedProducts);
          dataCache.set(CACHE_KEYS.PRODUCTS, cachedProducts);
        }

        const cachedShifts = await storage.shifts.getAll();
        if (cachedShifts.length > 0 && shiftsRes.status === 'rejected') {
          queryClient.setQueryData(['shifts'], cachedShifts);
          dataCache.set(CACHE_KEYS.SHIFTS, cachedShifts);
        }
      } catch (error) {
        console.error('Error initializing app data:', error);
        
        // Fallback to cached data from IndexedDB
        try {
          const [cachedGames, cachedTables, cachedProducts, cachedShifts] = await Promise.all([
            storage.games.getAll(),
            storage.tables.getAll(),
            storage.products.getAll(),
            storage.shifts.getAll(),
          ]);

          if (cachedGames.length > 0) {
            queryClient.setQueryData(['games'], cachedGames);
            dataCache.set(CACHE_KEYS.GAMES, cachedGames);
          }
          if (cachedTables.length > 0) {
            queryClient.setQueryData(['tables'], cachedTables);
            dataCache.set(CACHE_KEYS.TABLES, cachedTables);
          }
          if (cachedProducts.length > 0) {
            queryClient.setQueryData(['products'], cachedProducts);
            dataCache.set(CACHE_KEYS.PRODUCTS, cachedProducts);
          }
          if (cachedShifts.length > 0) {
            queryClient.setQueryData(['shifts'], cachedShifts);
            dataCache.set(CACHE_KEYS.SHIFTS, cachedShifts);
          }
        } catch (cacheError) {
          console.error('Error loading cached data:', cacheError);
        }
      }
    };

    initializeData();
  }, [queryClient]);
}

