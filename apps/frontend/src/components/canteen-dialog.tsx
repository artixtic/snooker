'use client';

import { useState } from 'react';
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

interface CanteenDialogProps {
  open: boolean;
  onClose: () => void;
  table: any;
}

export function CanteenDialog({ open, onClose, table }: CanteenDialogProps) {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const queryClient = useQueryClient();

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
      const existingItem = items.find((i) => i.productId === product.id);
      if (existingItem) {
        setItems(
          items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        );
      } else {
        setItems([
          ...items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
          },
        ]);
      }
      setSelectedItem('');
      setQuantity(1);
    }
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Canteen</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Canteen Item</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.productId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {item.name} (Rs. {item.price})
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {(Number(item.price) * item.quantity).toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2}>
                  <strong>Total:</strong>
                </TableCell>
                <TableCell></TableCell>
                <TableCell>
                  <strong>{total.toFixed(0)}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Item</InputLabel>
            <Select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              label="Item"
            >
              {products.map((product: any) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} - Rs. {product.price}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Qty"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            sx={{ width: 100 }}
          />
          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={addItem}
          >
            Add Item
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

