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
import { db } from '@/lib/db';
import api from '@/lib/api';

export default function AdminConflictsPage() {
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get conflicts from sync_log table
  const { data: conflicts = [], isLoading } = useQuery({
    queryKey: ['sync', 'conflicts'],
    queryFn: async () => {
      try {
        // Get conflicts from IndexedDB
        const syncLogs = await db.sync_log
          .where('status')
          .equals('conflict')
          .toArray();
        
        return syncLogs.map((log) => ({
          id: log.id,
          entity: log.entity,
          action: log.action,
          entityId: log.entityId,
          clientData: log.payload,
          serverData: log.conflictData?.serverData || {},
          conflictType: log.conflictData?.conflictType || 'unknown',
          message: log.conflictData?.message || 'Conflict detected',
          createdAt: log.createdAt,
        }));
      } catch (error) {
        console.error('Error fetching conflicts:', error);
        return [];
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds
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
      const conflict = conflicts.find((c: any) => c.id === conflictId);
      if (!conflict) throw new Error('Conflict not found');

      if (resolution === 'client') {
        // Force update with client data
        const response = await api.patch(`/${conflict.entity}s/${conflict.entityId}`, {
          ...conflict.clientData,
          force: true, // Special flag to override conflicts
        });
        return response.data;
      } else if (resolution === 'server') {
        // Accept server data, mark conflict as resolved
        await db.sync_log.update(conflictId, {
          status: 'synced',
          conflictData: null,
        });
        return { resolved: true };
      } else {
        // Manual resolution - would need additional data
        // For now, just mark as resolved
        await db.sync_log.update(conflictId, {
          status: 'synced',
          conflictData: null,
        });
        return { resolved: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync', 'conflicts'] });
      setResolveDialogOpen(false);
      setSelectedConflict(null);
    },
  });

  const handleResolve = (conflict: any, resolution: 'client' | 'server' | 'manual') => {
    setSelectedConflict(conflict);
    setResolveDialogOpen(true);
    
    if (resolution === 'server' || resolution === 'manual') {
      // Auto-resolve
      resolveConflictMutation.mutate({
        conflictId: conflict.id,
        resolution,
      });
    }
  };

  const handleManualResolve = () => {
    if (!selectedConflict) return;
    
    // For manual resolution, admin should edit the entity separately
    // Then mark conflict as resolved
    resolveConflictMutation.mutate({
      conflictId: selectedConflict.id,
      resolution: 'manual',
    });
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
            onClick={() => {
              resolveConflictMutation.mutate({
                conflictId: selectedConflict.id,
                resolution: 'client',
                useClientData: true,
              });
            }}
            disabled={resolveConflictMutation.isPending}
          >
            Use Client Version
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={() => {
              resolveConflictMutation.mutate({
                conflictId: selectedConflict.id,
                resolution: 'server',
              });
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

