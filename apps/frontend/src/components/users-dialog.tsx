'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { UserRole } from '@prisma/client';

interface UsersDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UsersDialog({ open, onClose }: UsersDialogProps) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [editingUser, setEditingUser] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: open,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || error?.message || 'Failed to update user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || error?.message || 'Failed to delete user');
    },
  });

  const resetForm = () => {
    setUsername('');
    setName('');
    setPassword('');
    setRole(UserRole.EMPLOYEE);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    if (!editingUser) return;

    if (!username.trim() || !name.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const data: any = {
      username: username.trim(),
      name: name.trim(),
      role,
    };

    if (password.trim()) {
      data.password = password.trim();
    }

    try {
      await updateUserMutation.mutateAsync({ id: editingUser.id, data });
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setPassword('');
    setRole(user.role);
  };

  const handleDelete = async (user: any) => {
    if (confirm(`Delete user "${user.username}"? This action cannot be undone.`)) {
      try {
        await deleteUserMutation.mutateAsync(user.id);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const getRoleColor = (userRole: string) => {
    return userRole === UserRole.ADMIN ? 'error' : 'default';
  };

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
          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        👥 Manage Users
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {editingUser && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#4CAF50' }}>
              Edit User
            </Typography>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Box display="flex" gap={2} mt={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  label="Role"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={UserRole.EMPLOYEE}>Employee</MenuItem>
                  <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="New Password (leave blank to keep current)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
            {!password && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                Leave password blank to keep the current password unchanged.
              </Alert>
            )}
            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={updateUserMutation.isPending}
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
                Update User
              </Button>
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#4CAF50' }}>
          Users
        </Typography>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No users created yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role) as any}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(user)}
                        sx={{ color: '#4CAF50' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(user)}
                        disabled={deleteUserMutation.isPending}
                        sx={{ color: '#f44336' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4CAF50 30%, #45a049 90%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #45a049 30%, #4CAF50 90%)',
              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

