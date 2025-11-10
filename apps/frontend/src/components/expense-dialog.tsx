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

  const handleSubmit = () => {
    if (expenseName && amount) {
      createMutation.mutate({
        description: expenseName,
        amount: parseFloat(amount),
        category: 'OTHER',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Expense</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Add Expense
              </Typography>
              <TextField
                fullWidth
                label="Expense name"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                margin="normal"
                placeholder="Expense name"
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                margin="normal"
                placeholder="Amount"
              />
              <Button
                variant="contained"
                color="success"
                startIcon={<Add />}
                onClick={handleSubmit}
                sx={{ mt: 2 }}
              >
                Add Expense
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Expense List
              </Typography>
              {expenses.length === 0 ? (
                <Alert severity="warning">
                  You have not added any thing yet!
                </Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Expense</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.map((expense: any, index: number) => (
                        <TableRow key={expense.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>Rs. {Number(expense.amount).toFixed(2)}</TableCell>
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
      <DialogActions>
        <Button onClick={onClose}>x Close</Button>
      </DialogActions>
    </Dialog>
  );
}

