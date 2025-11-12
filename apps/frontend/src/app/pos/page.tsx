'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Avatar,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart-store';
import { CartDrawer } from '@/components/cart-drawer';
import { PaymentModal } from '@/components/payment-modal';
import { TableSelector } from '@/components/table-selector';
import { PaymentMethod } from '@prisma/client';
import { dataCache, CACHE_KEYS } from '@/lib/data-cache';

export default function POSPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { items, total, clearCart, tableId, setTable } = useCartStore();

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
    initialData: () => dataCache.get(CACHE_KEYS.PRODUCTS) || undefined,
  });

  // Fetch selected table details
  const { data: selectedTable } = useQuery({
    queryKey: ['tables', tableId],
    queryFn: async () => {
      if (!tableId) return null;
      try {
        const response = await api.get(`/tables/${tableId}`);
        return response.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!tableId,
  });

  // Calculate table charge if table is active (excluding paused time)
  const calculateTableCharge = () => {
    if (!selectedTable || !selectedTable.startedAt) {
      return 0;
    }
    
    // Only charge if table is OCCUPIED (not paused or available)
    if (selectedTable.status !== 'OCCUPIED') {
      return 0;
    }
    
    const start = new Date(selectedTable.startedAt).getTime();
    const now = Date.now();
    const totalElapsed = now - start;
    
    // Get total paused time
    const totalPausedMs = selectedTable.totalPausedMs || 0;
    
    // Calculate active time (excluding paused time)
    const activeTimeMs = totalElapsed - totalPausedMs;
    const hours = activeTimeMs / (1000 * 60 * 60);
    
    return hours * Number(selectedTable.ratePerHour);
  };

  const tableCharge = calculateTableCharge();
  const tableChargeTax = tableCharge * 0.15; // 15% tax on table charge
  const finalTotal = total + tableCharge + tableChargeTax;

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await api.post('/sales', saleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      clearCart();
      setCartOpen(false);
      setPaymentOpen(false);
    },
  });


  // Filter products by search
  const filteredProducts = products.filter((product: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.barcode?.includes(query)
    );
  });

  const handleCheckout = () => {
    setCartOpen(false);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = async (paymentData: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
  }) => {
    // Calculate totals from items
    const itemsSubtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const itemsDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const itemsTax = items.reduce((sum, item) => sum + (item.tax || 0), 0);

    // Create sale data - tableId is optional (allows sales without table)
    const saleData = {
      tableId: tableId || undefined, // Can be undefined for non-table sales
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        subtotal: item.subtotal || 0,
        notes: item.notes,
      })),
      subtotal: itemsSubtotal + tableCharge,
      discount: itemsDiscount,
      tax: itemsTax + tableChargeTax,
      total: finalTotal,
      paymentMethod: paymentData.paymentMethod,
      cashReceived: paymentData.cashReceived,
      change: paymentData.change,
      clientId: localStorage.getItem('client_id'),
    };

    const result = await createSaleMutation.mutateAsync(saleData);
    
    // Stop table if selected (whether OCCUPIED or PAUSED) - after sale is created
    if (tableId && (selectedTable?.status === 'OCCUPIED' || selectedTable?.status === 'PAUSED')) {
      try {
        await api.post(`/tables/${tableId}/stop`, {
          paymentAmount: paymentData.cashReceived || finalTotal,
        });
        queryClient.invalidateQueries({ queryKey: ['tables'] });
      } catch (error) {
        console.error('Error stopping table:', error);
      }
    }
    
    // Print receipt/bill if Electron
    if (result?.id && window.electronAPI) {
      setTimeout(() => handlePrintReceipt(result.id), 500);
    }
  };

  // Print receipt (if Electron) - called after successful payment
  const handlePrintReceipt = async (saleId: string) => {
    if (window.electronAPI) {
      try {
        // Get sale from API
        const response = await api.get(`/sales/${saleId}`);
        const sale = response.data;

        if (sale) {
          // Calculate table charge from sale subtotal vs items subtotal
          const itemsSubtotal = (sale.items || []).reduce(
            (sum: number, item: any) => sum + Number(item.subtotal || 0),
            0
          );
          const tableCharge = Number(sale.subtotal) - itemsSubtotal;

          const lines = [
            '═══════════════════════',
            '   CUE & CONSOLE',
            '═══════════════════════',
            `Receipt #${sale.receiptNumber || sale.id}`,
            `Date: ${new Date(sale.createdAt).toLocaleString()}`,
            '',
            sale.table ? `Table: ${sale.table.tableNumber || sale.table}` : 'Walk-in Sale',
            sale.employee ? `Staff: ${sale.employee.name || sale.employee}` : '',
            '',
            '───────────────────────',
            'ITEMS:',
            '───────────────────────',
            ...(sale.items || []).map(
              (item: any) =>
                `${item.product?.name || 'Item'} x${item.quantity} @ $${(item.unitPrice || 0).toFixed(2)} = $${(item.subtotal || 0).toFixed(2)}`,
            ),
            ...(tableCharge > 0 ? [
              '',
              `Table Charge: $${tableCharge.toFixed(2)}`,
            ] : []),
            '',
            '───────────────────────',
            `Subtotal: $${Number(sale.subtotal).toFixed(2)}`,
            ...(sale.discount && sale.discount > 0 ? [`Discount: -$${Number(sale.discount).toFixed(2)}`] : []),
            `Tax: $${Number(sale.tax).toFixed(2)}`,
            '───────────────────────',
            `TOTAL: $${Number(sale.total).toFixed(2)}`,
            '',
            `Payment Method: ${sale.paymentMethod}`,
            ...(sale.cashReceived ? [`Cash Received: $${Number(sale.cashReceived).toFixed(2)}`] : []),
            ...(sale.change && sale.change > 0 ? [`Change: $${Number(sale.change).toFixed(2)}`] : []),
            '',
            '═══════════════════════',
            '  Thank you for your',
            '        visit!',
            '═══════════════════════',
            '',
          ].filter(Boolean);

          await window.electronAPI.printReceipt({ lines });
        }
      } catch (error) {
        console.error('Print error:', error);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
            <Avatar
              sx={{
                width: { xs: 36, sm: 44, md: 52 },
                height: { xs: 36, sm: 44, md: 52 },
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 25%, #FFA07A 50%, #FFB347 75%, #FFD700 100%)',
                boxShadow: '0 4px 20px rgba(255, 107, 107, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' },
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: '0 6px 30px rgba(255, 107, 107, 0.7), 0 0 40px rgba(255, 215, 0, 0.5)',
                }
              }}
            >
              🎱
            </Avatar>
            <Typography 
              variant="h5" 
              component="div"
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2rem' },
                letterSpacing: { xs: 1.5, sm: 2, md: 2.5 },
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 30%, #ffffff 60%, #e8eaf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 4px 8px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                position: 'relative',
                display: 'inline-block',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-4px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
                  borderRadius: '2px',
                },
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  filter: 'brightness(1.1)',
                }
              }}
            >
              Cue & Console
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={() => setCartOpen(true)}>
            <Badge badgeContent={items.length} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 2, flex: 1, overflow: 'auto' }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search products by name, SKU, or barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="body2">🔍</Typography>
              </InputAdornment>
            ),
          }}
        />

        {/* Table Selector */}
        <TableSelector
          selectedTableId={tableId}
          onSelectTable={setTable}
          onCheckout={(tableId) => {
            setTable(tableId);
            setCartOpen(true);
            handleCheckout();
          }}
          onStopTimer={(tableId) => {
            // Table stopped, refresh data
            queryClient.invalidateQueries({ queryKey: ['tables'] });
          }}
        />

        {/* Product Grid */}
        <Grid container spacing={2}>
          {filteredProducts.map((product: any) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={product.id}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover', transform: 'scale(1.02)' },
                  transition: 'all 0.2s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => {
                  useCartStore.getState().addItem(product);
                  setCartOpen(true);
                }}
              >
                <Typography variant="subtitle2" noWrap>
                  {product.name}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  ${Number(product.price).toFixed(2)}
                </Typography>
                {product.stock < 10 && (
                  <Chip
                    label="Low Stock"
                    color="warning"
                    size="small"
                    sx={{ mt: 1, alignSelf: 'flex-start' }}
                  />
                )}
                {product.stock === 0 && (
                  <Chip
                    label="Out of Stock"
                    color="error"
                    size="small"
                    sx={{ mt: 1, alignSelf: 'flex-start' }}
                  />
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        {filteredProducts.length === 0 && !isLoading && (
          <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
            No products found
          </Typography>
        )}
      </Container>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
        tableCharge={tableCharge}
      />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={finalTotal}
        onComplete={handlePaymentComplete}
      />
    </Box>
  );
}
