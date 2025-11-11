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
import { Add, Delete, Edit } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface GamesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GamesDialog({ open, onClose }: GamesDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rateType, setRateType] = useState<'PER_MINUTE' | 'PER_HOUR'>('PER_MINUTE');
  const [defaultRate, setDefaultRate] = useState(8);
  const [editingGame, setEditingGame] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await api.get('/games');
      return response.data;
    },
    enabled: open,
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/games', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      resetForm();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to create game');
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(`/games/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      resetForm();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to update game');
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/games/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to delete game');
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setRateType('PER_MINUTE');
    setDefaultRate(8);
    setEditingGame(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a game name');
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      rateType,
      defaultRate,
    };

    if (editingGame) {
      updateGameMutation.mutate({ id: editingGame.id, data });
    } else {
      createGameMutation.mutate(data);
    }
  };

  const handleEdit = (game: any) => {
    setEditingGame(game);
    setName(game.name);
    setDescription(game.description || '');
    setRateType(game.rateType);
    setDefaultRate(Number(game.defaultRate));
  };

  const handleDelete = (game: any) => {
    if (confirm(`Delete "${game.name}"? This will remove the game association from all tables.`)) {
      deleteGameMutation.mutate(game.id);
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        🎮 Manage Games
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#667eea' }}>
            {editingGame ? 'Edit Game' : 'Create New Game'}
          </Typography>
          <TextField
            fullWidth
            label="Game Name"
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
          <TextField
            fullWidth
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <Box display="flex" gap={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Rate Type</InputLabel>
              <Select
                value={rateType}
                onChange={(e) => setRateType(e.target.value as 'PER_MINUTE' | 'PER_HOUR')}
                label="Rate Type"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="PER_MINUTE">Per Minute</MenuItem>
                <MenuItem value="PER_HOUR">Per Hour</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={`Default Rate (PKR/${rateType === 'PER_HOUR' ? 'hour' : 'min'})`}
              type="number"
              value={defaultRate}
              onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01, inputMode: 'decimal', pattern: '[0-9.]*' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
          <Box display="flex" gap={1} mt={2}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={createGameMutation.isPending || updateGameMutation.isPending}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 30%, #764ba2 90%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 30%, #667eea 90%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                },
              }}
            >
              {editingGame ? 'Update' : 'Create'} Game
            </Button>
            {editingGame && (
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#667eea' }}>
          Existing Games
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
              <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Rate Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Default Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tables</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No games created yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                games.map((game: any) => (
                  <TableRow key={game.id}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{game.name}</TableCell>
                    <TableCell>{game.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={game.rateType === 'PER_HOUR' ? 'Per Hour' : 'Per Minute'}
                        size="small"
                        sx={{
                          background: game.rateType === 'PER_HOUR'
                            ? 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)'
                            : 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      PKR {Number(game.defaultRate)}/{game.rateType === 'PER_HOUR' ? 'hour' : 'min'}
                    </TableCell>
                    <TableCell>{game.tables?.length || 0}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(game)}
                        sx={{ color: '#667eea' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(game)}
                        disabled={deleteGameMutation.isPending}
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
            background: 'linear-gradient(135deg, #667eea 30%, #764ba2 90%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 30%, #667eea 90%)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

