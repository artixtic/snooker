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
  Grid,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { Typography } from '@mui/material';
import api from '@/lib/api';

interface InventoryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InventoryDialog({ open, onClose }: InventoryDialogProps) {
  const [inventoryName, setInventoryName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const queryClient = useQueryClient();

  const { data: inventory = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setInventoryName('');
      setPrice('');
      setQuantity('');
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const response = await api.patch(`/products/${id}`, { stock });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleCreate = () => {
    if (inventoryName && price && quantity) {
      createMutation.mutate({
        name: inventoryName,
        price: parseFloat(price),
        stock: parseInt(quantity),
        category: 'Inventory',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Inventory</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Create Inventory
              </Typography>
              <TextField
                fullWidth
                label="New Inventory Name"
                value={inventoryName}
                onChange={(e) => setInventoryName(e.target.value)}
                margin="normal"
                placeholder="New Inventory Name"
              />
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                margin="normal"
                placeholder="Price"
              />
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                margin="normal"
                placeholder="Quantity"
              />
              <Button
                variant="contained"
                color="success"
                startIcon={<Add />}
                onClick={handleCreate}
                sx={{ mt: 2 }}
              >
                Create Inventory
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Inventory List
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Inventory Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Quantity (Edit to update quantity)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory.map((item: any, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.price} Rs</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.stock || 0}
                            onChange={(e) =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                stock: parseInt(e.target.value) || 0,
                              })
                            }
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

