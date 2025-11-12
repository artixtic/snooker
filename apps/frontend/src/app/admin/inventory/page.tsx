'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
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
  TextField,
  MenuItem,
  Alert,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminInventoryPage() {
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    change: '',
    reason: '',
    type: 'adjustment', // adjustment, received, sold, damaged, etc.
  });
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['inventory', 'movements', selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];
      try {
        const response = await api.get(`/inventory/movements?productId=${selectedProduct.id}`);
        return response.data;
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedProduct?.id,
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

  const createMovementMutation = useMutation({
    mutationFn: async (data: { productId: string; change: number; reason: string }) => {
      const response = await api.post('/inventory/movements', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleCloseAdjustmentDialog();
    },
  });

  const handleOpenAdjustment = (product: any) => {
    setSelectedProduct(product);
    setAdjustmentData({ change: '', reason: '', type: 'adjustment' });
    setAdjustmentDialogOpen(true);
  };

  const handleCloseAdjustmentDialog = () => {
    setAdjustmentDialogOpen(false);
    setSelectedProduct(null);
    setAdjustmentData({ change: '', reason: '', type: 'adjustment' });
  };

  const handleOpenHistory = (product: any) => {
    setSelectedProduct(product);
    setHistoryDialogOpen(true);
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct || !adjustmentData.change || !adjustmentData.reason) {
      alert('Please fill all fields');
      return;
    }

    const change = parseFloat(adjustmentData.change);
    if (isNaN(change) || change === 0) {
      alert('Change amount must be a non-zero number');
      return;
    }

    try {
      await createMovementMutation.mutateAsync({
        productId: selectedProduct.id,
        change,
        reason: `${adjustmentData.type}: ${adjustmentData.reason}`,
      });
    } catch (error) {
      console.error('Failed to create inventory movement:', error);
    }
  };

  const getReasonColor = (reason: string) => {
    if (reason.includes('received') || reason.includes('adjustment') && reason.includes('+')) {
      return 'success';
    }
    if (reason.includes('damaged') || reason.includes('lost')) {
      return 'error';
    }
    return 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Inventory Management
      </Typography>

      {lowStockProducts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>{lowStockProducts.length} products</strong> are low in stock (≤10 units).
          Consider restocking soon.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Selling Price</TableCell>
              <TableCell>Buying Price</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={product.stock}
                    color={
                      product.stock === 0
                        ? 'error'
                        : product.stock < 10
                        ? 'warning'
                        : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{product.category || '-'}</TableCell>
                <TableCell>PKR {Number(product.price).toFixed(2)}</TableCell>
                <TableCell>
                  {product.cost ? `PKR ${Number(product.cost).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenAdjustment(product)}
                    title="Adjust Stock"
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenHistory(product)}
                    title="View History"
                  >
                    <HistoryIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Stock Adjustment Dialog */}
      <Dialog
        open={adjustmentDialogOpen}
        onClose={handleCloseAdjustmentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Adjust Stock: {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Stock: <strong>{selectedProduct?.stock || 0}</strong>
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={adjustmentData.type}
                onChange={(e) =>
                  setAdjustmentData({ ...adjustmentData, type: e.target.value })
                }
                label="Adjustment Type"
              >
                <MenuItem value="adjustment">General Adjustment</MenuItem>
                <MenuItem value="received">Stock Received</MenuItem>
                <MenuItem value="sold">Stock Sold (Manual)</MenuItem>
                <MenuItem value="damaged">Damaged/Lost</MenuItem>
                <MenuItem value="returned">Returned</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Change Amount"
              type="number"
              fullWidth
              required
              value={adjustmentData.change}
              onChange={(e) =>
                setAdjustmentData({ ...adjustmentData, change: e.target.value })
              }
              helperText="Use positive for increase, negative for decrease. Example: +10 or -5"
              inputProps={{ step: 1 }}
            />

            <TextField
              label="Reason/Notes"
              multiline
              rows={3}
              fullWidth
              required
              value={adjustmentData.reason}
              onChange={(e) =>
                setAdjustmentData({ ...adjustmentData, reason: e.target.value })
              }
              placeholder="Enter reason for this stock adjustment..."
            />

            {adjustmentData.change && (
              <Alert severity="info">
                New stock will be:{' '}
                <strong>
                  {selectedProduct?.stock || 0} + ({adjustmentData.change}) ={' '}
                  {(selectedProduct?.stock || 0) + parseFloat(adjustmentData.change || '0')}
                </strong>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdjustmentDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitAdjustment}
            variant="contained"
            disabled={
              !adjustmentData.change ||
              !adjustmentData.reason ||
              createMovementMutation.isPending
            }
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Movement History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={handleCloseHistoryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Movement History: {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Change</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.length > 0 ? (
                  movements.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movement.change > 0 ? `+${movement.change}` : movement.change}
                          color={getReasonColor(movement.reason) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>{movement.user?.name || 'System'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No movements recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

