'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Verify token is valid (no expiration check since tokens never expire)
      try {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check admin requirement
        if (requireAdmin && payload.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setAuthenticated(true);
      } catch (error) {
        // Invalid token format - clear all data
        const { clearAllData } = await import('@/lib/logout-utils');
        await clearAllData();
        const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, requireAdmin]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}

