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
  Select,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { UserRole } from '@prisma/client';

export default function AdminUsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: UserRole.EMPLOYEE,
  });
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '', // Don't pre-fill password
        name: user.name,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: UserRole.EMPLOYEE,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: UserRole.EMPLOYEE,
    });
  };

  const handleSubmit = () => {
    const data: any = {
      username: formData.username,
      name: formData.name,
      role: formData.role,
    };

    if (formData.password) {
      data.password = formData.password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      if (!formData.password) {
        alert('Password is required for new users');
        return;
      }
      createMutation.mutate(data);
    }
  };

  const getRoleColor = (role: string) => {
    return role === UserRole.ADMIN ? 'error' : 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete user "${user.username}"?`,
                        )
                      ) {
                        deleteMutation.mutate(user.id);
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
          {editingUser ? 'Edit User' : 'Add User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Username"
              fullWidth
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!!editingUser} // Can't change username
            />
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                label="Role"
              >
                <MenuItem value={UserRole.EMPLOYEE}>Employee</MenuItem>
                <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              fullWidth
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText={editingUser ? 'Only fill if you want to change the password' : ''}
            />
            {editingUser && !formData.password && (
              <Alert severity="info">
                Leave password blank to keep the current password unchanged.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.username ||
              !formData.name ||
              (!formData.password && !editingUser) ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

