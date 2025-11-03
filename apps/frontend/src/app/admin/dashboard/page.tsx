'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Link,
} from '@mui/material';
import api from '@/lib/api';
import { format } from 'date-fns';
import { LowStockAlert } from '@/components/low-stock-alert';
import NextLink from 'next/link';

export default function AdminDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: dailyReport, isLoading } = useQuery({
    queryKey: ['reports', 'daily', today],
    queryFn: async () => {
      const response = await api.get(`/reports/daily?date=${today}`);
      return response.data;
    },
  });

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      try {
        const response = await api.get('/inventory/low-stock?threshold=10');
        return response.data;
      } catch (error) {
        return [];
      }
    },
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <LowStockAlert />
      
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {lowStockProducts.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Link component={NextLink} href="/admin/inventory" underline="hover">
              View Inventory
            </Link>
          }
        >
          <strong>{lowStockProducts.length} products</strong> are low in stock.
          Review and restock soon.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Sales Summary */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Sales
              </Typography>
              <Typography variant="h4">
                ${dailyReport?.totalSales?.toFixed(2) || '0.00'}
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
              <Typography variant="h4">
                {dailyReport?.saleCount || 0}
              </Typography>
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
                ${dailyReport?.totalCash?.toFixed(2) || '0.00'}
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
                ${dailyReport?.totalCard?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Products Today
            </Typography>
            {dailyReport?.topProducts?.length > 0 ? (
              <Box>
                {dailyReport.topProducts.slice(0, 5).map((item: any, index: number) => (
                  <Box
                    key={item.product.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: index < 4 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography>{item.product.name}</Typography>
                    <Typography>
                      {item.quantity} sold - ${item.revenue.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">No sales today</Typography>
            )}
          </Paper>
        </Grid>

        {/* Table Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Table Usage
            </Typography>
            <Typography variant="h3" color="primary">
              {dailyReport?.tableSessions || 0}
            </Typography>
            <Typography color="textSecondary">Tables used today</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

