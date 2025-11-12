'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Add, PlayArrow, PersonAdd } from '@mui/icons-material';
import api from '@/lib/api';

interface Tournament {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  maxPlayers: number | null;
  entryFee: number | null;
  prizePool: number | null;
  description: string | null;
  participants: Array<{
    id: string;
    playerId: string;
    seed: number | null;
    status: string;
    player?: { id: string; name: string };
  }>;
  matches: Array<{
    id: string;
    matchId: string;
    round: number;
    match: any;
  }>;
}

export default function TournamentsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await api.get('/tournaments');
      return response.data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/tournaments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setCreateDialogOpen(false);
    },
  });

  const startTournamentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/tournaments/${id}/start`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.post(`/tournaments/${id}/participants`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setParticipantDialogOpen(false);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'REGISTRATION':
        return 'info';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPlayerName = (participant: any) => {
    if (participant.player) return participant.player.name;
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading tournaments...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tournament Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Tournament
        </Button>
      </Box>

      <Grid container spacing={3}>
        {tournaments.map((tournament: Tournament) => (
          <Grid item xs={12} md={6} lg={4} key={tournament.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6">{tournament.name}</Typography>
                  <Chip
                    label={tournament.status}
                    color={getStatusColor(tournament.status) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Format: {tournament.format.replace('_', ' ')}
                </Typography>

                {tournament.entryFee && (
                  <Typography variant="body2" color="text.secondary">
                    Entry Fee: Rs. {tournament.entryFee}
                  </Typography>
                )}

                {tournament.prizePool && (
                  <Typography variant="body2" color="text.secondary">
                    Prize Pool: Rs. {tournament.prizePool}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Participants: {tournament.participants.length}
                  {tournament.maxPlayers && ` / ${tournament.maxPlayers}`}
                </Typography>

                {tournament.startDate && (
                  <Typography variant="caption" color="text.secondary">
                    Start: {new Date(tournament.startDate).toLocaleDateString()}
                  </Typography>
                )}

                <Box display="flex" gap={1} mt={2}>
                  {(tournament.status === 'DRAFT' || tournament.status === 'REGISTRATION') && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAdd />}
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setParticipantDialogOpen(true);
                        }}
                      >
                        Add Player
                      </Button>
                      {tournament.participants.length >= 2 && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={async () => {
                            try {
                              await startTournamentMutation.mutateAsync(tournament.id);
                            } catch (error) {
                              console.error('Failed to start tournament:', error);
                            }
                          }}
                        >
                          Start
                        </Button>
                      )}
                    </>
                  )}
                </Box>

                {tournament.participants.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Participants:
                    </Typography>
                    <List dense>
                      {tournament.participants.map((p) => (
                        <ListItem key={p.id}>
                          <ListItemText
                            primary={getPlayerName(p)}
                            secondary={p.status}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Tournament Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Tournament</DialogTitle>
        <DialogContent>
          <CreateTournamentForm
            onSubmit={async (data) => {
              try {
                await createTournamentMutation.mutateAsync(data);
              } catch (error) {
                console.error('Failed to create tournament:', error);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog
        open={participantDialogOpen}
        onClose={() => setParticipantDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Participant</DialogTitle>
        <DialogContent>
          {selectedTournament && (
            <AddParticipantForm
              users={users}
              onSubmit={async (data) => {
                try {
                  await addParticipantMutation.mutateAsync({ id: selectedTournament.id, data });
                } catch (error) {
                  console.error('Failed to add participant:', error);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

function CreateTournamentForm({ onSubmit }: any) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('SINGLE_ELIMINATION');
  const [maxPlayers, setMaxPlayers] = useState<number | ''>('');
  const [entryFee, setEntryFee] = useState<number | ''>('');
  const [prizePool, setPrizePool] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      format,
      maxPlayers: maxPlayers || undefined,
      entryFee: entryFee || undefined,
      prizePool: prizePool || undefined,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        margin="normal"
        label="Tournament Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Format</InputLabel>
        <Select value={format} onChange={(e) => setFormat(e.target.value)} required>
          <MenuItem value="SINGLE_ELIMINATION">Single Elimination</MenuItem>
          <MenuItem value="DOUBLE_ELIMINATION">Double Elimination</MenuItem>
          <MenuItem value="ROUND_ROBIN">Round Robin</MenuItem>
          <MenuItem value="SWISS">Swiss</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        margin="normal"
        label="Max Players"
        type="number"
        value={maxPlayers}
        onChange={(e) => setMaxPlayers(e.target.value ? parseInt(e.target.value) : '')}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Entry Fee"
        type="number"
        value={entryFee}
        onChange={(e) => setEntryFee(e.target.value ? parseFloat(e.target.value) : '')}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Prize Pool"
        type="number"
        value={prizePool}
        onChange={(e) => setPrizePool(e.target.value ? parseFloat(e.target.value) : '')}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Description"
        multiline
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <DialogActions>
        <Button onClick={() => {}}>Cancel</Button>
        <Button type="submit" variant="contained">
          Create
        </Button>
      </DialogActions>
    </form>
  );
}

function AddParticipantForm({ users, onSubmit }: any) {
  const [playerId, setPlayerId] = useState('');
  const [seed, setSeed] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      playerId: playerId || undefined,
      seed: seed || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl fullWidth margin="normal">
        <InputLabel>Player</InputLabel>
        <Select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          required
        >
          <MenuItem value="">Select Player</MenuItem>
          {users.map((user: any) => (
            <MenuItem key={user.id} value={user.id}>
              {user.name} ({user.username})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        margin="normal"
        label="Seed (optional)"
        type="number"
        value={seed}
        onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : '')}
      />

      <DialogActions>
        <Button onClick={() => {}}>Cancel</Button>
        <Button type="submit" variant="contained">
          Add
        </Button>
      </DialogActions>
    </form>
  );
}

