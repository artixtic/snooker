'use client';

import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface TableTimerProps {
  tableId: string;
  tableNumber: number;
  ratePerHour: number;
  startedAt?: Date | string;
  pausedAt?: Date | string | null;
  totalPausedMs?: number;
  lastResumedAt?: Date | string | null;
  status: string;
  onStart?: () => void;
  onStop?: () => void;
}

export function TableTimer({
  tableId,
  tableNumber,
  ratePerHour,
  startedAt,
  pausedAt,
  totalPausedMs = 0,
  lastResumedAt,
  status,
  onStart,
  onStop,
}: TableTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCharge, setCurrentCharge] = useState(0);
  const queryClient = useQueryClient();

  const startTableMutation = useMutation({
    mutationFn: async (data: { ratePerHour?: number }) => {
      const response = await api.post(`/tables/${tableId}/start`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      onStart?.();
    },
  });

  const pauseTableMutation = useMutation({
    mutationFn: async () => {
      // Check current table state before making request
      const cachedTables = queryClient.getQueryData<any[]>(['tables']) || [];
      const table = cachedTables.find((t: any) => t.id === tableId);
      
      // If table is already paused, return early (idempotent)
      if (table && table.status === 'PAUSED') {
        return table;
      }
      
      const response = await api.post(`/tables/${tableId}/pause`, {});
      return response.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tables'] });
      
      // Snapshot previous value
      const previousTables = queryClient.getQueryData<any[]>(['tables']);
      
      // Get current table to calculate charge
      const cachedTables = previousTables || [];
      const table = cachedTables.find((t: any) => t.id === tableId);
      
      if (table && table.status === 'OCCUPIED' && startedAt) {
        // Calculate current charge at pause time
        const start = new Date(startedAt).getTime();
        const now = Date.now();
        const totalElapsed = now - start;
        const tableTotalPausedMs = table.totalPausedMs || 0;
        const activeTime = totalElapsed - tableTotalPausedMs;
        const hours = activeTime / (1000 * 60 * 60);
        const calculatedCharge = hours * ratePerHour;
        
        // Apply optimistic update
        const { applyOptimisticUpdate, createPauseTableUpdate } = await import('@/lib/offline/optimistic-updates');
        await applyOptimisticUpdate(queryClient, createPauseTableUpdate(tableId, calculatedCharge));
      }
      
      return { previousTables };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error: any, variables: any, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousTables) {
        queryClient.setQueryData(['tables'], context.previousTables);
      }
      
      // Suppress expected errors (table already paused or not occupied)
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (errorMessage.includes('not occupied') || errorMessage.includes('already paused') || errorMessage.includes('PAUSED')) {
        // Silently handle - table might have been paused by another request
        queryClient.invalidateQueries({ queryKey: ['tables'] });
      }
    },
  });

  const resumeTableMutation = useMutation({
    mutationFn: async () => {
      // Check current table state before making request
      const cachedTables = queryClient.getQueryData<any[]>(['tables']) || [];
      const table = cachedTables.find((t: any) => t.id === tableId);
      
      // If table is already occupied, return early (idempotent)
      if (table && table.status === 'OCCUPIED') {
        return table;
      }
      
      const response = await api.post(`/tables/${tableId}/resume`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error: any) => {
      // Suppress expected errors (table already occupied or not paused)
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (errorMessage.includes('not paused') || errorMessage.includes('already occupied') || errorMessage.includes('OCCUPIED')) {
        // Silently handle - table might have been resumed by another request
        queryClient.invalidateQueries({ queryKey: ['tables'] });
      }
    },
  });

  const stopTableMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/tables/${tableId}/stop`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      onStop?.();
    },
  });

  useEffect(() => {
    if ((status === 'OCCUPIED' || status === 'PAUSED') && startedAt) {
      const interval = setInterval(() => {
        const start = new Date(startedAt).getTime();
        const now = Date.now();
        const totalElapsed = now - start;
        
        // Calculate total paused time
        let currentPauseMs = 0;
        if (status === 'PAUSED' && pausedAt && lastResumedAt) {
          // Currently paused - add time since last resume until pause
          currentPauseMs = new Date(pausedAt).getTime() - new Date(lastResumedAt).getTime();
        } else if (status === 'PAUSED' && pausedAt && startedAt) {
          // Paused but no lastResumedAt - use startedAt
          currentPauseMs = new Date(pausedAt).getTime() - start;
        }
        
        const totalPaused = (totalPausedMs || 0) + currentPauseMs;
        const activeTime = totalElapsed - totalPaused;
        
        const elapsed = Math.floor(activeTime / 1000); // seconds
        const hours = activeTime / (1000 * 60 * 60);
        const charge = hours * ratePerHour;

        setElapsedTime(Math.max(0, elapsed));
        setCurrentCharge(Math.max(0, charge));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
      setCurrentCharge(0);
    }
  }, [status, startedAt, pausedAt, totalPausedMs, lastResumedAt, ratePerHour]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      await startTableMutation.mutateAsync({ ratePerHour: ratePerHour || 10 });
    } catch (error) {
      console.error('Failed to start table:', error);
    }
  };

  const handlePause = async () => {
    try {
      await pauseTableMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to pause table:', error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeTableMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to resume table:', error);
    }
  };

  const handleStop = async () => {
    if (confirm(`Stop table ${tableNumber}? Current charge: $${currentCharge.toFixed(2)}`)) {
      try {
        await stopTableMutation.mutateAsync();
      } catch (error) {
        console.error('Failed to stop table:', error);
      }
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Table {tableNumber}</Typography>
        <Chip
          label={status}
          color={
            status === 'OCCUPIED' 
              ? 'warning' 
              : status === 'PAUSED'
              ? 'default'
              : 'success'
          }
          size="small"
        />
      </Box>

      {status === 'OCCUPIED' || status === 'PAUSED' ? (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {status === 'PAUSED' ? 'Time (Paused)' : 'Elapsed Time'}
            </Typography>
            <Typography 
              variant="h4" 
              color={status === 'PAUSED' ? 'warning.main' : 'primary'}
            >
              {formatTime(elapsedTime)}
            </Typography>
            {status === 'PAUSED' && (
              <Chip 
                label="PAUSED" 
                color="warning" 
                size="small" 
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Current Charge
            </Typography>
            <Typography variant="h4" color="success.main">
              ${currentCharge.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @ ${ratePerHour}/hour {status === 'PAUSED' && '(Paused - not charging)'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {status === 'OCCUPIED' ? (
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                startIcon={<PauseIcon />}
                onClick={handlePause}
                disabled={pauseTableMutation.isPending}
              >
                Pause
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<PlayCircleIcon />}
                onClick={handleResume}
                disabled={resumeTableMutation.isPending}
              >
                Resume
              </Button>
            )}
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStop}
              disabled={stopTableMutation.isPending}
            >
              Stop
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Rate: ${ratePerHour}/hour
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: Available
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            disabled={startTableMutation.isPending}
          >
            Start Table
          </Button>
        </>
      )}

      {(startTableMutation.isPending || 
        stopTableMutation.isPending || 
        pauseTableMutation.isPending || 
        resumeTableMutation.isPending) && (
        <LinearProgress sx={{ mt: 2 }} />
      )}
    </Paper>
  );
}

