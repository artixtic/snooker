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
      const response = await api.get('/shifts');
      return response.data.find((s: any) => s.status === 'ACTIVE' && s.employeeId === currentUserId) || null;
    },
    enabled: mode === 'start' && !!currentUserId,
  });

  const startMutation = useMutation({
    mutationFn: async (data: { openingCash: number }) => {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        throw new Error('User ID not found');
      }
      const response = await api.post('/shifts/start', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'active'] });
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

  const handleSubmit = async () => {
    if (mode === 'start') {
      if (!openingCash || parseFloat(openingCash) < 0) {
        alert('Please enter a valid opening cash amount');
        return;
      }
      try {
        await startMutation.mutateAsync({ openingCash: parseFloat(openingCash) });
      } catch (error) {
        console.error('Failed to start shift:', error);
      }
    } else {
      if (!closingCash || parseFloat(closingCash) < 0) {
        alert('Please enter a valid closing cash amount');
        return;
      }
      try {
        await closeMutation.mutateAsync({
          closingCash: parseFloat(closingCash),
          notes: notes || undefined,
        });
      } catch (error) {
        console.error('Failed to close shift:', error);
      }
    }
  };

  const discrepancy = shift
    ? parseFloat(closingCash || '0') -
      (Number(shift.openingCash) + Number(shift.salesTotal || 0))
    : 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          background: mode === 'start' 
            ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        {mode === 'start' ? '🟢 Start Shift' : '🔒 Close Shift'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {mode === 'start' ? (
          <Box>
            {activeShift && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                ⚠️ You already have an active shift. Please close it first.
              </Alert>
            )}
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  color: '#FF9800',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                💵 Opening Cash
              </Typography>
              <TextField
                fullWidth
                label="Opening Cash (PKR)"
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                margin="normal"
                required
                autoFocus
                inputProps={{ min: 0, inputMode: 'decimal', pattern: '[0-9.]*' }}
                helperText="Enter the starting cash amount in the drawer"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#FF9800',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF9800',
                    },
                  },
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box>
            {shift && (
              <>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    mb: 3,
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#f44336',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    📊 Shift Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight="medium">Opening Cash:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="#f44336">
                      PKR {Math.ceil(Number(shift.openingCash))}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight="medium">Sales Total:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="#00BCD4">
                      PKR {Math.ceil(Number(shift.salesTotal || 0))}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Expected Cash:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="#4CAF50">
                      PKR {Math.ceil(Number(shift.openingCash) + Number(shift.salesTotal || 0))}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <TextField
                    fullWidth
                    label="Closing Cash (PKR)"
                    type="number"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    margin="normal"
                    required
                    autoFocus
                    inputProps={{ min: 0, inputMode: 'decimal', pattern: '[0-9.]*' }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#f44336',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f44336',
                        },
                      },
                    }}
                  />

                  {discrepancy !== 0 && (
                    <Alert
                      severity={discrepancy > 0 ? 'info' : 'warning'}
                      sx={{ mt: 2, borderRadius: 2 }}
                    >
                      {discrepancy > 0 ? '💰 Overage' : '⚠️ Shortage'}: PKR {Math.ceil(Math.abs(discrepancy))}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    margin="normal"
                    placeholder="Add notes about the shift or discrepancies..."
                    sx={{
                      mt: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button 
          onClick={onClose}
          disabled={startMutation.isPending || closeMutation.isPending}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 'bold',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            mode === 'start'
              ? !openingCash || startMutation.isPending || !!activeShift
              : !closingCash || closeMutation.isPending
          }
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: mode === 'start'
              ? 'linear-gradient(135deg, #FF9800 30%, #F57C00 90%)'
              : 'linear-gradient(135deg, #f44336 30%, #d32f2f 90%)',
            color: 'white',
            boxShadow: mode === 'start'
              ? '0 4px 15px rgba(255, 152, 0, 0.4)'
              : '0 4px 15px rgba(244, 67, 54, 0.4)',
            '&:hover': {
              background: mode === 'start'
                ? 'linear-gradient(135deg, #F57C00 30%, #FF9800 90%)'
                : 'linear-gradient(135deg, #d32f2f 30%, #f44336 90%)',
              boxShadow: mode === 'start'
                ? '0 6px 20px rgba(255, 152, 0, 0.6)'
                : '0 6px 20px rgba(244, 67, 54, 0.6)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {mode === 'start' 
            ? (startMutation.isPending ? 'Starting...' : '🚀 Start Shift')
            : (closeMutation.isPending ? 'Closing...' : '🔒 Close Shift')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}

