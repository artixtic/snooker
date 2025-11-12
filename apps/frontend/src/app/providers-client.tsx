'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/theme';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppInitialization } from '@/hooks/use-app-initialization';
import { syncQueue, setQueryClient } from '@/lib/db/sync-queue';
import { registerServiceWorker } from '@/lib/offline/service-worker';
import { SyncLoader } from '@/components/sync-loader';
import { QueueDebug } from '@/components/queue-debug';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // Initialize app data - this hook must be called inside QueryClientProvider
  useAppInitialization();

  // Set up sync queue and service worker for offline requests
  useEffect(() => {
    // Set query client for sync queue to invalidate queries after sync
    setQueryClient(queryClient);
    
    // Register service worker
    registerServiceWorker().catch(console.error);

    const handleOnline = () => {
      // Process queue immediately when coming online
      syncQueue.processQueue().catch(console.error);
      // Start periodic sync checks
      syncQueue.startAutoSync(5000);
    };

    const handleOffline = () => {
      syncQueue.stopAutoSync();
    };

    // Check initial state
    if (navigator.onLine) {
      syncQueue.processQueue().catch(console.error);
      syncQueue.startAutoSync(5000);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncQueue.stopAutoSync();
    };
  }, [queryClient]);

  return (
    <>
      {children}
      <SyncLoader />
      <QueueDebug />
    </>
  );
}

// Create QueryClient with offline mode configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      // Enable offline mode - use cached data when offline
      networkMode: 'offlineFirst',
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on network errors when offline
        if (error?.code === 'ERR_NETWORK' || !navigator.onLine) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      // Retry mutations when online
      retry: (failureCount, error: any) => {
        if (error?.code === 'ERR_NETWORK' || !navigator.onLine) {
          return false; // Don't retry offline - request is queued
        }
        return failureCount < 2;
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppInitializer>
          {children}
        </AppInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

