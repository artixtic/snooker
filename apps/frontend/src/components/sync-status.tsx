/**
 * Sync Status Component
 * 
 * Displays the current sync status, queue size, and online/offline state.
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Chip, CircularProgress, Tooltip, IconButton, Switch, FormControlLabel } from '@mui/material';
import { CloudOff, CloudDone, Sync, SyncDisabled, Settings } from '@mui/icons-material';
import { syncQueue } from '@/lib/db/sync-queue';
import { requestQueueStorage } from '@/lib/db/request-queue-storage';

// Global flag to override online status for testing
let forceOfflineMode = false;

// Override navigator.onLine for testing
if (typeof window !== 'undefined') {
  const originalOnLine = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine')?.get;
  if (originalOnLine) {
    Object.defineProperty(navigator, 'onLine', {
      get: () => forceOfflineMode ? false : originalOnLine.call(navigator),
      configurable: true,
    });
  }
}

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [showDevToggle, setShowDevToggle] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);

  useEffect(() => {
    // Update online status
    const handleOnline = () => {
      if (!forceOfflineMode) {
        setIsOnline(true);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for dev mode (hold Shift key while clicking sync status)
    const checkDevMode = () => {
      const isDev = localStorage.getItem('devMode') === 'true';
      setShowDevToggle(isDev);
    };
    checkDevMode();

    // Subscribe to sync queue processing state
    const unsubscribe = syncQueue.subscribe((processing) => {
      setIsProcessing(processing);
    });

    // Update queue size periodically
    const updateQueueSize = async () => {
      const size = await requestQueueStorage.getSize();
      setQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (isOnline && !isProcessing) {
      await syncQueue.processQueue();
    }
  };

  const handleToggleOffline = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setSimulateOffline(newValue);
    forceOfflineMode = newValue;
    
    // Set global flag for offline-api to check
    if (typeof window !== 'undefined') {
      (window as any).__forceOfflineMode = newValue;
    }
    
    // Trigger offline event manually
    if (newValue) {
      setIsOnline(false);
      // Dispatch custom offline event
      window.dispatchEvent(new Event('offline'));
    } else {
      setIsOnline(navigator.onLine);
      // Dispatch custom online event
      window.dispatchEvent(new Event('online'));
    }
  };

  const handleEnableDevMode = () => {
    const newDevMode = !showDevToggle;
    setShowDevToggle(newDevMode);
    localStorage.setItem('devMode', newDevMode.toString());
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Dev Mode Toggle (hidden by default, enable via localStorage) */}
      {showDevToggle && (
        <Tooltip title="Developer: Simulate offline mode for testing">
          <FormControlLabel
            control={
              <Switch
                checked={simulateOffline}
                onChange={handleToggleOffline}
                size="small"
                color="warning"
              />
            }
            label="Simulate Offline"
            sx={{ mr: 1 }}
          />
        </Tooltip>
      )}

      {/* Enable Dev Mode Button (hold Shift + click on sync status) */}
      <Tooltip title="Hold Shift and click to enable developer mode">
        <IconButton
          size="small"
          onClick={(e) => {
            if (e.shiftKey) {
              handleEnableDevMode();
            }
          }}
          sx={{ opacity: 0.3, '&:hover': { opacity: 0.7 } }}
        >
          <Settings fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Online/Offline Status */}
      <Tooltip title={isOnline ? 'Online' : simulateOffline ? 'Offline (Simulated)' : 'Offline'}>
        <Chip
          icon={isOnline ? <CloudDone /> : <CloudOff />}
          label={isOnline ? 'Online' : simulateOffline ? 'Offline (Test)' : 'Offline'}
          color={isOnline ? 'success' : simulateOffline ? 'warning' : 'default'}
          size="small"
          variant="outlined"
        />
      </Tooltip>

      {/* Sync Status */}
      {isOnline && (
        <>
          {isProcessing ? (
            <Tooltip title="Syncing data...">
              <Chip
                icon={<CircularProgress size={14} />}
                label="Syncing"
                color="primary"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          ) : queueSize > 0 ? (
            <Tooltip title={`${queueSize} request(s) queued. Click to sync now.`}>
              <Chip
                icon={<Sync />}
                label={`${queueSize} queued`}
                color="warning"
                size="small"
                variant="outlined"
                onClick={handleManualSync}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="All data synced">
              <Chip
                icon={<SyncDisabled />}
                label="Synced"
                color="success"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
        </>
      )}

      {!isOnline && queueSize > 0 && (
        <Tooltip title={`${queueSize} request(s) will sync when online`}>
          <Chip
            icon={<CloudOff />}
            label={`${queueSize} pending`}
            color="default"
            size="small"
            variant="outlined"
          />
        </Tooltip>
      )}
    </Box>
  );
}

