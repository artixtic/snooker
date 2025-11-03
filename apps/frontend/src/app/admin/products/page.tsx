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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { db } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';

export default function AdminProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    category: '',
    barcode: '',
  });
  const queryClient = useQueryClient();

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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/products', data);
        return response.data;
      } catch (error: any) {
        if (!navigator.onLine) {
          const localProduct = {
            ...data,
            id: `local_${Date.now()}`,
            deleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await db.products.add(localProduct);
          await addToSyncQueue('product', 'create', localProduct.id, data);
          return localProduct;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      try {
        const response = await api.patch(`/products/${id}`, data);
        return response.data;
      } catch (error: any) {
        if (!navigator.onLine) {
          await db.products.update(id, data);
          await addToSyncQueue('product', 'update', id, { id, ...data });
          return { id, ...data };
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/products/${id}`);
      } catch (error: any) {
        if (!navigator.onLine) {
          await db.products.update(id, { deleted: true });
          await addToSyncQueue('product', 'delete', id, { id });
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category || '',
        barcode: product.barcode || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        price: '',
        stock: '',
        category: '',
        barcode: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      price: '',
      stock: '',
      category: '',
      barcode: '',
    });
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      sku: formData.sku || undefined,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category || undefined,
      barcode: formData.barcode || undefined,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku || '-'}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
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
                <TableCell>{product.barcode || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(product)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (confirm('Delete this product?')) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="SKU"
              fullWidth
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
            <TextField
              label="Price"
              type="number"
              fullWidth
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
            <TextField
              label="Stock"
              type="number"
              fullWidth
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
            <TextField
              label="Category"
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <TextField
              label="Barcode"
              fullWidth
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.price || !formData.stock}
          >
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

