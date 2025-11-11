'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  TextField,
  Alert,
  Snackbar,
  AlertTitle,
} from '@mui/material';
import api from '@/lib/api';

interface ReportsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ReportsDialog({ open, onClose }: ReportsDialogProps) {
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const queryClient = useQueryClient();

  // Get active shift
  const { data: shifts, refetch: refetchShifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await api.get('/shifts');
      return response.data;
    },
    enabled: open,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Get all tables to check for active ones
  const { data: tables, refetch: refetchTables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await api.get('/tables');
      return response.data;
    },
    enabled: open,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Refetch tables when dialog opens
  useEffect(() => {
    if (open) {
      refetchTables();
    }
  }, [open, refetchTables]);

  // Refetch shifts when dialog opens
  useEffect(() => {
    if (open) {
      refetchShifts();
    }
  }, [open, refetchShifts]);

  const activeShift = shifts?.find((shift: any) => shift.status === 'ACTIVE');

  // Check for active tables (OCCUPIED or PAUSED)
  const activeTables = tables?.filter((table: any) => 
    table.status === 'OCCUPIED' || table.status === 'PAUSED'
  ) || [];

  // Get shift report for active shift - always refetch fresh data
  const { data: report, refetch: refetchReport } = useQuery({
    queryKey: ['shift-report', activeShift?.id],
    queryFn: async () => {
      if (!activeShift) {
        return null;
      }
      const response = await api.get(`/shifts/${activeShift.id}/report`);
      return response.data;
    },
    enabled: open && !!activeShift,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale, force fresh fetch
    cacheTime: 0, // Don't cache, always fetch fresh
  });

  // Refetch report when dialog opens or when closing dialog opens
  useEffect(() => {
    if (open && activeShift) {
      refetchReport();
    }
  }, [open, activeShift, refetchReport]);

  useEffect(() => {
    if (closingDialogOpen && activeShift) {
      // Refetch fresh data when closing dialog opens
      refetchReport();
      refetchTables(); // Also refetch tables to ensure we have latest status
    }
  }, [closingDialogOpen, activeShift, refetchReport, refetchTables]);

