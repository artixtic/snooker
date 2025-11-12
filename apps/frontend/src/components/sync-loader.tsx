/**
 * Sync Loader Component
 * 
 * Displays a full-screen loader when syncing queued requests.
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, LinearProgress, Backdrop, keyframes } from '@mui/material';
import { CloudSync } from '@mui/icons-material';
import { syncQueue } from '@/lib/db/sync-queue';
import { requestQueueStorage } from '@/lib/db/request-queue-storage';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export function SyncLoader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    // Subscribe to sync queue processing state
    const unsubscribe = syncQueue.subscribe((processing) => {
      setIsProcessing(processing);
      if (!processing) {
        // Reset counts when sync completes
        setProcessedCount(0);
        setTotalRequests(0);
      }
    });

    // Listen for sync start event
    const handleSyncStart = (event: any) => {
      setTotalRequests(event.detail?.total || 0);
      setProcessedCount(0);
    };

    // Listen for sync progress events
    const handleSyncProgress = (event: any) => {
      setProcessedCount((prev) => {
        const newCount = prev + 1;
        return newCount;
      });
    };

    window.addEventListener('syncStart', handleSyncStart as EventListener);
    window.addEventListener('syncProgress', handleSyncProgress as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('syncStart', handleSyncStart as EventListener);
      window.removeEventListener('syncProgress', handleSyncProgress as EventListener);
    };
  }, []);

  // Calculate progress percentage
  const progress = totalRequests > 0 ? (processedCount / totalRequests) * 100 : 0;

  if (!isProcessing) {
    return null;
  }

  return (
    <Backdrop
      open={true}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          p: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          minWidth: 320,
          maxWidth: 400,
        }}
      >
        <CloudSync 
          sx={{ 
            fontSize: 64, 
            color: 'primary.main',
            animation: `${spin} 2s linear infinite`,
          }} 
        />
        <Typography variant="h5" fontWeight="bold" color="primary.main">
          Syncing Data...
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Please wait while we sync your offline changes
        </Typography>
        
        {totalRequests > 0 && (
          <Box sx={{ width: '100%', mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Processing requests
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {processedCount} / {totalRequests}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        <CircularProgress size={40} thickness={4} />
      </Box>
    </Backdrop>
  );
}

