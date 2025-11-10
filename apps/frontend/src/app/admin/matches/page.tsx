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
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { PlayArrow, Pause, Stop, Add, Edit } from '@mui/icons-material';
import api from '@/lib/api';

interface Match {
  id: string;
  tableId: string;
  status: string;
  gameType: string;
  startTime: string | null;
  endTime: string | null;
  score: any;
  isPaid: boolean;
  table: {
    id: string;
    tableNumber: number;
  };
  players: Array<{
    id: string;
    playerId: string;
    seatNumber: number;
    score: number;
    result: string | null;
    player?: { id: string; name: string };
  }>;
}

export default function MatchesPage() {
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', tabValue === 0 ? 'ACTIVE' : tabValue === 1 ? 'FINISHED' : undefined],
    queryFn: async () => {
      const status = tabValue === 0 ? 'ACTIVE' : tabValue === 1 ? 'FINISHED' : undefined;
      const response = await api.get('/matches', {
        params: status ? { status } : {},
      });
      return response.data;
    },
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await api.get('/tables');
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

  const createMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/matches', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setCreateDialogOpen(false);
    },
  });

  const pauseMatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/matches/${id}/pause`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const resumeMatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/matches/${id}/resume`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ id, score }: { id: string; score: any }) => {
      const response = await api.patch(`/matches/${id}/score`, { score });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setScoreDialogOpen(false);
    },
  });

  const endMatchMutation = useMutation({
    mutationFn: async ({ id, finalScores, winnerId }: { id: string; finalScores: any; winnerId?: string }) => {
      const response = await api.patch(`/matches/${id}/end`, { finalScores, winnerId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'FINISHED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPlayerName = (player: any) => {
    if (player.player) return player.player.name;
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading matches...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Match Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Match
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Active" />
        <Tab label="Finished" />
        <Tab label="All" />
      </Tabs>

      <Grid container spacing={3}>
        {matches.map((match: Match) => (
          <Grid item xs={12} md={6} lg={4} key={match.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6">Table {match.table.tableNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.gameType}
                    </Typography>
                  </Box>
                  <Chip
                    label={match.status}
                    color={getStatusColor(match.status) as any}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  {match.players.map((player) => (
                    <Box key={player.id} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{getPlayerName(player)}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        Score: {player.score}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {match.startTime && (
                  <Typography variant="caption" color="text.secondary">
                    Started: {new Date(match.startTime).toLocaleString()}
                  </Typography>
                )}

                <Box display="flex" gap={1} mt={2}>
                  {match.status === 'ACTIVE' && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Pause />}
                        onClick={() => pauseMatchMutation.mutate(match.id)}
                      >
                        Pause
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => {
                          setSelectedMatch(match);
                          setScoreDialogOpen(true);
                        }}
                      >
                        Update Score
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Stop />}
                        onClick={() => {
                          const finalScores: any = {};
                          match.players.forEach((p) => {
                            if (p.playerId) {
                              finalScores[p.playerId] = p.score;
                            }
                          });
                          endMatchMutation.mutate({ id: match.id, finalScores });
                        }}
                      >
                        End Match
                      </Button>
                    </>
                  )}
                  {match.status === 'PAUSED' && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayArrow />}
                      onClick={() => resumeMatchMutation.mutate(match.id)}
                    >
                      Resume
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Match Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Match</DialogTitle>
        <DialogContent>
          <CreateMatchForm
            tables={tables}
            users={users}
            onSubmit={(data) => createMatchMutation.mutate(data)}
          />
        </DialogContent>
      </Dialog>

      {/* Update Score Dialog */}
      <Dialog open={scoreDialogOpen} onClose={() => setScoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Match Score</DialogTitle>
        <DialogContent>
          {selectedMatch && (
            <UpdateScoreForm
              match={selectedMatch}
              onSubmit={(score) => updateScoreMutation.mutate({ id: selectedMatch.id, score })}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

function CreateMatchForm({ tables, users, onSubmit }: any) {
  const [tableId, setTableId] = useState('');
  const [gameType, setGameType] = useState('snooker');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(['', '']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const players = selectedPlayers
      .filter((id) => id)
      .map((id, index) => ({
        playerId: id,
        seatNumber: index + 1,
      }));

    onSubmit({ tableId, gameType, players });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl fullWidth margin="normal">
        <InputLabel>Table</InputLabel>
        <Select value={tableId} onChange={(e) => setTableId(e.target.value)} required>
          {tables.map((table: any) => (
            <MenuItem key={table.id} value={table.id}>
              Table {table.tableNumber}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Game Type</InputLabel>
        <Select value={gameType} onChange={(e) => setGameType(e.target.value)}>
          <MenuItem value="snooker">Snooker</MenuItem>
          <MenuItem value="pool">Pool</MenuItem>
          <MenuItem value="8ball">8-Ball</MenuItem>
          <MenuItem value="9ball">9-Ball</MenuItem>
        </Select>
      </FormControl>

      {selectedPlayers.map((playerId, index) => (
        <FormControl key={index} fullWidth margin="normal">
          <InputLabel>Player {index + 1}</InputLabel>
          <Select
            value={playerId}
            onChange={(e) => {
              const newPlayers = [...selectedPlayers];
              newPlayers[index] = e.target.value;
              setSelectedPlayers(newPlayers);
            }}
          >
            <MenuItem value="">Select Player</MenuItem>
            {users.map((user: any) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name} ({user.username})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      <Button
        variant="outlined"
        onClick={() => setSelectedPlayers([...selectedPlayers, ''])}
        sx={{ mt: 2 }}
      >
        Add Player
      </Button>

      <DialogActions>
        <Button onClick={() => {}}>Cancel</Button>
        <Button type="submit" variant="contained">
          Create
        </Button>
      </DialogActions>
    </form>
  );
}

function UpdateScoreForm({ match, onSubmit }: any) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    match.players.forEach((p: any) => {
      if (p.playerId) {
        initial[p.playerId] = p.score;
      }
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(scores);
  };

  return (
    <form onSubmit={handleSubmit}>
      {match.players.map((player: any) => {
        const playerId = player.playerId;
        const playerName = player.player?.name || 'Unknown';
        return (
          <TextField
            key={player.id}
            fullWidth
            margin="normal"
            label={playerName}
            type="number"
            value={scores[playerId] || 0}
            onChange={(e) => setScores({ ...scores, [playerId]: parseInt(e.target.value) || 0 })}
          />
        );
      })}
      <DialogActions>
        <Button onClick={() => {}}>Cancel</Button>
        <Button type="submit" variant="contained">
          Update
        </Button>
      </DialogActions>
    </form>
  );
}

