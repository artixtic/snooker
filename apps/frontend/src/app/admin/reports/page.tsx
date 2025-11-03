'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export default function AdminReportsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', 'daily', dateStr],
    queryFn: async () => {
      const response = await api.get(`/reports/daily?date=${dateStr}`);
      return response.data;
    },
  });

  const handleExportExcel = () => {
    if (!report) return;

    const wsData = [
      ['Daily Sales Report'],
      ['Date', dateStr],
      [],
      ['Summary'],
      ['Total Sales', `$${report.totalSales?.toFixed(2) || '0.00'}`],
      ['Cash', `$${report.totalCash?.toFixed(2) || '0.00'}`],
      ['Card', `$${report.totalCard?.toFixed(2) || '0.00'}`],
      ['Transactions', report.saleCount || 0],
      ['Table Sessions', report.tableSessions || 0],
      [],
      ['Top Products'],
      ['Product', 'Quantity', 'Revenue'],
      ...(report.topProducts || []).map((item: any) => [
        item.product.name,
        item.quantity,
        `$${item.revenue.toFixed(2)}`,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
    XLSX.writeFile(wb, `daily-report-${dateStr}.xlsx`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
        {report && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
          >
            Export to Excel
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newValue) => newValue && setSelectedDate(newValue)}
            slotProps={{ textField: { fullWidth: true, sx: { maxWidth: 300 } } }}
          />
        </LocalizationProvider>
      </Paper>

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : report ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Sales
                </Typography>
                <Typography variant="h4">
                  ${report.totalSales?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Transactions
                </Typography>
                <Typography variant="h4">{report.saleCount || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cash
                </Typography>
                <Typography variant="h4">
                  ${report.totalCash?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Card
                </Typography>
                <Typography variant="h4">
                  ${report.totalCard?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.topProducts?.length > 0 ? (
                      report.topProducts.map((item: any) => (
                        <TableRow key={item.product.id}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            ${item.revenue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No sales for this date
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Container>
  );
}

