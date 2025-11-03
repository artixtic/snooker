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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface TableTimerProps {
  tableId: string;
  tableNumber: number;
  ratePerHour: number;
  startedAt?: Date | string;
  status: string;
  onStart?: () => void;
  onStop?: () => void;
}

export function TableTimer({
  tableId,
  tableNumber,
  ratePerHour,
  startedAt,
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
    if (status === 'OCCUPIED' && startedAt) {
      const interval = setInterval(() => {
        const start = new Date(startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000); // seconds
        const hours = elapsed / 3600;
        const charge = hours * ratePerHour;

        setElapsedTime(elapsed);
        setCurrentCharge(charge);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
      setCurrentCharge(0);
    }
  }, [status, startedAt, ratePerHour]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startTableMutation.mutate({ ratePerHour: ratePerHour || 10 });
  };

  const handleStop = () => {
    if (confirm(`Stop table ${tableNumber}? Current charge: $${currentCharge.toFixed(2)}`)) {
      stopTableMutation.mutate();
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Table {tableNumber}</Typography>
        <Chip
          label={status}
          color={status === 'OCCUPIED' ? 'warning' : 'success'}
          size="small"
        />
      </Box>

      {status === 'OCCUPIED' ? (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Elapsed Time
            </Typography>
            <Typography variant="h4" color="primary">
              {formatTime(elapsedTime)}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Current Charge
            </Typography>
            <Typography variant="h4" color="success.main">
              ${currentCharge.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @ ${ratePerHour}/hour
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={handleStop}
            disabled={stopTableMutation.isPending}
          >
            Stop Table
          </Button>
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

      {(startTableMutation.isPending || stopTableMutation.isPending) && (
        <LinearProgress sx={{ mt: 2 }} />
      )}
    </Paper>
  );
}

