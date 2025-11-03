'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function AdminSalesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', 'list', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      
      const response = await api.get(`/sales?${params.toString()}`);
      return response.data;
    },
  });

  // Filter sales by search query
  const filteredSales = sales.filter((sale: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sale.receiptNumber?.toLowerCase().includes(query) ||
      sale.employee?.name?.toLowerCase().includes(query) ||
      sale.id.toLowerCase().includes(query)
    );
  });

  // Calculate summary statistics
  const totalSales = filteredSales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
  const totalTransactions = filteredSales.length;
  const cashSales = filteredSales
    .filter((s: any) => s.paymentMethod === 'CASH' || s.paymentMethod === 'MIXED')
    .reduce((sum: number, s: any) => sum + Number(s.total), 0);
  const cardSales = filteredSales
    .filter((s: any) => s.paymentMethod === 'CARD')
    .reduce((sum: number, s: any) => sum + Number(s.total), 0);

  const handleViewDetails = async (sale: any) => {
    try {
      const response = await api.get(`/sales/${sale.id}`);
      setSelectedSale(response.data);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
    }
  };

  const handlePrintReceipt = async (sale: any) => {
    if (window.electronAPI) {
      const lines = [
        'SNOOKER POS',
        '================',
        `Receipt #${sale.receiptNumber || sale.id}`,
        `Date: ${new Date(sale.createdAt).toLocaleString()}`,
        '',
        ...(sale.items || []).map(
          (item: any) =>
            `${item.product?.name || 'Item'} x${item.quantity} - $${(item.subtotal || 0).toFixed(2)}`,
        ),
        '',
        `Subtotal: $${sale.subtotal.toFixed(2)}`,
        `Tax: $${sale.tax.toFixed(2)}`,
        `Total: $${sale.total.toFixed(2)}`,
        `Payment: ${sale.paymentMethod}`,
        sale.change && sale.change > 0 ? `Change: $${sale.change.toFixed(2)}` : '',
        '',
        'Thank you!',
      ].filter(Boolean);

      await window.electronAPI.printReceipt({ lines });
    } else {
      alert('Printing is only available in the Electron app');
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'success';
      case 'CARD':
        return 'info';
      case 'MIXED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sales History
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sales
              </Typography>
              <Typography variant="h5">
                ${totalSales.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Transactions
              </Typography>
              <Typography variant="h5">{totalTransactions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cash
              </Typography>
              <Typography variant="h5">
                ${cashSales.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Card
              </Typography>
              <Typography variant="h5">
                ${cardSales.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by receipt number, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>

      {/* Sales Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Receipt #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.length > 0 ? (
              filteredSales.map((sale: any) => (
                <TableRow key={sale.id} hover>
                  <TableCell>
                    <strong>{sale.receiptNumber || sale.id.slice(0, 8)}</strong>
                  </TableCell>
                  <TableCell>
                    {format(new Date(sale.createdAt), 'PPp')}
                  </TableCell>
                  <TableCell>{sale.employee?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {sale.table ? `Table ${sale.table.tableNumber}` : '-'}
                  </TableCell>
                  <TableCell>{sale.items?.length || 0} items</TableCell>
                  <TableCell>
                    <strong>${Number(sale.total).toFixed(2)}</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sale.paymentMethod}
                      color={getPaymentMethodColor(sale.paymentMethod) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(sale)}
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handlePrintReceipt(sale)}
                      title="Print Receipt"
                    >
                      <PrintIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {isLoading ? 'Loading...' : 'No sales found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sale Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Sale Details: {selectedSale?.receiptNumber || selectedSale?.id}
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography>
                    {format(new Date(selectedSale.createdAt), 'PPp')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Employee
                  </Typography>
                  <Typography>{selectedSale.employee?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Table
                  </Typography>
                  <Typography>
                    {selectedSale.table ? `Table ${selectedSale.table.tableNumber}` : 'Walk-in'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Chip
                    label={selectedSale.paymentMethod}
                    color={getPaymentMethodColor(selectedSale.paymentMethod) as any}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Items
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSale.items?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.product?.name || 'Unknown'}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ${Number(item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ${Number(item.subtotal).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Typography variant="body2">
                  Subtotal: ${Number(selectedSale.subtotal).toFixed(2)}
                </Typography>
                {selectedSale.discount > 0 && (
                  <Typography variant="body2" color="secondary">
                    Discount: -${Number(selectedSale.discount).toFixed(2)}
                  </Typography>
                )}
                <Typography variant="body2">
                  Tax: ${Number(selectedSale.tax).toFixed(2)}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Total: ${Number(selectedSale.total).toFixed(2)}
                </Typography>
                {selectedSale.cashReceived && (
                  <Typography variant="body2">
                    Cash Received: ${Number(selectedSale.cashReceived).toFixed(2)}
                  </Typography>
                )}
                {selectedSale.change && selectedSale.change > 0 && (
                  <Typography variant="body2">
                    Change: ${Number(selectedSale.change).toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedSale && (
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintReceipt(selectedSale)}
            >
              Print Receipt
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

