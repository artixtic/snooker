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
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Verify token is still valid by checking user info
      // In a real app, you'd decode JWT or call an endpoint
      try {
        // For now, just check if token exists
        // You could add a lightweight verify endpoint
        setAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('accessToken');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

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

