'use client';

import {
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopIcon from '@mui/icons-material/Stop';
import PaymentIcon from '@mui/icons-material/Payment';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface TableSelectorProps {
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
  onCheckout?: (tableId: string) => void;
  onStopTimer?: (tableId: string) => void;
}

export function TableSelector({ selectedTableId, onSelectTable, onCheckout, onStopTimer }: TableSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ratePerHour, setRatePerHour] = useState('10');
  const queryClient = useQueryClient();

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await api.get('/tables');
      return response.data;
    },
  });

  const selectedTable = tables.find((t: any) => t.id === selectedTableId);

  const startTableMutation = useMutation({
    mutationFn: async ({ tableId, rate }: { tableId: string; rate: number }) => {
      const response = await api.post(`/tables/${tableId}/start`, {
        ratePerHour: rate,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setDialogOpen(false);
    },
  });

  const pauseTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const response = await api.post(`/tables/${tableId}/pause`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const resumeTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const response = await api.post(`/tables/${tableId}/resume`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const stopTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const response = await api.post(`/tables/${tableId}/stop`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      if (onStopTimer) {
        onStopTimer(selectedTableId!);
      }
    },
  });

  const [pendingTableId, setPendingTableId] = useState<string | null>(null);

  const handleStartTable = (table: any) => {
    setRatePerHour(table.ratePerHour?.toString() || '10');
    setPendingTableId(table.id);
    setDialogOpen(true);
  };

  const handleConfirmStart = () => {
    if (pendingTableId) {
      startTableMutation.mutate({
        tableId: pendingTableId,
        rate: parseFloat(ratePerHour),
      });
      onSelectTable(pendingTableId);
      setPendingTableId(null);
    }
  };

  const handleSelectTable = (table: any) => {
    if (table.status === 'AVAILABLE') {
      handleStartTable(table);
    } else {
      onSelectTable(table.id);
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Table
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {tables.map((table: any) => (
            <Chip
              key={table.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Table {table.tableNumber}</span>
                  {table.status === 'OCCUPIED' && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      (Active)
                    </span>
                  )}
                </Box>
              }
              onClick={() => handleSelectTable(table)}
              color={
                selectedTableId === table.id
                  ? 'primary'
                  : table.status === 'OCCUPIED'
                  ? 'warning'
                  : 'default'
              }
              variant={selectedTableId === table.id ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        {selectedTable && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Selected: Table {selectedTable.tableNumber}
              </Typography>
              <Chip
                label={selectedTable.status}
                color={
                  selectedTable.status === 'OCCUPIED'
                    ? 'warning'
                    : selectedTable.status === 'PAUSED'
                    ? 'default'
                    : 'success'
                }
                size="small"
              />
            </Box>
            {(selectedTable.status === 'OCCUPIED' || selectedTable.status === 'PAUSED') && selectedTable.startedAt && (
              <>
                <TableTimerDisplay
                  startedAt={selectedTable.startedAt}
                  ratePerHour={Number(selectedTable.ratePerHour)}
                  status={selectedTable.status}
                  pausedAt={selectedTable.pausedAt}
                  totalPausedMs={selectedTable.totalPausedMs || 0}
                  lastResumedAt={selectedTable.lastResumedAt}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  {selectedTable.status === 'OCCUPIED' ? (
                    <>
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        startIcon={<PauseIcon />}
                        onClick={() => pauseTableMutation.mutate(selectedTable.id)}
                        disabled={pauseTableMutation.isPending}
                        sx={{ flex: 1, minWidth: 120 }}
                      >
                        Pause Timer
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<StopIcon />}
                        onClick={() => {
                          if (confirm('Stop timer and checkout? This will finalize the table session.')) {
                            stopTableMutation.mutate(selectedTable.id);
                          }
                        }}
                        disabled={stopTableMutation.isPending}
                        sx={{ flex: 1, minWidth: 120 }}
                      >
                        Stop Timer
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<PlayCircleIcon />}
                      onClick={() => resumeTableMutation.mutate(selectedTable.id)}
                      disabled={resumeTableMutation.isPending}
                      fullWidth
                    >
                      Resume Timer
                    </Button>
                  )}
                  {(selectedTable.status === 'OCCUPIED' || selectedTable.status === 'PAUSED') && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<PaymentIcon />}
                      onClick={() => {
                        if (onCheckout) {
                          onCheckout(selectedTable.id);
                        }
                      }}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Checkout & Pay
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Start Table Session</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rate per Hour"
            type="number"
            value={ratePerHour}
            onChange={(e) => setRatePerHour(e.target.value)}
            margin="normal"
            inputProps={{ step: 0.01, min: 0 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setPendingTableId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmStart}
            variant="contained"
            disabled={!ratePerHour || startTableMutation.isPending}
          >
            Start Table
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function TableTimerDisplay({
  startedAt,
  ratePerHour,
  status,
  pausedAt,
  totalPausedMs = 0,
  lastResumedAt,
}: {
  startedAt: string | Date;
  ratePerHour: number;
  status?: string;
  pausedAt?: string | Date | null;
  totalPausedMs?: number;
  lastResumedAt?: string | Date | null;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCharge, setCurrentCharge] = useState(0);

  useEffect(() => {
    if (status === 'PAUSED') {
      // Don't update timer when paused
      return;
    }
    
    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const totalElapsed = now - start;
      
      // Calculate total paused time
      let currentPauseMs = 0;
      if (status === 'PAUSED' && pausedAt && lastResumedAt) {
        currentPauseMs = new Date(pausedAt).getTime() - new Date(lastResumedAt).getTime();
      }
      
      const totalPaused = (totalPausedMs || 0) + currentPauseMs;
      const activeTime = totalElapsed - totalPaused;
      
      const elapsed = Math.floor(activeTime / 1000);
      const hours = activeTime / (1000 * 60 * 60);
      const charge = hours * ratePerHour;

      setElapsedTime(Math.max(0, elapsed));
      setCurrentCharge(Math.max(0, charge));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, ratePerHour, status, pausedAt, totalPausedMs, lastResumedAt]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {status === 'PAUSED' ? 'Time (Paused):' : 'Time:'} {formatTime(elapsedTime)}
      </Typography>
      <Typography variant="h6" color={status === 'PAUSED' ? 'warning.main' : 'primary'}>
        Charge: ${currentCharge.toFixed(2)}
      </Typography>
      {status === 'PAUSED' && (
        <Typography variant="caption" color="text.secondary">
          Timer paused - not charging
        </Typography>
      )}
    </Box>
  );
}

