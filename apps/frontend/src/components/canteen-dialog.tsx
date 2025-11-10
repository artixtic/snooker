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
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import api from '@/lib/api';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CanteenDialogProps {
  open: boolean;
  onClose: () => void;
  table: any;
  items?: CartItem[];
  onItemsChange?: (items: CartItem[]) => void;
}

export function CanteenDialog({ open, onClose, table, items: initialItems = [], onItemsChange }: CanteenDialogProps) {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const queryClient = useQueryClient();

  // Sync items when initialItems change (when dialog opens with existing items)
  useEffect(() => {
    if (open) {
      setItems(initialItems);
    }
  }, [open, initialItems]);

  // Update parent when items change
  const updateItems = (newItems: CartItem[]) => {
    setItems(newItems);
    if (onItemsChange) {
      onItemsChange(newItems);
    }
  };

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
        alert(`Insufficient stock for ${product.name}. Available: ${product.stock}, Already in cart: ${currentQuantityInCart}, Requested: ${quantity}`);
        return;
      }
      
      if (product.stock === 0) {
        alert(`${product.name} is out of stock.`);
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
      updateItems(newItems);
      setSelectedItem('');
      setQuantity(1);
    }
  };

  const removeItem = (productId: string) => {
    const newItems = items.filter((i) => i.productId !== productId);
    updateItems(newItems);
  };

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
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
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        🛒 Canteen - Snooker {table?.tableNumber || 'N/A'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <TableContainer 
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Canteen Item</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.productId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {item.name} (PKR {item.price})
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {(Number(item.price) * item.quantity).toFixed(0)}
                  </TableCell>
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
              <TableRow>
                <TableCell colSpan={3}>
                  <strong>Total:</strong>
                </TableCell>
                <TableCell>
                  <strong>{total.toFixed(0)}</strong>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ 
          mt: 3, 
          p: 2, 
          borderRadius: 2, 
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          display: 'flex', 
          gap: 1, 
          alignItems: 'center' 
        }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Item</InputLabel>
            <Select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              label="Item"
              sx={{
                borderRadius: 2,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2196F3',
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
            label="Qty"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            sx={{ 
              width: 100,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#2196F3',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2196F3',
                  borderWidth: 2,
                },
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={addItem}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #4CAF50 30%, #45a049 90%)',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 30%, #4CAF50 90%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
              },
            }}
          >
            Add Item
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button 
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #2196F3 30%, #1976D2 90%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1976D2 30%, #2196F3 90%)',
              boxShadow: '0 6px 20px rgba(33, 150, 243, 0.6)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

