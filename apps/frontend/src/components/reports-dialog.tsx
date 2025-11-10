'use client';

import { useQuery } from '@tanstack/react-query';
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
} from '@mui/material';
import api from '@/lib/api';

interface ReportsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ReportsDialog({ open, onClose }: ReportsDialogProps) {
  const { data: report } = useQuery({
    queryKey: ['daily-report'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/reports/daily?date=${today}`);
      return response.data;
    },
    enabled: open,
  });

  // Get totals from report
  const snookerTotal = report?.snookerTotal || 0;
  const canteenTotal = report?.canteenTotal || 0;
  const total = (report?.totalSales || 0);
  const expense = report?.totalExpenses || 0;
  const profit = total - expense;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reports</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  <strong>Snooker/Billard</strong>
                </TableCell>
                <TableCell align="right">{snookerTotal.toFixed(1)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <strong>Canteen</strong>
                </TableCell>
                <TableCell align="right">{canteenTotal.toFixed(1)}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                <TableCell>
                  <strong>Total</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{total.toFixed(1)}</strong>
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#ffebee' }}>
                <TableCell>
                  <strong>Expense</strong>
                </TableCell>
                <TableCell align="right">{expense.toFixed(1)}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                <TableCell>
                  <strong>Profit</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{profit.toFixed(1)}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="error">
          Close Today!
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

