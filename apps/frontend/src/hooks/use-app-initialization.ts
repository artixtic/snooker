// Hook to initialize app data on startup
// Fetches all critical data and stores it in React Query cache

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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

        // Store successful responses in React Query cache and localStorage cache
        if (gamesRes.status === 'fulfilled' && gamesRes.value?.data) {
          dataCache.set(CACHE_KEYS.GAMES, gamesRes.value.data);
          queryClient.setQueryData(['games'], gamesRes.value.data);
        }

        if (tablesRes.status === 'fulfilled' && tablesRes.value?.data) {
          dataCache.set(CACHE_KEYS.TABLES, tablesRes.value.data);
          queryClient.setQueryData(['tables'], tablesRes.value.data);
        }

        if (productsRes.status === 'fulfilled' && productsRes.value?.data) {
          dataCache.set(CACHE_KEYS.PRODUCTS, productsRes.value.data);
          queryClient.setQueryData(['products'], productsRes.value.data);
        }

        if (shiftsRes.status === 'fulfilled' && shiftsRes.value?.data) {
          dataCache.set(CACHE_KEYS.SHIFTS, shiftsRes.value.data);
          queryClient.setQueryData(['shifts'], shiftsRes.value.data);
        }
      } catch (error) {
        console.error('Error initializing app data:', error);
      }
    };

    initializeData();
  }, [queryClient]);
}

