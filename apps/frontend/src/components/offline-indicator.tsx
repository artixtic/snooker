'use client';

import { useEffect, useState } from 'react';
import { 
  Chip, 
  Box, 
  Menu, 
  MenuItem, 
  Typography, 
  Divider, 
  Button, 
  CircularProgress,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import SyncIcon from '@mui/icons-material/Sync';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { db } from '@/lib/db';
import { pushSyncQueue, pullSyncChanges } from '@/lib/sync';

interface OfflineIndicatorProps {
  compact?: boolean; // If true, shows compact version for header
}

export function OfflineIndicator({ compact = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [pendingOps, setPendingOps] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<any>({});

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

  useEffect(() => {
    if (compact && anchorEl) {
      loadStats();
      const interval = setInterval(loadStats, 2000);
      return () => clearInterval(interval);
    }
  }, [compact, anchorEl]);

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

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (compact) {
      setAnchorEl(event.currentTarget);
      loadStats();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
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
    handleClose();
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
    handleClose();
  };

  // Compact version for header with dropdown
  if (compact) {
    return (
      <>
        <Chip
          icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
          label={isOnline ? 'Online' : 'Offline'}
          color={isOnline ? 'success' : 'warning'}
          size="small"
          onClick={handleClick}
          sx={{
            mr: 1,
            fontWeight: 'bold',
            cursor: 'pointer',
            '& .MuiChip-icon': {
              color: 'inherit',
            },
            '&:hover': {
              opacity: 0.8,
            },
          }}
        />
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 320,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              🔧 Offline Testing Utility
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Status: {isOnline ? 'Online' : 'Offline'}
            </Typography>
          </Box>
          <Divider />
          
          <MenuItem onClick={toggleOnline}>
            <ListItemIcon>
              {isOnline ? <WifiOffIcon fontSize="small" /> : <WifiIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={isOnline ? 'Go Offline' : 'Go Online'} />
          </MenuItem>
          
          <MenuItem onClick={handleManualSync} disabled={syncing || !isOnline}>
            <ListItemIcon>
              {syncing ? <CircularProgress size={16} /> : <SyncIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={syncing ? 'Syncing...' : 'Manual Sync'} />
          </MenuItem>
          
          <MenuItem onClick={loadStats}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Refresh Stats" />
          </MenuItem>
          
          <Divider />
          
          <Box sx={{ p: 2, pt: 1 }}>
            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              Sync Queue
            </Typography>
            <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
              <Chip label={`Pending: ${stats.pending || 0}`} color="warning" size="small" />
              <Chip label={`Synced: ${stats.synced || 0}`} color="success" size="small" />
              {stats.conflicts > 0 && (
                <Chip label={`Conflicts: ${stats.conflicts || 0}`} color="error" size="small" />
              )}
            </Box>
            
            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom sx={{ mt: 1.5 }}>
              Local Database
            </Typography>
            <Box display="flex" gap={0.5} flexWrap="wrap">
              <Chip label={`Sales: ${stats.totalSales || 0}`} size="small" variant="outlined" />
              {stats.unsyncedSales > 0 && (
                <Chip 
                  label={`Unsynced: ${stats.unsyncedSales || 0}`} 
                  color="warning" 
                  size="small" 
                  variant="outlined"
                />
              )}
              <Chip label={`Products: ${stats.totalProducts || 0}`} size="small" variant="outlined" />
              <Chip label={`Tables: ${stats.totalTables || 0}`} size="small" variant="outlined" />
            </Box>
          </Box>
          
          <Divider />
          
          <MenuItem onClick={clearLocalData} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Clear Local Data" />
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Full version (for backward compatibility)
  if (isOnline) return null;

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
          color: 'white',
          py: 1,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <WifiOffIcon />
        <Box component="span" sx={{ fontWeight: 'bold' }}>
          You are currently offline. Changes will be synced when connection is restored.
        </Box>
      </Box>
    </Box>
  );
}

