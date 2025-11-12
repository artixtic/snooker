'use client';

import { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Add, Remove, Close, ShoppingCart } from '@mui/icons-material';
import api from '@/lib/api';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface InventorySaleDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InventorySaleDialog({ open, onClose }: InventorySaleDialogProps) {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const queryClient = useQueryClient();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setItems([]);
      setSelectedItem('');
      setQuantity(1);
      setPaymentAmount(0);
      setTaxEnabled(true);
    }
  }, [open]);

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
    enabled: open,
  });

  const addItem = () => {
    const product = products.find((p: any) => p.id === selectedItem);
    if (product) {
      // Check stock availability
      const existingItem = items.find((i) => i.productId === product.id);
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      const totalRequested = currentQuantityInCart + quantity;
      
      if (product.stock < totalRequested) {
        setAlertMessage(`Insufficient stock for ${product.name}. Available: ${product.stock}, Already in cart: ${currentQuantityInCart}, Requested: ${quantity}`);
        setErrorAlertOpen(true);
        return;
      }
      
      if (product.stock === 0) {
        setAlertMessage(`${product.name} is out of stock.`);
        setErrorAlertOpen(true);
        return;
      }
      
      let newItems: CartItem[];
      if (existingItem) {
        newItems = items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        newItems = [
          ...items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
          },
        ];
      }
      setItems(newItems);
      setSelectedItem('');
      setQuantity(1);
    }
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    const product = products.find((p: any) => p.id === productId);
    if (product && newQuantity > product.stock) {
      setAlertMessage(`Insufficient stock. Available: ${product.stock}`);
      setErrorAlertOpen(true);
      return;
    }
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity: newQuantity } : i)));
  };

  // Calculate totals (rounded up to integers)
  const subtotal = Math.ceil(items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0));
  const tax = taxEnabled ? Math.ceil(subtotal * 0.15) : 0;
  const total = Math.ceil(subtotal + tax);

  // Update payment amount when total changes
  useEffect(() => {
    if (total > 0 && paymentAmount === 0) {
      setPaymentAmount(total);
    }
  }, [total]);

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) {
        throw new Error('Please add at least one item to the cart');
      }

      if (paymentAmount < total) {
        throw new Error(`Payment amount (PKR ${paymentAmount}) is less than total (PKR ${total})`);
      }

      // Format cart items for sale - ensure all numeric values are rounded up
      const saleItems = items.map(item => {
        const unitPrice = Math.ceil(Number(item.price));
        const itemQuantity = Number(item.quantity);
        const itemSubtotal = Math.ceil(unitPrice * itemQuantity);
        const itemTax = taxEnabled ? Math.ceil(itemSubtotal * 0.15) : 0;
        
        return {
          productId: item.productId,
          quantity: itemQuantity,
          unitPrice: unitPrice,
          discount: 0,
          tax: itemTax > 0 ? itemTax : undefined,
          subtotal: itemSubtotal,
        };
      });

      const saleData = {
        // No tableId - this is a standalone inventory sale
        subtotal: subtotal,
        tax: tax > 0 ? tax : undefined,
        total: total,
        paymentMethod: 'CASH',
        cashReceived: Math.ceil(Number(paymentAmount)),
        change: Math.ceil(Math.max(0, paymentAmount - total)),
        items: saleItems,
      };

      const saleResponse = await api.post('/sales', saleData);
      return saleResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh product stock
      setSuccessAlertOpen(true);
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create sale';
      setAlertMessage(errorMessage);
      setErrorAlertOpen(true);
    },
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        🛒 Inventory Sale
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <TableContainer 
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.productId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>PKR {item.price}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        sx={{ 
                          border: '1px solid #ccc',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' }
                        }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        inputProps={{ min: 1, style: { textAlign: 'center', width: '60px' } }}
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        sx={{ 
                          border: '1px solid #ccc',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' }
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>PKR {Math.ceil(Number(item.price) * item.quantity)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No items in cart. Add products below.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Product Section */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          mb: 3,
        }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Add Product
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <FormControl sx={{ flex: 2 }}>
              <InputLabel>Product</InputLabel>
              <Select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                label="Product"
                sx={{
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF9800',
                  },
                }}
              >
                {products
                  .filter((product: any) => !product.deleted)
                  .map((product: any) => (
                    <MenuItem key={product.id} value={product.id} disabled={product.stock === 0}>
                      {product.name} - PKR {product.price} {product.stock === 0 ? '(Out of Stock)' : `(Stock: ${product.stock})`}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addItem}
              disabled={!selectedItem}
              sx={{
                background: 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)',
                boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                  boxShadow: '0 6px 20px rgba(255, 152, 0, 0.6)',
                },
              }}
            >
              Add
            </Button>
          </Box>
        </Box>

        {/* Totals and Payment Section */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                sx={{
                  color: '#FF9800',
                  '&.Mui-checked': {
                    color: '#FF9800',
                  },
                }}
              />
            }
            label="Apply 15% Tax"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Subtotal:</Typography>
              <Typography fontWeight="bold">PKR {subtotal}</Typography>
            </Box>
            {taxEnabled && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Tax (15%):</Typography>
                <Typography fontWeight="bold">PKR {tax}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ccc', pt: 1, mt: 1 }}>
              <Typography variant="h6" fontWeight="bold">Total:</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">PKR {total}</Typography>
            </Box>
            <TextField
              label="Payment Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]*' }}
              fullWidth
              sx={{ mt: 2 }}
            />
            {paymentAmount > 0 && paymentAmount >= total && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography>Change:</Typography>
                <Typography fontWeight="bold" color="success.main">
                  PKR {Math.ceil(paymentAmount - total)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<ShoppingCart />}
          onClick={async () => {
            try {
              await createSaleMutation.mutateAsync();
            } catch (error) {
              console.error('Failed to create sale:', error);
            }
          }}
          disabled={items.length === 0 || paymentAmount < total || createSaleMutation.isPending}
          sx={{
            background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
            },
            '&:disabled': {
              background: '#ccc',
            },
          }}
        >
          {createSaleMutation.isPending ? 'Processing...' : 'Complete Sale'}
        </Button>
      </DialogActions>

      {/* Success Alert */}
      <Snackbar
        open={successAlertOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: 2,
        }}
      >
        <Alert
          onClose={() => setSuccessAlertOpen(false)}
          severity="success"
          variant="filled"
          sx={{
            minWidth: 400,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            fontSize: '1.1rem',
            '& .MuiAlert-icon': {
              color: 'white',
              fontSize: '2rem',
            },
            '& .MuiAlert-action': {
              color: 'white',
              '& .MuiIconButton-root': {
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              },
            },
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', mb: 0.5 }}>
            ✅ Sale Completed Successfully!
          </AlertTitle>
          Your sale has been processed and recorded.
        </Alert>
      </Snackbar>

      {/* Error Alert */}
      <Snackbar
        open={errorAlertOpen}
        autoHideDuration={5000}
        onClose={() => setErrorAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: 2,
        }}
      >
        <Alert
          onClose={() => setErrorAlertOpen(false)}
          severity="error"
          variant="filled"
          sx={{
            minWidth: 400,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(211, 47, 47, 0.4)',
            background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
            color: 'white',
            fontSize: '1.1rem',
            '& .MuiAlert-icon': {
              color: 'white',
              fontSize: '2rem',
            },
            '& .MuiAlert-action': {
              color: 'white',
              '& .MuiIconButton-root': {
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              },
            },
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', mb: 0.5 }}>
            ⚠️ Error
          </AlertTitle>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

