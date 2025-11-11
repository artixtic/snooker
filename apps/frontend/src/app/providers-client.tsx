'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/theme';
import { useState, useEffect } from 'react';
import { startSync } from '@/lib/sync';
import { initializeOfflineData } from '@/lib/offline-api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    // Initialize offline data and start sync
    const init = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('User not authenticated, skipping sync initialization');
          return;
        }

        // Initialize offline data from server
        await initializeOfflineData();
        
        // Start automatic sync (every 30 seconds)
        startSync(30000);
        
        console.log('Offline sync initialized');
      } catch (error) {
        console.error('Failed to initialize offline sync:', error);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      // Sync cleanup is handled in sync.ts
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

