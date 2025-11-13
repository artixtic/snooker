'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Dialog as ConfirmDialog,
  DialogTitle as ConfirmDialogTitle,
  DialogContent as ConfirmDialogContent,
  DialogActions as ConfirmDialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  Paper,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { UserRole, PaymentMethod } from '@prisma/client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`data-table-tabpanel-${index}`}
      aria-labelledby={`data-table-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface DataTableDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DataTableDialog({ open, onClose }: DataTableDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [editingRow, setEditingRow] = useState<{ type: string; id: string } | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const queryClient = useQueryClient();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setEditingRow(null);
  };

  const handleEdit = (type: string, item: any) => {
    setEditingRow({ type, id: item.id });
    setEditData({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleSave = async (type: string, id: string) => {
    try {
      const endpoint = getEndpoint(type);
      // Prepare data for API - convert date strings to Date objects if needed
      const dataToSend = { ...editData };
      if (type === 'expenses' && dataToSend.date) {
        dataToSend.date = new Date(dataToSend.date).toISOString();
      }
      // Remove fields that shouldn't be sent (like createdAt, updatedAt, id)
      delete dataToSend.createdAt;
      delete dataToSend.updatedAt;
      delete dataToSend.id;
      
      await api.patch(`${endpoint}/${id}`, dataToSend);
      queryClient.invalidateQueries({ queryKey: [getQueryKey(type)] });
      setEditingRow(null);
      setEditData({});
      setSnackbar({ open: true, message: 'Updated successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.response?.data?.message || 'Update failed', severity: 'error' });
    }
  };

  const handleDelete = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const endpoint = getEndpoint(itemToDelete.type);
      await api.delete(`${endpoint}/${itemToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: [getQueryKey(itemToDelete.type)] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

  const getEndpoint = (type: string) => {
    const endpoints: Record<string, string> = {
      products: '/products',
      users: '/users',
      games: '/games',
      expenses: '/expenses',
    };
    return endpoints[type] || `/${type}`;
  };

  const getQueryKey = (type: string) => {
    const keys: Record<string, string> = {
      products: 'products',
      users: 'users',
      games: 'games',
      expenses: 'expenses',
    };
    return keys[type] || type;
  };

  // Products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  // Users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  // Games
  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await api.get('/games');
      return response.data;
    },
  });

  // Expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await api.get('/expenses');
      return response.data;
    },
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            📊 Data Table Management
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="data table tabs">
                <Tab label="Products" />
                <Tab label="Users" />
                <Tab label="Games" />
                <Tab label="Expenses" />
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* Products Tab */}
              <TabPanel value={tabValue} index={0}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Stock</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Barcode</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map((product: any) =>
                        editingRow?.type === 'products' && editingRow?.id === product.id ? (
                          <TableRow key={product.id}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.name || ''}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.sku || ''}
                                onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={editData.price || ''}
                                onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={editData.cost || ''}
                                onChange={(e) => setEditData({ ...editData, cost: parseFloat(e.target.value) })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={editData.stock || ''}
                                onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.category || ''}
                                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.barcode || ''}
                                onChange={(e) => setEditData({ ...editData, barcode: e.target.value })}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSave('products', product.id)}
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={handleCancelEdit}>
                                <CancelIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={product.id}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>PKR {Number(product.price).toFixed(2)}</TableCell>
                            <TableCell>PKR {Number(product.cost || 0).toFixed(2)}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>{product.category || '-'}</TableCell>
                            <TableCell>{product.barcode || '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit('products', product)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete('products', product.id, product.name)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Users Tab */}
              <TabPanel value={tabValue} index={1}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user: any) =>
                        editingRow?.type === 'users' && editingRow?.id === user.id ? (
                          <TableRow key={user.id}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.username || ''}
                                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.name || ''}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={editData.role || ''}
                                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                >
                                  <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                                  <MenuItem value={UserRole.EMPLOYEE}>Employee</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSave('users', user.id)}
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={handleCancelEdit}>
                                <CancelIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.role}
                                color={user.role === UserRole.ADMIN ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit('users', user)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete('users', user.id, user.username)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Games Tab */}
              <TabPanel value={tabValue} index={2}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {games.map((game: any) =>
                        editingRow?.type === 'games' && editingRow?.id === game.id ? (
                          <TableRow key={game.id}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.name || ''}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                multiline
                                rows={2}
                                value={editData.description || ''}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>{new Date(game.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSave('games', game.id)}
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={handleCancelEdit}>
                                <CancelIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={game.id}>
                            <TableCell>{game.name}</TableCell>
                            <TableCell>{game.description || '-'}</TableCell>
                            <TableCell>{new Date(game.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit('games', game)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete('games', game.id, game.name)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Expenses Tab */}
              <TabPanel value={tabValue} index={3}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.map((expense: any) =>
                        editingRow?.type === 'expenses' && editingRow?.id === expense.id ? (
                          <TableRow key={expense.id}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.description || ''}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={editData.amount || ''}
                                onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={editData.category || ''}
                                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="date"
                                value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSave('expenses', expense.id)}
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={handleCancelEdit}>
                                <CancelIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={expense.id}>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>PKR {Number(expense.amount).toFixed(2)}</TableCell>
                            <TableCell>{expense.category || '-'}</TableCell>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit('expenses', expense)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete('expenses', expense.id, expense.description)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </Box>
          </Paper>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <ConfirmDialogTitle>Confirm Delete</ConfirmDialogTitle>
        <ConfirmDialogContent>
          <Typography>
            Are you sure you want to delete <strong>{itemToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </ConfirmDialogContent>
        <ConfirmDialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </ConfirmDialogActions>
      </ConfirmDialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

