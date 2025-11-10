'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility, Payment } from '@mui/icons-material';
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
  saleId: string | null;
  table: {
    id: string;
    tableNumber: number;
  };
  players: Array<{
    id: string;
    playerId: string | null;
    memberId: string | null;
    seatNumber: number;
    score: number;
    result: string | null;
    player?: { id: string; name: string };
    member?: { id: string; name: string; memberNumber: string };
  }>;
  sale?: {
    id: string;
    total: number;
    receiptNumber: string;
  };
}

export default function MatchHistoryPage() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const getStatusFilter = () => {
    switch (tabValue) {
      case 0:
        return 'ACTIVE';
      case 1:
        return 'FINISHED';
      default:
        return undefined;
    }
  };

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', getStatusFilter()],
    queryFn: async () => {
      const status = getStatusFilter();
      const response = await api.get('/matches', {
        params: status ? { status } : {},
      });
      return response.data;
    },
  });

  const getPaymentStatus = (match: Match) => {
    if (match.status === 'ACTIVE' || match.status === 'PAUSED') {
      return { label: 'Playing', color: 'info' as const };
    }
    if (match.isPaid) {
      return { label: 'Paid', color: 'success' as const };
    }
    return { label: 'Unpaid', color: 'warning' as const };
  };

  const getPlayerName = (player: any) => {
    if (player.player) return player.player.name;
    if (player.member) return `${player.member.name} (${player.member.memberNumber})`;
    return 'Unknown';
  };

  const getDuration = (match: Match) => {
    if (!match.startTime) return '-';
    const start = new Date(match.startTime);
    const end = match.endTime ? new Date(match.endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredMatches = matches.filter((match: Match) => {
    if (tabValue === 0) return match.status === 'ACTIVE' || match.status === 'PAUSED';
    if (tabValue === 1) return match.status === 'FINISHED' && !match.isPaid;
    if (tabValue === 2) return match.status === 'FINISHED' && match.isPaid;
    return true;
  });

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading match history...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Match History
      </Typography>

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Playing" />
        <Tab label="Unpaid" />
        <Tab label="Paid" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Players</TableCell>
              <TableCell>Game Type</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMatches.map((match: Match, index: number) => {
              const paymentStatus = getPaymentStatus(match);
              return (
                <TableRow key={match.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>Table {match.table.tableNumber}</TableCell>
                  <TableCell>
                    {match.players.map((p) => getPlayerName(p)).join(' vs ')}
                  </TableCell>
                  <TableCell>{match.gameType}</TableCell>
                  <TableCell>
                    {match.startTime ? new Date(match.startTime).toLocaleTimeString() : '-'}
                  </TableCell>
                  <TableCell>
                    {match.endTime ? new Date(match.endTime).toLocaleTimeString() : '-'}
                  </TableCell>
                  <TableCell>{getDuration(match)}</TableCell>
                  <TableCell>
                    {match.players.map((p) => `${getPlayerName(p)}: ${p.score}`).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Chip label={paymentStatus.label} color={paymentStatus.color} size="small" />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {
                        setSelectedMatch(match);
                        setDetailDialogOpen(true);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Match Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Match Details</DialogTitle>
        <DialogContent>
          {selectedMatch && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Table {selectedMatch.table.tableNumber} - {selectedMatch.gameType}
              </Typography>
              <Box mb={2}>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedMatch.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Start Time:</strong>{' '}
                  {selectedMatch.startTime
                    ? new Date(selectedMatch.startTime).toLocaleString()
                    : '-'}
                </Typography>
                {selectedMatch.endTime && (
                  <Typography variant="body2">
                    <strong>End Time:</strong>{' '}
                    {new Date(selectedMatch.endTime).toLocaleString()}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Duration:</strong> {getDuration(selectedMatch)}
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Status:</strong>{' '}
                  <Chip
                    label={getPaymentStatus(selectedMatch).label}
                    color={getPaymentStatus(selectedMatch).color}
                    size="small"
                  />
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Players & Scores
              </Typography>
              {selectedMatch.players.map((player) => (
                <Box key={player.id} mb={1}>
                  <Typography variant="body1">
                    {getPlayerName(player)} - Score: {player.score}
                    {player.result && ` (${player.result})`}
                  </Typography>
                </Box>
              ))}

              {selectedMatch.sale && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Payment Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Receipt:</strong> {selectedMatch.sale.receiptNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total:</strong> Rs. {Number(selectedMatch.sale.total).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

