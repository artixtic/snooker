'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { db } from '@/lib/db';
import { pushSyncQueue, pullSyncChanges } from '@/lib/sync';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import RefreshIcon from '@mui/icons-material/Refresh';

export function OfflineTestUtility() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOps, setPendingOps] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadStats();

    const interval = setInterval(loadStats, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadStats = async () => {
    try {
      const pending = await db.sync_log.where('status').equals('pending').toArray();
      const synced = await db.sync_log.where('status').equals('synced').toArray();
      const conflicts = await db.sync_log.where('status').equals('conflict').toArray();
      
      const unsyncedSales = await db.sales.where('synced').equals(0).toArray();
      const totalSales = await db.sales.count();
      const totalProducts = await db.products.count();
      const totalTables = await db.tables.count();
      const totalGames = await db.games.count();
      const totalShifts = await db.shifts.count();

      setPendingOps(pending);
      setStats({
        pending: pending.length,
        synced: synced.length,
        conflicts: conflicts.length,
        unsyncedSales: unsyncedSales.length,
        totalSales,
        totalProducts,
        totalTables,
        totalGames,
        totalShifts,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleOnline = () => {
    if (isOnline) {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
      setIsOnline(false);
    } else {
      // Simulate online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
      setIsOnline(true);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline. Please go online first.');
      return;
    }

    setSyncing(true);
    try {
      await pushSyncQueue();
      await pullSyncChanges();
      await loadStats();
      alert('Sync completed!');
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const clearLocalData = async () => {
    if (!confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      return;
    }

    try {
      await db.delete();
      alert('Local data cleared. Page will reload.');
      location.reload();
    } catch (error: any) {
      alert(`Failed to clear data: ${error.message}`);
    }
  };

  return (
    <Card sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔧 Offline Testing Utility
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Alert severity={isOnline ? 'success' : 'warning'} sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              {isOnline ? <WifiIcon /> : <WifiOffIcon />}
              <Typography>
                Status: {isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Alert>

          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Button
              variant="outlined"
              onClick={toggleOnline}
              startIcon={isOnline ? <WifiOffIcon /> : <WifiIcon />}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleManualSync}
              disabled={syncing || !isOnline}
              startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
            >
              {syncing ? 'Syncing...' : 'Manual Sync'}
            </Button>
            <Button
              variant="outlined"
              onClick={loadStats}
              startIcon={<RefreshIcon />}
            >
              Refresh Stats
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={clearLocalData}
            >
              Clear Local Data
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Sync Queue Status
        </Typography>
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip
            label={`Pending: ${stats.pending || 0}`}
            color="warning"
            size="small"
          />
          <Chip
            label={`Synced: ${stats.synced || 0}`}
            color="success"
            size="small"
          />
          <Chip
            label={`Conflicts: ${stats.conflicts || 0}`}
            color="error"
            size="small"
          />
        </Box>

        {pendingOps.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Pending Operations:
            </Typography>
            <List dense>
              {pendingOps.slice(0, 5).map((op) => (
                <ListItem key={op.id}>
                  <ListItemText
                    primary={`${op.action} ${op.entity}`}
                    secondary={`ID: ${op.entityId} | Created: ${new Date(op.createdAt).toLocaleTimeString()}`}
                  />
                </ListItem>
              ))}
              {pendingOps.length > 5 && (
                <ListItem>
                  <ListItemText
                    primary={`... and ${pendingOps.length - 5} more`}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Local Database Stats
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip label={`Sales: ${stats.totalSales || 0}`} size="small" />
          <Chip
            label={`Unsynced: ${stats.unsyncedSales || 0}`}
            color={stats.unsyncedSales > 0 ? 'warning' : 'default'}
            size="small"
          />
          <Chip label={`Products: ${stats.totalProducts || 0}`} size="small" />
          <Chip label={`Tables: ${stats.totalTables || 0}`} size="small" />
          <Chip label={`Games: ${stats.totalGames || 0}`} size="small" />
          <Chip label={`Shifts: ${stats.totalShifts || 0}`} size="small" />
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> Use Chrome DevTools → Network → Throttling → Offline for more realistic testing.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}

