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
      const product = inventory.find((p: any) => p.id === id);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const oldStock = product.stock || 0;
      const stockChange = stock - oldStock;
      
      const response = await api.patch(`/products/${id}`, { stock });
      
      // Create inventory movement
      try {
        await api.post('/inventory/movements', {
          productId: id,
          change: stockChange,
          reason: 'MANUAL_ADJUSTMENT',
        });
      } catch {
        // Movement creation failed, but product update succeeded
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleCreate = async () => {
    if (inventoryName && price && quantity) {
      try {
        await createMutation.mutateAsync({
          name: inventoryName,
          price: parseFloat(price),
          stock: parseInt(quantity),
          category: 'Inventory',
        });
      } catch (error) {
        console.error('Failed to create inventory item:', error);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
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
        📦 Inventory Management
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  color: '#2196F3',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                ➕ Create Inventory
              </Typography>
              <TextField
                fullWidth
                label="New Inventory Name"
                value={inventoryName}
                onChange={(e) => setInventoryName(e.target.value)}
                margin="normal"
                placeholder="New Inventory Name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Price (PKR)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                margin="normal"
                placeholder="Price"
                inputProps={{ min: 0, inputMode: 'decimal', pattern: '[0-9.]*' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                margin="normal"
                placeholder="Quantity"
                inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]*' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                disabled={createMutation.isPending}
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
                  },
                }}
              >
                Create Inventory
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  color: '#2196F3',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                📋 Inventory List
              </Typography>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: 400,
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  overflow: 'auto',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Inventory Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Quantity (Edit to update)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            📭 No inventory items yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventory.map((item: any, index: number) => (
                        <TableRow 
                          key={item.id}
                          sx={{
                            '&:hover': {
                              bgcolor: 'rgba(33, 150, 243, 0.05)',
                            },
                            '&:nth-of-type(even)': {
                              bgcolor: 'rgba(0, 0, 0, 0.02)',
                            },
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>{item.name}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                            PKR {Math.ceil(Number(item.price))}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={item.stock || 0}
                              onChange={async (e) => {
                                try {
                                  await updateQuantityMutation.mutateAsync({
                                    id: item.id,
                                    stock: parseInt(e.target.value) || 0,
                                  });
                                } catch (error) {
                                  console.error('Failed to update quantity:', error);
                                }
                              }}
                              disabled={updateQuantityMutation.isPending}
                              inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]*' }}
                              sx={{ 
                                width: 100,
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1,
                                },
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
        </Grid>
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

