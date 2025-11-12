'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/theme';
import { useAppInitialization } from '@/hooks/use-app-initialization';

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
        <AppInitializer>
          {children}
        </AppInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