  const closeShiftMutation = useMutation({
    mutationFn: async (data: { closingCash: number; notes?: string }) => {
      if (!activeShift) {
        throw new Error('No active shift found');
      }
      const response = await api.post(`/shifts/${activeShift.id}/close`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-report'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setClosingDialogOpen(false);
      setClosingCash('');
      setNotes('');
      setSuccessData(data);
      setSuccessAlertOpen(true);
      // Close main dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to close shift. Please try again.');
    },
  });

  // Get totals from report
  const gameTotals = report?.gameTotals || [];
  const snookerTotal = report?.snookerTotal || 0;
  const canteenTotal = report?.canteenTotal || 0;
  const totalTaxes = report?.totalTaxes || 0;
  const canteenTax = report?.canteenTax || 0;
  const canteenSalesWithTax = report?.canteenSalesWithTax || 0;
  const total = (report?.salesTotal || 0);
  const expense = report?.totalExpenses || 0;
  const profit = total - expense;

  const handleCloseDay = () => {
    if (!activeShift) {
      alert('No active shift found. Please start a shift first.');
      return;
    }
    
    // Check for active tables before opening closing dialog
    if (activeTables.length > 0) {
      const tableNumbers = activeTables.map((t: any) => t.tableNumber).join(', ');
      alert(`⚠️ Cannot close shift! There are ${activeTables.length} active table(s): Table ${tableNumbers}.\n\nPlease close all tables before closing the shift.`);
      return;
    }
    
    setClosingDialogOpen(true);
  };

  const handleConfirmClose = () => {
    if (!closingCash || isNaN(Number(closingCash))) {
      alert('Please enter a valid closing cash amount');
      return;
    }
    
    // Double-check for active tables before confirming close
    if (activeTables.length > 0) {
      const tableNumbers = activeTables.map((t: any) => t.tableNumber).join(', ');
      alert(`⚠️ Cannot close shift! There are ${activeTables.length} active table(s): Table ${tableNumbers}.\n\nPlease close all tables before closing the shift.`);
      setClosingDialogOpen(false);
      return;
    }
    
    closeShiftMutation.mutate({
      closingCash: Number(closingCash),
      notes: notes || undefined,
    });
  };

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
          background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        📊 Shift Closing Report
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {!activeShift && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            No active shift found. Please start a shift to view the closing report.
          </Alert>
        )}
        {activeTables.length > 0 && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              ⚠️ Active Tables Detected!
            </Typography>
            <Typography variant="body2">
              There are {activeTables.length} active table(s): Table {activeTables.map((t: any) => t.tableNumber).join(', ')}.
              <br />
              Please close all tables before closing the shift.
            </Typography>
          </Alert>
        )}
        {activeShift && report && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, color: '#00BCD4' }}>
              👤 Employee: {report.employee?.name || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              🕐 Started: {new Date(report.startedAt).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ⏱️ Duration: {(() => {
                const startTime = new Date(report.startedAt).getTime();
                const endTime = report.endedAt ? new Date(report.endedAt).getTime() : Date.now();
                const duration = Math.max(0, Math.round((endTime - startTime) / 60000));
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return `${hours}h ${minutes}m`;
              })()}
            </Typography>
            <Typography variant="body2">
              💵 Opening Cash: PKR {Math.ceil(Number(report.openingCash || 0))}
            </Typography>
          </Box>
        )}
        <TableContainer 
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0, 188, 212, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount (PKR)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Display each game's totals */}
              {gameTotals.map((game: any) => (
                <TableRow key={game.gameName}>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    🎮 {game.gameName} ({game.tableSessions} session{game.tableSessions !== 1 ? 's' : ''})
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                    PKR {Math.ceil(game.total)}
                  </TableCell>
                </TableRow>
              ))}
              {gameTotals.length === 0 && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>🎱 Games Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                    PKR {Math.ceil(snookerTotal)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>🛒 Canteen</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                  PKR {Math.ceil(canteenTotal)}
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'rgba(0, 188, 212, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Subtotal (Before Tax)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#00BCD4' }}>
                  PKR {Math.ceil(snookerTotal + canteenTotal)}
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'rgba(0, 188, 212, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Total Sales (With Tax)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#00BCD4' }}>
                  PKR {Math.ceil(total)}
                </TableCell>
              </TableRow>
              
              {/* Detailed Tax Information */}
              <TableRow>
                <TableCell colSpan={2} sx={{ pt: 3, pb: 1, fontWeight: 'bold', fontSize: '1.05rem', color: '#FF9800' }}>
                  💰 Tax Breakdown
                </TableCell>
              </TableRow>
              {gameTotals.map((game: any) => (
                game.tax > 0 && (
                  <TableRow key={`tax-${game.gameName}`}>
                    <TableCell sx={{ pl: 4, fontWeight: 'medium', fontSize: '0.9rem' }}>
                      🎮 {game.gameName} Tax ({game.sessionsWithTax} of {game.tableSessions} sessions)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.9rem' }}>
                      PKR {Math.ceil(game.tax)}
                    </TableCell>
                  </TableRow>
                )
              ))}
              {canteenTax > 0 && (
                <TableRow>
                  <TableCell sx={{ pl: 4, fontWeight: 'medium', fontSize: '0.9rem' }}>
                    🛒 Canteen Tax ({canteenSalesWithTax} sale{canteenSalesWithTax !== 1 ? 's' : ''} with tax)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.9rem' }}>
                    PKR {Math.ceil(canteenTax)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>💰 Total Taxes Collected</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#FF9800' }}>
                  PKR {Math.ceil(totalTaxes)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>💸 Expenses</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                  PKR {Math.ceil(expense)}
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>💰 Profit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#4CAF50' }}>
                  PKR {Math.ceil(profit)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button 
          onClick={handleCloseDay} 
          variant="contained" 
          color="error"
          disabled={!activeShift || closeShiftMutation.isPending || activeTables.length > 0}
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)',
            boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
              boxShadow: '0 6px 20px rgba(244, 67, 54, 0.6)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {closeShiftMutation.isPending ? 'Closing...' : 'Close Shift!'}
        </Button>
        <Button 
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #00BCD4 30%, #0097A7 90%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0, 188, 212, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0097A7 30%, #00BCD4 90%)',
              boxShadow: '0 6px 20px rgba(0, 188, 212, 0.6)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>

      {/* Closing Dialog */}
      <Dialog 
        open={closingDialogOpen} 
        onClose={() => !closeShiftMutation.isPending && setClosingDialogOpen(false)}
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
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.3rem',
            py: 2,
          }}
        >
          🔒 Close Shift
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {activeShift && (
            <Box>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Opening Cash: PKR {Math.ceil(Number(activeShift.openingCash || 0))}
                </Typography>
                <Typography variant="body2">
                  Cash Sales: PKR {Math.ceil(report?.totalCash || 0)}
                </Typography>
                <Typography variant="body2" color="error">
                  Expenses: PKR {Math.ceil(report?.totalExpenses || 0)}
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  Expected Cash: PKR {Math.ceil(Number(activeShift.openingCash || 0) + (report?.totalCash || 0) - (report?.totalExpenses || 0))}
                </Typography>
              </Alert>
              
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
              
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
          <Button 
            onClick={() => setClosingDialogOpen(false)}
            disabled={closeShiftMutation.isPending}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmClose}
            disabled={closeShiftMutation.isPending || !closingCash}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #f44336 30%, #d32f2f 90%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 30%, #f44336 90%)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.6)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            {closeShiftMutation.isPending ? 'Closing...' : 'Confirm Close'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Alert */}
      <Snackbar
        open={successAlertOpen}
        autoHideDuration={6000}
        onClose={() => setSuccessAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: 2,
        }}
      >
        <Alert
          onClose={() => setSuccessAlertOpen(false)}
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            minWidth: 400,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white',
              fontSize: '2rem',
            },
            '& .MuiAlert-action': {
              color: 'white',
              '& .MuiIconButton-root': {
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              },
            },
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', mb: 1 }}>
            ✅ Shift Closed Successfully!
          </AlertTitle>
          <Box sx={{ mt: 1 }}>
            {successData && (
              <>
                <Typography variant="body2" sx={{ mb: 0.5, opacity: 0.95 }}>
                  <strong>Closing Cash:</strong> PKR {Math.ceil(Number(successData.closingCash || 0))}
                </Typography>
                {successData.cashDiscrepancy !== undefined && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      opacity: 0.95,
                      color: Number(successData.cashDiscrepancy) === 0 ? '#C8E6C9' : Number(successData.cashDiscrepancy) > 0 ? '#FFF9C4' : '#FFCDD2',
                      fontWeight: 'bold',
                    }}
                  >
                    <strong>Cash Discrepancy:</strong> PKR {Math.ceil(Number(successData.cashDiscrepancy || 0))}
                    {Number(successData.cashDiscrepancy) === 0 && ' ✓ Perfect!'}
                    {Number(successData.cashDiscrepancy) > 0 && ' (Over)'}
                    {Number(successData.cashDiscrepancy) < 0 && ' (Short)'}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                  Shift ended at {new Date(successData.endedAt).toLocaleString()}
                </Typography>
              </>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

