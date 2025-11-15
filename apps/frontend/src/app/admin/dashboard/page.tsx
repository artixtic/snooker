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
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <LowStockAlert />
      
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          mb: 4,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Dashboard Overview
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
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)',
              },
            }}
          >
            <CardContent>
              <Typography 
                sx={{ 
                  opacity: 0.9, 
                  mb: 1,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Today&apos;s Sales
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '2rem',
                }}
              >
                ${dailyReport?.totalSales?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(245, 87, 108, 0.3)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(245, 87, 108, 0.4)',
              },
            }}
          >
            <CardContent>
              <Typography 
                sx={{ 
                  opacity: 0.9, 
                  mb: 1,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Transactions
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '2rem',
                }}
              >
                {dailyReport?.saleCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(79, 172, 254, 0.4)',
              },
            }}
          >
            <CardContent>
              <Typography 
                sx={{ 
                  opacity: 0.9, 
                  mb: 1,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Cash
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '2rem',
                }}
              >
                ${dailyReport?.totalCash?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(67, 233, 123, 0.3)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(67, 233, 123, 0.4)',
              },
            }}
          >
            <CardContent>
              <Typography 
                sx={{ 
                  opacity: 0.9, 
                  mb: 1,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Card
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '2rem',
                }}
              >
                ${dailyReport?.totalCard?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'white',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontWeight: 700,
                mb: 3,
                color: '#667eea',
              }}
            >
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
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontWeight: 700,
                mb: 3,
                color: '#667eea',
              }}
            >
              Table Usage
            </Typography>
            <Typography 
              variant="h3" 
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
              }}
            >
              {dailyReport?.tableSessions || 0}
            </Typography>
            <Typography 
              color="textSecondary"
              sx={{ fontSize: '0.95rem' }}
            >
              Tables used today
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

