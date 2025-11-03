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
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface TableSelectorProps {
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
}

export function TableSelector({ selectedTableId, onSelectTable }: TableSelectorProps) {
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
            <Typography variant="subtitle2" gutterBottom>
              Selected: Table {selectedTable.tableNumber}
            </Typography>
            {selectedTable.status === 'OCCUPIED' && selectedTable.startedAt && (
              <TableTimerDisplay
                startedAt={selectedTable.startedAt}
                ratePerHour={Number(selectedTable.ratePerHour)}
              />
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
}: {
  startedAt: string | Date;
  ratePerHour: number;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCharge, setCurrentCharge] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const hours = elapsed / 3600;
      const charge = hours * ratePerHour;

      setElapsedTime(elapsed);
      setCurrentCharge(charge);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, ratePerHour]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Time: {formatTime(elapsedTime)}
      </Typography>
      <Typography variant="h6" color="primary">
        Charge: ${currentCharge.toFixed(2)}
      </Typography>
    </Box>
  );
}

