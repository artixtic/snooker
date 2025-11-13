'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Conflict {
  id: number;
  entity: string;
  entityId: string;
  clientData: any;
  serverData: any;
  conflictType?: string;
  message?: string;
  action?: string;
  createdAt?: string;
}

export default function AdminConflictsPage() {
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get conflicts - no longer needed without offline sync
  const { data: conflicts = [], isLoading } = useQuery<Conflict[]>({
    queryKey: ['sync', 'conflicts'],
    queryFn: async () => {
      // No conflicts without offline sync
      return [];
    },
  });

  const resolveConflictMutation = useMutation({
    mutationFn: async ({
      conflictId,
      resolution,
      useClientData,
    }: {
      conflictId: number;
      resolution: 'client' | 'server' | 'manual';
      useClientData?: boolean;
    }) => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict) throw new Error('Conflict not found');

      if (resolution === 'client') {
        // Force update with client data
        const response = await api.patch(`/${conflict.entity}s/${conflict.entityId}`, {
          ...conflict.clientData,
          force: true, // Special flag to override conflicts
        });
        return response.data;
      } else if (resolution === 'server') {
        // Accept server data
        return { resolved: true };
      } else {
        // Manual resolution
        return { resolved: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync', 'conflicts'] });
      setResolveDialogOpen(false);
      setSelectedConflict(null);
    },
  });

  const handleResolve = async (conflict: Conflict, resolution: 'client' | 'server' | 'manual') => {
    setSelectedConflict(conflict);
    setResolveDialogOpen(true);
    
    if (resolution === 'server' || resolution === 'manual') {
      // Auto-resolve
      try {
        await resolveConflictMutation.mutateAsync({
          conflictId: conflict.id,
          resolution,
        });
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
      }
    }
  };

  const handleManualResolve = async () => {
    if (!selectedConflict) return;
    
    // For manual resolution, admin should edit the entity separately
    // Then mark conflict as resolved
    try {
      await resolveConflictMutation.mutateAsync({
        conflictId: selectedConflict!.id,
        resolution: 'manual',
      });
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'timestamp':
        return 'warning';
      case 'version':
        return 'error';
      case 'state':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatData = (data: any) => {
    if (!data || typeof data !== 'object') return String(data);
    return JSON.stringify(data, null, 2);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sync Conflicts
      </Typography>

      {conflicts.length === 0 && !isLoading && (
        <Alert severity="success" sx={{ mb: 3 }}>
          No conflicts found. All data is in sync!
        </Alert>
      )}

      {conflicts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>{conflicts.length} conflict(s)</strong> need resolution. Please review and
          resolve to keep data synchronized.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Entity</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Conflict Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conflicts.map((conflict: any) => (
              <TableRow key={conflict.id}>
                <TableCell>
                  <strong>{conflict.entity}</strong>
                  <Typography variant="caption" display="block" color="text.secondary">
                    ID: {conflict.entityId.slice(0, 8)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={conflict.action} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={conflict.conflictType}
                    color={getConflictTypeColor(conflict.conflictType) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{conflict.message}</Typography>
                </TableCell>
                <TableCell>
                  {new Date(conflict.createdAt).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleResolve(conflict, 'client')}
                    >
                      Use Client
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleResolve(conflict, 'server')}
                    >
                      Use Server
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Conflict Details Dialog */}
      <Dialog
        open={resolveDialogOpen && selectedConflict?.conflictType !== 'manual'}
        onClose={() => {
          setResolveDialogOpen(false);
          setSelectedConflict(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Resolve Conflict: {selectedConflict?.entity}</DialogTitle>
        <DialogContent>
          {selectedConflict && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                {selectedConflict.message}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>
                      Client Version
                    </Typography>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>View Client Data</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          component="pre"
                          sx={{
                            bgcolor: 'background.paper',
                            p: 1,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 300,
                            fontSize: '0.75rem',
                          }}
                        >
                          {formatData(selectedConflict.clientData)}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>
                      Server Version
                    </Typography>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>View Server Data</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          component="pre"
                          sx={{
                            bgcolor: 'background.paper',
                            p: 1,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 300,
                            fontSize: '0.75rem',
                          }}
                        >
                          {formatData(selectedConflict.serverData)}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setResolveDialogOpen(false);
              setSelectedConflict(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={async () => {
              if (!selectedConflict) return;
              try {
                await resolveConflictMutation.mutateAsync({
                  conflictId: selectedConflict.id,
                  resolution: 'client',
                  useClientData: true,
                });
              } catch (error) {
                console.error('Failed to resolve conflict:', error);
              }
            }}
            disabled={resolveConflictMutation.isPending}
          >
            Use Client Version
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={async () => {
              if (!selectedConflict) return;
              try {
                await resolveConflictMutation.mutateAsync({
                  conflictId: selectedConflict.id,
                  resolution: 'server',
                });
              } catch (error) {
                console.error('Failed to resolve conflict:', error);
              }
            }}
            disabled={resolveConflictMutation.isPending}
          >
            Use Server Version
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

