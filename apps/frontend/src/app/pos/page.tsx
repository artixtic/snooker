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
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { db } from '@/lib/db';
import { startSync, addToSyncQueue } from '@/lib/sync';
import { useCartStore } from '@/store/cart-store';
import { CartDrawer } from '@/components/cart-drawer';
import { PaymentModal } from '@/components/payment-modal';
import { TableSelector } from '@/components/table-selector';
import { PaymentMethod } from '@prisma/client';

export default function POSPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { items, total, clearCart, tableId, setTable } = useCartStore();

  // Fetch products (with offline support)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const response = await api.get('/products');
        await db.products.bulkPut(response.data);
        return response.data;
      } catch (error) {
        return db.products.where('deleted').equals(false).toArray();
      }
    },
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

  // Calculate table charge if table is active
  const calculateTableCharge = () => {
    if (!selectedTable || selectedTable.status !== 'OCCUPIED' || !selectedTable.startedAt) {
      return 0;
    }
    const start = new Date(selectedTable.startedAt).getTime();
    const now = Date.now();
    const hours = (now - start) / (1000 * 60 * 60);
    return hours * Number(selectedTable.ratePerHour);
  };

  const tableCharge = calculateTableCharge();
  const tableChargeTax = tableCharge * 0.15; // 15% tax on table charge
  const finalTotal = total + tableCharge + tableChargeTax;

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      try {
        const response = await api.post('/sales', saleData);
        return response.data;
      } catch (error: any) {
        // If offline, save to local DB and sync queue
        if (!navigator.onLine) {
          const localSale = {
            ...saleData,
            id: `local_${Date.now()}`,
            synced: false,
            createdAt: new Date(),
          };
          await db.sales.add(localSale);
          await addToSyncQueue('sale', 'create', localSale.id, saleData);
          return localSale;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      clearCart();
      setCartOpen(false);
      setPaymentOpen(false);
    },
  });

  useEffect(() => {
    startSync(30000); // Sync every 30 seconds
  }, []);

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
    // Stop table if selected
    if (tableId && selectedTable?.status === 'OCCUPIED') {
      try {
        await api.post(`/tables/${tableId}/stop`, {});
      } catch (error) {
        console.error('Error stopping table:', error);
      }
    }

    const saleData = {
      tableId: tableId || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal,
        notes: item.notes,
      })),
      subtotal: subtotal + tableCharge,
      discount: discount,
      tax: tax + tableChargeTax,
      total: finalTotal,
      paymentMethod: paymentData.paymentMethod,
      cashReceived: paymentData.cashReceived,
      change: paymentData.change,
      clientId: localStorage.getItem('client_id'),
    };

    const result = await createSaleMutation.mutateAsync(saleData);
    
    // Print receipt if Electron
    if (result?.id && window.electronAPI) {
      setTimeout(() => handlePrintReceipt(result.id), 500);
    }
  };

  // Print receipt (if Electron) - called after successful payment
  const handlePrintReceipt = async (saleId: string) => {
    if (window.electronAPI) {
      try {
        // Get sale from API or local DB
        let sale;
        try {
          const response = await api.get(`/sales/${saleId}`);
          sale = response.data;
        } catch (error) {
          sale = await db.sales.get(saleId);
        }

        if (sale) {
          const lines = [
            'SNOOKER POS',
            '================',
            `Receipt #${sale.receiptNumber || sale.id}`,
            `Date: ${new Date(sale.createdAt).toLocaleString()}`,
            sale.table ? `Table: ${sale.table.tableNumber || sale.table}` : '',
            sale.employee ? `Staff: ${sale.employee.name || sale.employee}` : '',
            '',
            'Items:',
            ...(sale.items || []).map(
              (item: any) =>
                `${item.product?.name || 'Item'} x${item.quantity} @ $${(item.unitPrice || 0).toFixed(2)} = $${(item.subtotal || 0).toFixed(2)}`,
            ),
            '',
            '----------------',
            `Subtotal: $${Number(sale.subtotal).toFixed(2)}`,
            sale.discount && sale.discount > 0 ? `Discount: -$${Number(sale.discount).toFixed(2)}` : '',
            `Tax: $${Number(sale.tax).toFixed(2)}`,
            '----------------',
            `Total: $${Number(sale.total).toFixed(2)}`,
            `Payment: ${sale.paymentMethod}`,
            sale.cashReceived ? `Cash Received: $${Number(sale.cashReceived).toFixed(2)}` : '',
            sale.change && sale.change > 0 ? `Change: $${Number(sale.change).toFixed(2)}` : '',
            '',
            'Thank you for your visit!',
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Snooker POS
          </Typography>
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
                  ${product.price.toFixed(2)}
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
