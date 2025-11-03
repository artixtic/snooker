'use client';

import { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <Alert
        severity="warning"
        icon={<WifiOffIcon />}
        sx={{ borderRadius: 0 }}
      >
        You are currently offline. Changes will be synced when connection is restored.
      </Alert>
    </Box>
  );
}

