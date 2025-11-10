'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import api from '@/lib/api';

interface TableHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  table: any;
}

export function TableHistoryDialog({ open, onClose, table }: TableHistoryDialogProps) {
  const [tab, setTab] = useState(0);

  const { data: sales = [] } = useQuery({
    queryKey: ['table-sales', table?.id],
    queryFn: async () => {
      if (!table?.id) return [];
      const response = await api.get('/sales', {
        params: { tableId: table.id },
      });
      return response.data;
    },
    enabled: open && !!table?.id,
  });

  const { data: tableData } = useQuery({
    queryKey: ['table', table?.id],
    queryFn: async () => {
      if (!table?.id) return null;
      const response = await api.get(`/tables/${table.id}`);
      return response.data;
    },
    enabled: open && !!table?.id,
  });

  const getTabLabel = (index: number) => {
    switch (index) {
      case 0:
        return 'Playing';
      case 1:
        return 'Unpaid';
      case 2:
        return 'Paid';
      default:
        return '';
    }
  };

  const getTabColor = (index: number) => {
    switch (index) {
      case 0:
        return '#1976d2'; // Blue
      case 1:
        return '#ff9800'; // Orange
      case 2:
        return '#2e7d32'; // Green
      default:
        return 'default';
    }
  };

  // For Playing tab, show active session if table is occupied
  const playingData = tab === 0 && tableData?.status === 'OCCUPIED' ? [tableData] : [];
  
  // For Unpaid/Paid tabs, filter sales
  const filteredSales = tab === 0 ? [] : sales.filter((sale: any) => {
    if (tab === 1) {
      // Unpaid - sales with credit payment or unpaid
      return sale.paymentMethod === 'CREDIT' || !sale.paymentMethod;
    }
    if (tab === 2) {
      // Paid - completed sales with cash/card payment
      return sale.paymentMethod && sale.paymentMethod !== 'CREDIT';
    }
    return true;
  });
  
  const displayData = tab === 0 ? playingData : filteredSales;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Table History - Snooker {table?.tableNumber}</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
            <Tab
              label="Playing"
              sx={{
                bgcolor: tab === 0 ? getTabColor(0) : 'transparent',
                color: tab === 0 ? 'white' : 'inherit',
                '&.Mui-selected': { bgcolor: getTabColor(0), color: 'white' },
              }}
            />
            <Tab
              label="Unpaid"
              sx={{
                bgcolor: tab === 1 ? getTabColor(1) : 'transparent',
                color: tab === 1 ? 'white' : 'inherit',
                '&.Mui-selected': { bgcolor: getTabColor(1), color: 'white' },
              }}
            />
            <Tab
              label="Paid"
              sx={{
                bgcolor: tab === 2 ? getTabColor(2) : 'transparent',
                color: tab === 2 ? 'white' : 'inherit',
                '&.Mui-selected': { bgcolor: getTabColor(2), color: 'white' },
              }}
            />
          </Tabs>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Member</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Minutes</TableCell>
                <TableCell>Rate (Rs)</TableCell>
                <TableCell>Gross Total (Rs)</TableCell>
                <TableCell>Canteen</TableCell>
                <TableCell>Grand Total (Rs)</TableCell>
                <TableCell>Options</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((item: any, index: number) => {
                  // For Playing tab, item is tableData
                  // For other tabs, item is sale
                  const isPlaying = tab === 0;
                  const sale = isPlaying ? null : item;
                  const tableSession = isPlaying ? item : sale?.table;
                  
                  const duration = tableSession?.startedAt
                    ? Math.round(
                        ((tableSession.endedAt
                          ? new Date(tableSession.endedAt).getTime()
                          : Date.now()) -
                          new Date(tableSession.startedAt).getTime()) /
                          60000
                      )
                    : 0;
                  const rate = tableSession?.ratePerHour || 0;
                  const grossTotal = (duration / 60) * rate;
                  const canteenTotal = sale?.items?.reduce(
                    (sum: number, item: any) => sum + Number(item.subtotal),
                    0
                  ) || 0;
                  const grandTotal = isPlaying ? grossTotal : (Number(sale?.total) || 0);

                  return (
                    <TableRow key={isPlaying ? tableSession.id : sale.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={tableSession?.memberId || sale?.memberId || ''}
                            displayEmpty
                            disabled={tab === 2}
                          >
                            <MenuItem value="">Select Member</MenuItem>
                            {/* Members would be loaded here */}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {tableSession?.startedAt
                          ? new Date(tableSession.startedAt).toLocaleTimeString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {tableSession?.endedAt
                          ? new Date(tableSession.endedAt).toLocaleTimeString()
                          : isPlaying ? 'Playing...' : '-'}
                      </TableCell>
                      <TableCell>
                        {Math.floor(duration / 60)}:
                        {(duration % 60).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell>{rate}</TableCell>
                      <TableCell>{grossTotal.toFixed(1)}</TableCell>
                      <TableCell>{canteenTotal.toFixed(1)}</TableCell>
                      <TableCell>{grandTotal.toFixed(1)}</TableCell>
                      <TableCell>
                        {tab === 2 ? (
                          <Chip
                            label={`✔ Rs. ${grandTotal.toFixed(1)} Paid`}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Box display="flex" gap={1}>
                            <Button size="small" variant="outlined" color="warning">
                              View Bill
                            </Button>
                            <Button size="small" variant="outlined" color="primary">
                              Canteen
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

