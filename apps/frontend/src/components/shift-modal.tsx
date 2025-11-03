'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'start' | 'close';
  shiftId?: string;
}

export function ShiftModal({ open, onClose, mode, shiftId }: ShiftModalProps) {
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch shift details if closing
  const { data: shift } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      if (!shiftId) return null;
      const response = await api.get(`/shifts/${shiftId}`);
      return response.data;
    },
    enabled: mode === 'close' && !!shiftId,
  });

  // Get current user to check for active shift
  const currentUserId = localStorage.getItem('userId'); // Would come from auth context
  
  const { data: activeShift } = useQuery({
    queryKey: ['shifts', 'active', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      try {
        const response = await api.get('/shifts');
        return response.data.find((s: any) => s.status === 'ACTIVE' && s.employeeId === currentUserId) || null;
      } catch {
        return null;
      }
    },
    enabled: mode === 'start' && !!currentUserId,
  });

  const startMutation = useMutation({
    mutationFn: async (data: { openingCash: number }) => {
      const response = await api.post('/shifts/start', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      onClose();
      setOpeningCash('');
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (data: { closingCash: number; notes?: string }) => {
      if (!shiftId) throw new Error('Shift ID required');
      const response = await api.post(`/shifts/${shiftId}/close`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      onClose();
      setClosingCash('');
      setNotes('');
    },
  });

  useEffect(() => {
    if (mode === 'close' && shift) {
      // Auto-calculate expected closing cash if possible
      const expectedCash = shift.openingCash + (shift.salesTotal || 0);
      setClosingCash(expectedCash.toString());
    }
  }, [mode, shift]);

  const handleSubmit = () => {
    if (mode === 'start') {
      if (!openingCash || parseFloat(openingCash) < 0) {
        alert('Please enter a valid opening cash amount');
        return;
      }
      startMutation.mutate({ openingCash: parseFloat(openingCash) });
    } else {
      if (!closingCash || parseFloat(closingCash) < 0) {
        alert('Please enter a valid closing cash amount');
        return;
      }
      closeMutation.mutate({
        closingCash: parseFloat(closingCash),
        notes: notes || undefined,
      });
    }
  };

  const discrepancy = shift
    ? parseFloat(closingCash || '0') -
      (Number(shift.openingCash) + Number(shift.salesTotal || 0))
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'start' ? 'Start Shift' : 'Close Shift'}
      </DialogTitle>
      <DialogContent>
        {mode === 'start' ? (
          <Box sx={{ pt: 2 }}>
            {activeShift && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                You already have an active shift. Please close it first.
              </Alert>
            )}
            <TextField
              fullWidth
              label="Opening Cash"
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              margin="normal"
              required
              autoFocus
              inputProps={{ step: 0.01, min: 0 }}
              helperText="Enter the starting cash amount in the drawer"
            />
          </Box>
        ) : (
          <Box sx={{ pt: 2 }}>
            {shift && (
              <>
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Shift Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Opening Cash:</Typography>
                    <Typography fontWeight="bold">
                      ${Number(shift.openingCash).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Sales Total:</Typography>
                    <Typography fontWeight="bold">
                      ${Number(shift.salesTotal || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Expected Cash:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      ${(Number(shift.openingCash) + Number(shift.salesTotal || 0)).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>

                <TextField
                  fullWidth
                  label="Closing Cash"
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  margin="normal"
                  required
                  autoFocus
                  inputProps={{ step: 0.01, min: 0 }}
                />

                {discrepancy !== 0 && (
                  <Alert
                    severity={discrepancy > 0 ? 'info' : 'warning'}
                    sx={{ mt: 2 }}
                  >
                    {discrepancy > 0 ? 'Overage' : 'Shortage'}: $
                    {Math.abs(discrepancy).toFixed(2)}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Notes (optional)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  margin="normal"
                  placeholder="Add notes about the shift or discrepancies..."
                />
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={
            mode === 'start'
              ? !openingCash || startMutation.isPending || !!activeShift
              : !closingCash || closeMutation.isPending
          }
        >
          {mode === 'start' ? 'Start Shift' : 'Close Shift'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

