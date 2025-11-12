'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Grid,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { Typography } from '@mui/material';
import api from '@/lib/api';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExpenseDialog({ open, onClose }: ExpenseDialogProps) {
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await api.get('/expenses');
      return response.data;
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setExpenseName('');
      setAmount('');
    },
  });

  const handleSubmit = async () => {
    if (expenseName && amount) {
      try {
        await createMutation.mutateAsync({
          description: expenseName,
          amount: parseFloat(amount),
          category: 'OTHER',
        });
      } catch (error) {
        console.error('Failed to create expense:', error);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
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
          background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        💰 Expense Management
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
                  color: '#9C27B0',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                ➕ Add Expense
              </Typography>
              <TextField
                fullWidth
                label="Expense name"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                margin="normal"
                placeholder="Expense name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#9C27B0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#9C27B0',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Amount (PKR)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                margin="normal"
                placeholder="Amount"
                inputProps={{ min: 0, inputMode: 'decimal', pattern: '[0-9.]*' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#9C27B0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#9C27B0',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
                  },
                }}
              >
                Add Expense
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
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
                  color: '#9C27B0',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                📋 Expense List
              </Typography>
              {expenses.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                  }}
                >
                  <Alert 
                    severity="warning"
                    sx={{
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: '1.5rem',
                      },
                    }}
                  >
                    ⚠️ You have not added any expenses yet!
                  </Alert>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper}
                  sx={{
                    borderRadius: 2,
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    overflow: 'auto',
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Expense</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.map((expense: any, index: number) => (
                        <TableRow 
                          key={expense.id}
                          sx={{
                            '&:hover': {
                              bgcolor: 'rgba(156, 39, 176, 0.05)',
                            },
                            '&:nth-of-type(even)': {
                              bgcolor: 'rgba(0, 0, 0, 0.02)',
                            },
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>{expense.description}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                            PKR {Math.ceil(Number(expense.amount))}
                          </TableCell>
                          <TableCell>
                            {new Date(expense.date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button 
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #9C27B0 30%, #7B1FA2 90%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7B1FA2 30%, #9C27B0 90%)',
              boxShadow: '0 6px 20px rgba(156, 39, 176, 0.6)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

