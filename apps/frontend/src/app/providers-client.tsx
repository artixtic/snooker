'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/theme';
import { useAppInitialization } from '@/hooks/use-app-initialization';
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

function BackupSyncListener() {
  useEffect(() => {
    // Connect to WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket: Socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected for backup sync');
    });

    // Listen for backup sync events
    socket.on('backup:sync:refresh-required', (data: any) => {
      console.log('Backup sync detected, refreshing page...', data);
      // Hard refresh the page
      window.location.reload();
    });

    socket.on('backup:sync:backup-to-main', (data: any) => {
      console.log('Data synced from backup to main:', data);
      // Hard refresh the page
      window.location.reload();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null;
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  // Initialize app data - this hook must be called inside QueryClientProvider
  useAppInitialization();

  return <>{children}</>;
}

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3,
    },
    mutations: {
      retry: 2,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BackupSyncListener />
        <AppInitializer>
          {children}
        </AppInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

