'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  Chip,
} from '@mui/material';
import {
  Add,
  Remove,
  CheckCircle,
  History,
  AttachMoney,
  Receipt,
  Settings,
  Logout,
  Print,
  PhoneAndroid,
  Assessment,
  Lightbulb,
  QrCode,
  Email,
  WhatsApp,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import api from '@/lib/api';
import { TableHistoryDialog } from '@/components/table-history-dialog';
import { InventoryDialog } from '@/components/inventory-dialog';
import { CanteenDialog } from '@/components/canteen-dialog';
import { ExpenseDialog } from '@/components/expense-dialog';
import { ReportsDialog } from '@/components/reports-dialog';

interface Table {
  id: string;
  tableNumber: number;
  status: string;
  ratePerHour: number;
  startedAt: string | null;
  pausedAt: string | null;
  lastResumedAt: string | null;
  totalPausedMs: number | null;
  memberId: string | null;
  currentCharge: number;
  member?: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function DashboardPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [canteenDialogOpen, setCanteenDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [addonsAnchor, setAddonsAnchor] = useState<null | HTMLElement>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await api.get('/tables');
      return response.data;
    },
    refetchInterval: 1000, // Update every second for live timers
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await api.get('/members');
      return response.data;
    },
  });

  const startTableMutation = useMutation({
    mutationFn: async ({ tableId, memberId }: { tableId: string; memberId?: string }) => {
      const response = await api.post(`/tables/${tableId}/start`, { memberId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const stopTableMutation = useMutation({
    mutationFn: async ({ tableId, paymentAmount, canteenTotal, skipSale }: { tableId: string; paymentAmount: number; canteenTotal?: number; skipSale?: boolean }) => {
      const table = tables.find((t: Table) => t.id === tableId);
      if (table) {
        // Stop the table
        const tableResponse = await api.post('/tables/' + tableId + '/stop', {
          paymentAmount,
        });
        
        // Create sale for table charge + canteen (unless skipSale is true)
        const totalCharge = Number(calculateCurrentCharge(table)) + (canteenTotal || 0);
        if (!skipSale && totalCharge > 0) {
          await api.post('/sales', {
            tableId,
            memberId: table.memberId,
            subtotal: totalCharge,
            tax: 0,
            total: totalCharge,
            paymentMethod: paymentAmount >= totalCharge ? 'CASH' : 'CREDIT',
            cashReceived: paymentAmount,
            change: paymentAmount > totalCharge ? paymentAmount - totalCharge : 0,
            items: [], // Empty items array for table-only sales
          });
        }
        
        return tableResponse.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setCheckoutDialogOpen(false);
      setSelectedTable(null);
    },
  });

  const updateTableMemberMutation = useMutation({
    mutationFn: async ({ tableId, memberId }: { tableId: string; memberId: string | null }) => {
      const response = await api.patch(`/tables/${tableId}/member`, { memberId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const resetTableMutation = useMutation({
    mutationFn: async ({ tableId }: { tableId: string }) => {
      const response = await api.post(`/tables/${tableId}/reset`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const pauseTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const response = await api.post(`/tables/${tableId}/pause`);
      return response.data;
    },
    onSuccess: async (data, tableId) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      // Refetch to get updated table with currentCharge
      await queryClient.refetchQueries({ queryKey: ['tables'] });
    },
  });

  const resumeTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const response = await api.post(`/tables/${tableId}/resume`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const calculateElapsedTime = (table: Table) => {
    if (!table.startedAt) return '00:00:00';
    const start = new Date(table.startedAt).getTime();
    
    // If paused, use pausedAt time instead of now (freeze the timer)
    const endTime = table.status === 'PAUSED' && table.pausedAt 
      ? new Date(table.pausedAt).getTime() 
      : Date.now();
    
    const diff = endTime - start;
    
    // Subtract total paused time (backend already includes current pause in totalPausedMs when paused)
    const totalPausedMs = table.totalPausedMs || 0;
    const activeTime = diff - totalPausedMs;
    
    const hours = Math.floor(activeTime / 3600000);
    const minutes = Math.floor((activeTime % 3600000) / 60000);
    const seconds = Math.floor((activeTime % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateCurrentCharge = (table: Table): number => {
    if (!table.startedAt || (table.status !== 'OCCUPIED' && table.status !== 'PAUSED')) return 0;
    
    // If paused, use the backend's currentCharge if available (it's calculated correctly)
    if (table.status === 'PAUSED' && table.currentCharge) {
      return Number(table.currentCharge);
    }
    
    const start = new Date(table.startedAt).getTime();
    
    // If paused, use pausedAt time instead of now (freeze the charge)
    const endTime = table.status === 'PAUSED' && table.pausedAt 
      ? new Date(table.pausedAt).getTime() 
      : Date.now();
    
    const diff = endTime - start;
    
    // Subtract total paused time (backend already includes current pause in totalPausedMs when paused)
    const totalPausedMs = table.totalPausedMs || 0;
    const activeTime = diff - totalPausedMs;
    const minutes = activeTime / 60000;
    const ratePerMinute = Number(table.ratePerHour) / 60;
    return minutes * ratePerMinute;
  };

  const formatTime = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Smart Cue
          </Typography>
          <Typography variant="body2" sx={{ mr: 3 }}>
            +92 316 1126671
          </Typography>
          <Button
            color="inherit"
            startIcon={<Add />}
            onClick={() => {}}
            sx={{ mr: 1 }}
          >
            New Table
          </Button>
          <Button
            color="inherit"
            endIcon={<Settings />}
            onClick={(e) => setAddonsAnchor(e.currentTarget)}
            sx={{ mr: 1 }}
          >
            Add-ons
          </Button>
          <Button color="inherit" onClick={() => setInventoryDialogOpen(true)} sx={{ mr: 1 }}>
            Inventory
          </Button>
          <Button color="inherit" onClick={() => setExpenseDialogOpen(true)} sx={{ mr: 1 }}>
            Expense
          </Button>
          <Button color="inherit" onClick={() => setReportsDialogOpen(true)} sx={{ mr: 1 }}>
            Closing
          </Button>
          <Button 
            color="inherit" 
            startIcon={<Logout />} 
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Add-ons Menu */}
      <Menu
        anchorEl={addonsAnchor}
        open={Boolean(addonsAnchor)}
        onClose={() => setAddonsAnchor(null)}
      >
        <MenuItem onClick={() => {}}>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText>Receipt Printer</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <ListItemIcon><PhoneAndroid fontSize="small" /></ListItemIcon>
          <ListItemText>Mobile App</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <ListItemIcon><Assessment fontSize="small" /></ListItemIcon>
          <ListItemText>Reporting</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <ListItemIcon><Lightbulb fontSize="small" /></ListItemIcon>
          <ListItemText>Control AC/Light</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <ListItemIcon><QrCode fontSize="small" /></ListItemIcon>
          <ListItemText>QR Code Check-in</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <ListItemIcon><Email fontSize="small" /></ListItemIcon>
          <ListItemText>SMS Notification</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <ListItemIcon><WhatsApp fontSize="small" /></ListItemIcon>
          <ListItemText>WhatsApp Notification</ListItemText>
        </MenuItem>
      </Menu>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {tables.map((table: Table) => {
            const elapsedTime = calculateElapsedTime(table);
            const currentCharge = Number(calculateCurrentCharge(table));
            const isOccupied = table.status === 'OCCUPIED' || table.status === 'PAUSED';

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                <Card
                  sx={{
                    bgcolor: '#2e7d32',
                    color: 'white',
                    borderRadius: 2,
                    position: 'relative',
                    minHeight: 300,
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        Snooker {table.tableNumber}
                      </Typography>
                      <Typography variant="body2">
                        (Rs. {Number(table.ratePerHour) / 60}/min)
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      startIcon={<History />}
                      onClick={() => {
                        setSelectedTable(table);
                        setHistoryDialogOpen(true);
                      }}
                      sx={{ mb: 2, bgcolor: '#ff9800' }}
                    >
                      View History
                    </Button>

                    {isOccupied && (
                      <>
                        <Box mb={1}>
                          <Typography variant="body2">
                            {formatTime(table.startedAt)} →
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6" fontWeight="bold">
                              {elapsedTime}
                            </Typography>
                            {table.status === 'PAUSED' && (
                              <Chip 
                                label="PAUSED" 
                                size="small" 
                                color="warning" 
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2">
                            Rs. {currentCharge.toFixed(1)}
                          </Typography>
                          {table.status === 'PAUSED' && (
                            <Typography variant="caption" sx={{ color: 'warning.main', display: 'block' }}>
                              Timer paused - not charging
                            </Typography>
                          )}
                        </Box>

                        <Box display="flex" alignItems="center" mb={2} gap={1}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={table.memberId || ''}
                              displayEmpty
                              sx={{
                                bgcolor: 'white',
                                color: 'black',
                              }}
                              onChange={(e) => {
                                updateTableMemberMutation.mutate({
                                  tableId: table.id,
                                  memberId: e.target.value || null,
                                });
                              }}
                            >
                              <MenuItem value="">Select Member</MenuItem>
                              {members.map((member: any) => (
                                <MenuItem key={member.id} value={member.id}>
                                  {member.name} ({member.phone})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <IconButton 
                            size="small" 
                            sx={{ bgcolor: 'white', color: 'black' }}
                            onClick={() => {
                              // Open add member dialog or navigate to members page
                            }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Pause/Resume Buttons */}
                        <Box display="flex" gap={1} mb={1}>
                          {table.status === 'OCCUPIED' ? (
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              startIcon={<Pause />}
                              onClick={() => pauseTableMutation.mutate(table.id)}
                              disabled={pauseTableMutation.isPending}
                              fullWidth
                              sx={{ bgcolor: 'white', color: '#ff9800' }}
                            >
                              Pause
                            </Button>
                          ) : table.status === 'PAUSED' ? (
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              startIcon={<PlayArrow />}
                              onClick={() => resumeTableMutation.mutate(table.id)}
                              disabled={resumeTableMutation.isPending}
                              fullWidth
                              sx={{ bgcolor: 'white', color: '#2e7d32' }}
                            >
                              Resume
                            </Button>
                          ) : null}
                        </Box>

                        <Box display="flex" gap={1} mb={1}>
                          <Button
                            variant="contained"
                            color="error"
                            fullWidth
                            onClick={async () => {
                              if (table.status === 'PAUSED') {
                                setSelectedTable(table);
                                setCheckoutDialogOpen(true);
                              } else if (table.status === 'OCCUPIED') {
                                // Pause first, then open checkout
                                try {
                                  await pauseTableMutation.mutateAsync(table.id);
                                  // Wait for refetch to complete
                                  await new Promise(resolve => setTimeout(resolve, 500));
                                  const updatedTables = await queryClient.fetchQuery({ queryKey: ['tables'] });
                                  const updatedTable = (updatedTables as Table[]).find((t: Table) => t.id === table.id);
                                  if (updatedTable && updatedTable.status === 'PAUSED') {
                                    setSelectedTable(updatedTable);
                                    setCheckoutDialogOpen(true);
                                  }
                                } catch (error) {
                                  console.error('Failed to pause table:', error);
                                  alert('Failed to pause table. Please try again.');
                                }
                              }
                            }}
                            disabled={pauseTableMutation.isPending || table.status === 'AVAILABLE'}
                            sx={{ bgcolor: '#d32f2f' }}
                          >
                            Check Out {table.status !== 'PAUSED' && table.status === 'OCCUPIED' && '(Will Pause First)'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            onClick={() => {
                              if (confirm(`Reset Snooker ${table.tableNumber}? This will clear all data without creating a sale.`)) {
                                resetTableMutation.mutate({ tableId: table.id });
                              }
                            }}
                            sx={{ minWidth: 80 }}
                          >
                            Reset
                          </Button>
                        </Box>

                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => {
                            setSelectedTable(table);
                            setCanteenDialogOpen(true);
                          }}
                          sx={{ bgcolor: '#1976d2' }}
                        >
                          Add
                        </Button>
                      </>
                    )}

                    {!isOccupied && (
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        startIcon={<CheckCircle />}
                        onClick={() => startTableMutation.mutate({ tableId: table.id })}
                        sx={{ mt: 4, bgcolor: '#2e7d32' }}
                      >
                        Check In
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {/* Create Table Card */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                bgcolor: '#2e7d32',
                color: 'white',
                borderRadius: 2,
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => {}}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Add sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6">Create Table</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutDialogOpen}
        onClose={() => {
          setCheckoutDialogOpen(false);
          setSelectedTable(null);
        }}
        table={selectedTable}
        canteenTotal={0} // Would come from canteen dialog
        onCheckout={(amount, canteenTotal, skipSale) => {
          if (selectedTable) {
            stopTableMutation.mutate({ 
              tableId: selectedTable.id, 
              paymentAmount: amount,
              canteenTotal: canteenTotal || 0,
              skipSale: skipSale || false,
            });
          }
        }}
      />

      {/* History Dialog */}
      <TableHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        table={selectedTable}
      />

      {/* Inventory Dialog */}
      <InventoryDialog
        open={inventoryDialogOpen}
        onClose={() => setInventoryDialogOpen(false)}
      />

      {/* Canteen Dialog */}
      <CanteenDialog
        open={canteenDialogOpen}
        onClose={() => setCanteenDialogOpen(false)}
        table={selectedTable}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
      />

      {/* Reports Dialog */}
      <ReportsDialog
        open={reportsDialogOpen}
        onClose={() => setReportsDialogOpen(false)}
      />
    </Box>
  );
}

// Checkout Dialog Component
function CheckoutDialog({ open, onClose, table, onCheckout, canteenTotal = 0 }: any) {
  const [amount, setAmount] = useState(0);
  const [frozenCharge, setFrozenCharge] = useState(0);

  // Freeze the charge when dialog opens (use backend's currentCharge)
  useEffect(() => {
    if (open && table) {
      // Use backend's currentCharge (it's calculated and stored when paused)
      const charge = table.currentCharge ? Number(table.currentCharge) : 0;
      setFrozenCharge(charge);
      setAmount(charge + canteenTotal);
    } else if (!open) {
      setAmount(0);
      setFrozenCharge(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, table?.id, table?.status, table?.currentCharge]);

  const tableCharge = frozenCharge; // Use frozen charge, don't recalculate
  const totalCharge = tableCharge + canteenTotal;

  if (!table) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Check Out - Snooker {table?.tableNumber || 'N/A'}</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          {table.status === 'PAUSED' ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Table Charge (Paused): Rs. {tableCharge.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Charge is frozen at pause time
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" color="warning.main">
                ⚠️ Table is not paused. Please pause the table first.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Current Charge: Rs. {tableCharge.toFixed(2)}
              </Typography>
            </>
          )}
          {canteenTotal > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Canteen: Rs. {canteenTotal.toFixed(2)}
            </Typography>
          )}
          <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
            Total Charge: Rs. {totalCharge.toFixed(2)}
          </Typography>
        </Box>
        <TextField
          fullWidth
          label="Payment Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          margin="normal"
          autoFocus
        />
        {amount > 0 && totalCharge > 0 && (
          <Typography variant="body2" color={amount >= totalCharge ? 'success.main' : 'error.main'}>
            Change: Rs. {(amount - totalCharge).toFixed(2)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={() => onCheckout(amount, canteenTotal)}
          disabled={(totalCharge > 0 && amount < totalCharge) || table.status !== 'PAUSED'}
          color={table.status === 'PAUSED' ? 'primary' : 'inherit'}
        >
          {table.status === 'PAUSED' ? 'Complete Checkout' : 'Pause Table First'}
        </Button>
        <Button 
          variant="outlined" 
          color="warning"
          onClick={() => {
            // Reset table without creating sale
            if (confirm('Reset table without creating a sale? This will clear all data.')) {
              onCheckout(0, 0, true);
            }
          }}
          sx={{ ml: 1 }}
        >
          Reset (No Sale)
        </Button>
      </DialogActions>
    </Dialog>
  );
}


