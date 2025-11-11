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
  Chip,
  FormControlLabel,
  Checkbox,
  Collapse,
  Alert,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Remove,
  CheckCircle,
  History,
  AttachMoney,
  Receipt,
  Logout,
  Assessment,
  Pause,
  PlayArrow,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import api from '@/lib/api';
import { db } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';
import { TableHistoryDialog } from '@/components/table-history-dialog';
import { InventoryDialog } from '@/components/inventory-dialog';
import { CanteenDialog } from '@/components/canteen-dialog';
import { ExpenseDialog } from '@/components/expense-dialog';
import { ReportsDialog } from '@/components/reports-dialog';
import { CustomReportsDialog } from '@/components/custom-reports-dialog';
import { ShiftModal } from '@/components/shift-modal';
import { GamesDialog } from '@/components/games-dialog';
import { OfflineIndicator } from '@/components/offline-indicator';

interface Table {
  id: string;
  tableNumber: number;
  status: string;
  ratePerHour: number;
  startedAt: string | null;
  pausedAt: string | null;
  lastResumedAt: string | null;
  totalPausedMs: number | null;
  currentCharge: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function DashboardPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [canteenDialogOpen, setCanteenDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [customReportsDialogOpen, setCustomReportsDialogOpen] = useState(false);
  const [startTableDialogOpen, setStartTableDialogOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [createTableDialogOpen, setCreateTableDialogOpen] = useState(false);
  const [deleteAllTablesDialogOpen, setDeleteAllTablesDialogOpen] = useState(false);
  const [gamesDialogOpen, setGamesDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState(1);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [ratePerMinute, setRatePerMinute] = useState(8); // Default rate: 8 PKR/min
  const [addonsAnchor, setAddonsAnchor] = useState<null | HTMLElement>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now()); // For client-side timer updates
  const [tableCartItems, setTableCartItems] = useState<Record<string, CartItem[]>>({}); // Store cart items per table
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({}); // Track expanded cards
  const queryClient = useQueryClient();

  // Fetch games
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await api.get('/games');
      return response.data;
    },
  });

  // Fetch tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await api.get('/tables');
      return response.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for data sync
  });

  const isLoading = gamesLoading || tablesLoading;

  // Group tables by game
  const tablesByGame = games.reduce((acc: Record<string, any[]>, game: any) => {
    acc[game.id] = tables.filter((table: any) => table.gameId === game.id);
    return acc;
  }, {});

  // Check for active shift
  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      // If offline, check local DB first
      if (!navigator.onLine) {
        const localShifts = await db.shifts.toArray();
        return localShifts;
      }
      
      try {
        const response = await api.get('/shifts');
        const serverShifts = response.data;
        
        // Cache in local DB
        for (const shift of serverShifts) {
          await db.shifts.put(shift);
        }
        
        return serverShifts;
      } catch {
        // Fallback to local DB on error
        return await db.shifts.toArray();
      }
    },
  });

  const activeShift = shifts?.find((shift: any) => shift.status === 'ACTIVE');

  // Auto-expand cards when they become occupied
  useEffect(() => {
    tables.forEach((table: Table) => {
      const isOccupied = table.status === 'OCCUPIED' || table.status === 'PAUSED';
      if (isOccupied && !expandedCards[table.id]) {
        setExpandedCards(prev => ({ ...prev, [table.id]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables]);

  // Client-side timer that updates every second for smooth UI updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTableMutation = useMutation({
    mutationFn: async ({ tableId, ratePerMinute }: { tableId: string; ratePerMinute: number }) => {
      const response = await api.post(`/tables/${tableId}/start`, { ratePerHour: ratePerMinute }); // Backend still expects ratePerHour but it's actually per minute
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setStartTableDialogOpen(false);
      setRatePerMinute(8); // Reset to default
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to start table. Please try again.';
      alert(`⚠️ ${errorMessage}`);
    },
  });

  const stopTableMutation = useMutation({
    mutationFn: async ({ tableId, paymentAmount, cartItems, skipSale, taxEnabled = true }: { tableId: string; paymentAmount: number; cartItems?: CartItem[]; skipSale?: boolean; taxEnabled?: boolean }) => {
      const table = tables.find((t: Table) => t.id === tableId);
      if (!table) {
        throw new Error('Table not found');
      }
      
      const isOnline = navigator.onLine;
      
      // Calculate totals (rounded up to integers)
      const tableCharge = Math.ceil(Number(table.currentCharge) || 0);
      const cartItemsTotal = Math.ceil(cartItems?.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) || 0);
      const subtotal = tableCharge + cartItemsTotal;
      // Calculate tax on both table charge and cart items (rounded up)
      const tableTax = taxEnabled ? Math.ceil(tableCharge * 0.15) : 0;
      const cartTax = taxEnabled ? Math.ceil(cartItemsTotal * 0.15) : 0;
      const tax = tableTax + cartTax; // Total tax on both table and cart items
      const total = Math.ceil(subtotal + tax);
      
      let tableResponse: any;
      
      // Stop the table - try online first, fallback to offline
      if (isOnline) {
        try {
          tableResponse = await api.post('/tables/' + tableId + '/stop', {
            paymentAmount,
          });
          // Save to local DB
          if (tableResponse.data) {
            await db.tables.put({ ...tableResponse.data, id: tableId });
          }
        } catch (error: any) {
          if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            // Offline: update local table state
            const updatedTable = {
              ...table,
              status: 'AVAILABLE' as const,
              currentCharge: 0,
              startedAt: null,
              pausedAt: null,
              totalPausedTime: 0,
              lastResumedAt: null,
            };
            await db.tables.put({ ...updatedTable, id: tableId });
            tableResponse = { data: updatedTable };
            // Queue for sync
            await addToSyncQueue('table', 'update', tableId, {
              status: 'AVAILABLE',
              currentCharge: 0,
            });
          } else {
            throw error;
          }
        }
      } else {
        // Offline: update local table state
        const updatedTable = {
          ...table,
          status: 'AVAILABLE' as const,
          currentCharge: 0,
          startedAt: null,
          pausedAt: null,
          totalPausedTime: 0,
          lastResumedAt: null,
        };
        await db.tables.put({ ...updatedTable, id: tableId });
        tableResponse = { data: updatedTable };
        // Queue for sync
        await addToSyncQueue('table', 'update', tableId, {
          status: 'AVAILABLE',
          currentCharge: 0,
        });
      }
      
        // Create sale for table charge + cart items (unless skipSale is true)
        if (!skipSale && total > 0) {
          // Format cart items for sale - ensure all numeric values are rounded up
          const saleItems = cartItems?.map(item => {
            const unitPrice = Math.ceil(Number(item.price));
            const quantity = Number(item.quantity);
            const itemSubtotal = Math.ceil(unitPrice * quantity);
            const itemTax = taxEnabled ? Math.ceil(itemSubtotal * 0.15) : 0; // Tax only if enabled
            
            return {
              productId: item.productId,
              quantity: quantity,
              unitPrice: unitPrice,
              discount: 0,
              tax: itemTax > 0 ? itemTax : undefined, // Only include if > 0
              subtotal: itemSubtotal,
            };
          }) || [];
          
          const saleData = {
            tableId,
            subtotal: subtotal,
            tax: tax > 0 ? tax : undefined, // Only include tax if enabled and > 0
            total: total,
            paymentMethod: 'CASH',
            cashReceived: Math.ceil(Number(paymentAmount)),
            change: Math.ceil(Math.max(0, paymentAmount - total)),
            items: saleItems,
          };
          
          if (isOnline) {
            try {
              const saleResponse = await api.post('/sales', saleData);
              // Save to local DB
              if (saleResponse.data) {
                await db.sales.put({ ...saleResponse.data, synced: true });
              }
            } catch (error: any) {
              if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
                // Offline: save to local DB and queue for sync
                const localSaleId = `local_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const localSale = {
                  ...saleData,
                  id: localSaleId,
                  createdAt: new Date().toISOString(),
                  synced: false,
                };
                await db.sales.put(localSale);
                await addToSyncQueue('sale', 'create', localSaleId, saleData);
              } else {
                throw error;
              }
            }
          } else {
            // Offline: save to local DB and queue for sync
            const localSaleId = `local_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const localSale = {
              ...saleData,
              id: localSaleId,
              createdAt: new Date().toISOString(),
              synced: false,
            };
            await db.sales.put(localSale);
            await addToSyncQueue('sale', 'create', localSaleId, saleData);
          }
        }
      
      return { tableResponse: tableResponse.data, tableId };
    },
    onSuccess: (data) => {
      // Clear cart items for this table after successful checkout
      setTableCartItems(prev => {
        const updated = { ...prev };
        delete updated[data.tableId];
        return updated;
      });
      
      // Close dialog and clear selected table
      setCheckoutDialogOpen(false);
      setSelectedTable(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh product stock
    },
    onError: (error: any) => {
      console.error('Checkout failed:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Checkout failed. Please try again.';
      alert(Array.isArray(errorMessage) ? errorMessage.join('\n') : errorMessage);
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

  const createTableMutation = useMutation({
    mutationFn: async ({ tableNumber, gameId }: { tableNumber: number; gameId?: string }) => {
      const response = await api.post('/tables', { tableNumber, gameId: gameId || undefined });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setCreateTableDialogOpen(false);
      setNewTableNumber(1);
      setSelectedGameId('');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create table';
      alert(errorMessage);
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async ({ tableId }: { tableId: string }) => {
      const response = await api.delete(`/tables/${tableId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete table';
      alert(errorMessage);
    },
  });

  const deleteAllTablesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/tables/all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setDeleteAllTablesDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete tables';
      alert(errorMessage);
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
    const now = currentTime; // Use client-side currentTime for smooth updates
    
    if (table.status === 'PAUSED' && table.pausedAt) {
      // When paused, calculate up to the pause time
      // totalPausedMs does NOT include the current pause yet (it will be added on resume)
      const pausedAt = new Date(table.pausedAt).getTime();
      const totalElapsed = pausedAt - start;
      const totalPausedMs = table.totalPausedMs || 0;
      const activeTime = Math.max(0, totalElapsed - totalPausedMs);
      
      const hours = Math.floor(activeTime / 3600000);
      const minutes = Math.floor((activeTime % 3600000) / 60000);
      const seconds = Math.floor((activeTime % 60000) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (table.status === 'OCCUPIED') {
      // When occupied, calculate from start minus all paused time
      // totalPausedMs contains all previous pauses (added when resuming)
      const totalElapsed = now - start;
      const totalPausedMs = table.totalPausedMs || 0;
      const activeTime = Math.max(0, totalElapsed - totalPausedMs);
      
      const hours = Math.floor(activeTime / 3600000);
      const minutes = Math.floor((activeTime % 3600000) / 60000);
      const seconds = Math.floor((activeTime % 60000) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return '00:00:00';
  };

  const calculateCurrentCharge = (table: Table): number => {
    if (!table.startedAt || (table.status !== 'OCCUPIED' && table.status !== 'PAUSED')) return 0;
    
    // If paused, use the backend's currentCharge (it's calculated and stored when paused)
    if (table.status === 'PAUSED' && table.currentCharge !== undefined) {
      return Number(table.currentCharge);
    }
    
    // When occupied, calculate charge based on active time
    // Use game's rate type to determine if rate is per minute or per hour
    const start = new Date(table.startedAt).getTime();
    const now = currentTime; // Use client-side currentTime for smooth updates
    const totalElapsed = now - start;
    const totalPausedMs = table.totalPausedMs || 0;
    const activeTime = totalElapsed - totalPausedMs;
    
    // Get rate type from game, default to PER_MINUTE
    const rateType = (table as any).game?.rateType || 'PER_MINUTE';
    const rate = Number(table.ratePerHour);
    
    let charge = 0;
    if (rateType === 'PER_HOUR') {
      // Rate is per hour
      const hours = activeTime / (1000 * 60 * 60);
      charge = hours * rate;
    } else {
      // Rate is per minute (default)
      const minutes = activeTime / 60000;
      charge = minutes * rate;
    }
    
    return Math.max(0, charge);
  };

  const formatTime = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper function to render table card
  const renderTableCard = (table: Table, game: any, gameTableNumber: number) => {
    const elapsedTime = calculateElapsedTime(table);
    const currentCharge = Number(calculateCurrentCharge(table));
    const isOccupied = table.status === 'OCCUPIED' || table.status === 'PAUSED';

    // Get game name - use game parameter or fallback to table.game
    const gameName = game?.name || (table as any).game?.name || 'Table';

    // Different gradient colors for different table statuses
    const getCardGradient = () => {
      if (table.status === 'AVAILABLE') {
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      } else if (table.status === 'OCCUPIED') {
        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      } else if (table.status === 'PAUSED') {
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      }
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };

    const isExpanded = expandedCards[table.id] || false;
    const toggleExpand = () => {
      setExpandedCards(prev => ({ ...prev, [table.id]: !prev[table.id] }));
    };

    // Get rate display based on game's rate type
    const rateType = game?.rateType || (table as any).game?.rateType || 'PER_MINUTE';
    const rateLabel = rateType === 'PER_HOUR' ? 'PKR/hour' : 'PKR/min';
    const rateValue = table.ratePerHour ? Number(table.ratePerHour) : (game?.defaultRate || (table as any).game?.defaultRate || 8);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
        <Card
          sx={{
            background: getCardGradient(),
            color: 'white',
            borderRadius: 3,
            position: 'relative',
            minHeight: isExpanded ? 'auto' : 180,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)',
            }
          }}
        >
          <CardContent>
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={isExpanded ? 2 : (isOccupied ? 1 : 0)}
              sx={{ cursor: 'pointer' }}
              onClick={toggleExpand}
            >
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  🎱 {gameName} {gameTableNumber}
                </Typography>
                {!isOccupied && (
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, mt: 0.5 }}>
                    ({rateValue} {rateLabel})
                  </Typography>
                )}
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {table.status === 'AVAILABLE' && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${gameName} ${gameTableNumber}?`)) {
                        deleteTableMutation.mutate({ tableId: table.id });
                      }
                    }}
                    sx={{ 
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                      }
                    }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                  }}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
            </Box>

            {/* Show time and cost when collapsed and occupied */}
            {!isExpanded && isOccupied && (
              <Box 
                sx={{ 
                  mt: 1,
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="h6" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {elapsedTime}
                  </Typography>
                  {table.status === 'PAUSED' && (
                    <Chip 
                      label="PAUSED" 
                      size="small" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        height: 20,
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
                        color: '#000',
                        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  PKR {Math.ceil(currentCharge)}
                </Typography>
              </Box>
            )}

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Button
                variant="contained"
                size="small"
                startIcon={<History />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTable(table);
                  setHistoryDialogOpen(true);
                }}
                sx={{ 
                  mb: 2, 
                  background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
                  color: '#000',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FFA500 30%, #FFD700 90%)',
                    boxShadow: '0 6px 20px rgba(255, 215, 0, 0.6)',
                  }
                }}
              >
                View History
              </Button>

              {isOccupied && (
              <>
                <Box mb={2} sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    {formatTime(table.startedAt)} →
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h5" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {elapsedTime}
                    </Typography>
                    {table.status === 'PAUSED' && (
                      <Chip 
                        label="PAUSED" 
                        size="small" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: 24,
                          fontWeight: 'bold',
                          background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
                          color: '#000',
                          boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    PKR {Math.ceil(currentCharge)}
                  </Typography>
                  {table.status === 'PAUSED' && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                      ⏸️ Timer paused - not charging
                    </Typography>
                  )}
                </Box>

                {/* Pause/Resume Buttons */}
                <Box display="flex" gap={1} mb={1}>
                  {table.status === 'OCCUPIED' ? (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Pause />}
                      onClick={() => pauseTableMutation.mutate(table.id)}
                      disabled={pauseTableMutation.isPending}
                      fullWidth
                      sx={{ 
                        background: 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                          boxShadow: '0 6px 20px rgba(255, 152, 0, 0.6)',
                        }
                      }}
                    >
                      Pause
                    </Button>
                  ) : table.status === 'PAUSED' ? (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => resumeTableMutation.mutate(table.id)}
                      disabled={resumeTableMutation.isPending}
                      fullWidth
                      sx={{ 
                        background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                          boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
                        }
                      }}
                    >
                      Resume
                    </Button>
                  ) : null}
                </Box>

                <Box display="flex" gap={1} mb={1}>
                  <Button
                    variant="contained"
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
                    sx={{ 
                      background: 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                        boxShadow: '0 6px 20px rgba(244, 67, 54, 0.6)',
                      },
                      '&:disabled': {
                        background: 'rgba(0, 0, 0, 0.2)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }
                    }}
                  >
                    Check Out {table.status !== 'PAUSED' && table.status === 'OCCUPIED' && '(Will Pause First)'}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      if (confirm(`Reset ${gameName} ${gameTableNumber}? This will clear all data without creating a sale.`)) {
                        resetTableMutation.mutate({ tableId: table.id });
                      }
                    }}
                    sx={{ 
                      minWidth: 80,
                      background: 'linear-gradient(45deg, #9E9E9E 30%, #757575 90%)',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 15px rgba(158, 158, 158, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #757575 30%, #9E9E9E 90%)',
                        boxShadow: '0 6px 20px rgba(158, 158, 158, 0.6)',
                      }
                    }}
                  >
                    Reset
                  </Button>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setSelectedTable(table);
                    setCanteenDialogOpen(true);
                  }}
                  sx={{ 
                    background: 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                      boxShadow: '0 6px 20px rgba(33, 150, 243, 0.6)',
                    }
                  }}
                >
                  Add
                </Button>
              </>
              )}

              {!isOccupied && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckCircle />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!activeShift) {
                      alert('⚠️ Please start a shift first before checking in a table!');
                      return;
                    }
                    setSelectedTable(table);
                    setRatePerMinute(rateValue); // Use game's default rate or table's rate
                    setStartTableDialogOpen(true);
                  }}
                  disabled={!activeShift}
                  sx={{ 
                    mt: 4,
                    background: activeShift 
                      ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                      : 'rgba(0, 0, 0, 0.2)',
                    color: activeShift ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    fontWeight: 'bold',
                    boxShadow: activeShift ? '0 4px 15px rgba(76, 175, 80, 0.4)' : 'none',
                    '&:hover': activeShift ? {
                      background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
                    } : {},
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.2)',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }
                  }}
                  title={!activeShift ? 'Please start a shift first' : ''}
                >
                  {activeShift ? 'Check In' : '⚠️ Start Shift First'}
                </Button>
              )}
            </Collapse>

            {/* Show Check In button when collapsed and available */}
            {!isExpanded && !isOccupied && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<CheckCircle />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!activeShift) {
                    alert('⚠️ Please start a shift first before checking in a table!');
                    return;
                  }
                  setSelectedTable(table);
                  setRatePerMinute(rateValue); // Use game's default rate or table's rate
                  setStartTableDialogOpen(true);
                }}
                disabled={!activeShift}
                sx={{ 
                  mt: 2,
                  background: activeShift 
                    ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                    : 'rgba(0, 0, 0, 0.2)',
                  color: activeShift ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 'bold',
                  boxShadow: activeShift ? '0 4px 15px rgba(76, 175, 80, 0.4)' : 'none',
                  '&:hover': activeShift ? {
                    background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
                  } : {},
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }
                }}
                title={!activeShift ? 'Please start a shift first' : ''}
              >
                {activeShift ? 'Check In' : '⚠️ Start Shift First'}
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <AppBar position="static" sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: 1 }}>
            🎱 Smart Cue
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            +92 316 1126671
          </Typography>
          <OfflineIndicator compact />
          {!activeShift && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => setShiftModalOpen(true)}
              sx={{ 
                mr: 1,
                py: 0.5,
                px: 1.5,
                fontSize: '0.85rem',
                background: 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)',
                boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                  boxShadow: '0 6px 20px rgba(255, 152, 0, 0.6)',
                }
              }}
            >
              Start Shift
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setGamesDialogOpen(true)}
            sx={{ 
              mr: 1,
              py: 0.5,
              px: 1.5,
              fontSize: '0.85rem',
              background: 'linear-gradient(45deg, #9C27B0 30%, #7B1FA2 90%)',
              boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7B1FA2 30%, #9C27B0 90%)',
                boxShadow: '0 6px 20px rgba(156, 39, 176, 0.6)',
              }
            }}
          >
            Manage Games
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => {
              // Find the next available table number
              const maxTableNumber = tables.length > 0 
                ? Math.max(...tables.map((t: Table) => t.tableNumber))
                : 0;
              setNewTableNumber(maxTableNumber + 1);
              setCreateTableDialogOpen(true);
            }}
            sx={{ 
              mr: 1,
              py: 0.5,
              px: 1.5,
              fontSize: '0.85rem',
              background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
              }
            }}
          >
            New Table
          </Button>
          {tables.length > 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Remove />}
              onClick={() => setDeleteAllTablesDialogOpen(true)}
              sx={{ 
                mr: 1,
                py: 0.5,
                px: 1.5,
                fontSize: '0.85rem',
                background: 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)',
                boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                  boxShadow: '0 6px 20px rgba(244, 67, 54, 0.6)',
                }
              }}
            >
              Delete All
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<Assessment />}
            onClick={(e) => setAddonsAnchor(e.currentTarget)}
            sx={{ 
              mr: 1,
              py: 0.5,
              px: 1.5,
              fontSize: '0.85rem',
              background: 'linear-gradient(45deg, #00BCD4 30%, #0097A7 90%)',
              boxShadow: '0 4px 15px rgba(0, 188, 212, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0097A7 30%, #00BCD4 90%)',
                boxShadow: '0 6px 20px rgba(0, 188, 212, 0.6)',
              }
            }}
          >
            Reports
          </Button>
          <Button 
            variant="contained"
            size="small"
            onClick={() => setInventoryDialogOpen(true)} 
            sx={{ 
              mr: 1,
              py: 0.5,
              px: 1.5,
              fontSize: '0.85rem',
              background: 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)',
              boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                boxShadow: '0 6px 20px rgba(33, 150, 243, 0.6)',
              }
            }}
          >
            Inventory
          </Button>
          <Button 
            variant="contained"
            size="small"
            onClick={() => setExpenseDialogOpen(true)} 
            sx={{ 
              mr: 1,
              py: 0.5,
              px: 1.5,
              fontSize: '0.85rem',
              background: 'linear-gradient(45deg, #9C27B0 30%, #7B1FA2 90%)',
              boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7B1FA2 30%, #9C27B0 90%)',
                boxShadow: '0 6px 20px rgba(156, 39, 176, 0.6)',
              }
            }}
          >
            Expense
          </Button>
          <Button 
            variant="contained"
            size="small"
            onClick={() => setReportsDialogOpen(true)} 
            sx={{ 
              mr: 1,
              py: 0.5,
              px: 1.5,
              fontSize: '0.85rem',
              background: 'linear-gradient(45deg, #00BCD4 30%, #0097A7 90%)',
              boxShadow: '0 4px 15px rgba(0, 188, 212, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0097A7 30%, #00BCD4 90%)',
                boxShadow: '0 6px 20px rgba(0, 188, 212, 0.6)',
              }
            }}
          >
            Closing
          </Button>
          <Button 
            variant="contained"
            size="small"
            startIcon={<Logout />} 
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }}
            sx={{
              py: 0.5,
              px: 1.5,
              fontSize: '0.85rem',
              background: 'linear-gradient(45deg, #FF5722 30%, #E64A19 90%)',
              boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #E64A19 30%, #FF5722 90%)',
                boxShadow: '0 6px 20px rgba(255, 87, 34, 0.6)',
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Reports Menu */}
      <Menu
        anchorEl={addonsAnchor}
        open={Boolean(addonsAnchor)}
        onClose={() => setAddonsAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            mt: 1,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            setAddonsAnchor(null);
            setCustomReportsDialogOpen(true);
          }}
          sx={{
            '&:hover': {
              bgcolor: 'rgba(0, 188, 212, 0.1)',
            },
          }}
        >
          <ListItemIcon>
            <Assessment fontSize="small" sx={{ color: '#00BCD4' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Custom Reports"
            primaryTypographyProps={{
              fontWeight: 'medium',
            }}
          />
        </MenuItem>
      </Menu>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Render games with their tables */}
        {games.map((game: any) => {
          const gameTables = tablesByGame[game.id] || [];
          if (gameTables.length === 0) return null; // Don't show games with no tables
          
          return (
            <Box key={`game-${game.id}`} sx={{ mb: 4 }}>
              <Box
                sx={{
                  mb: 2,
                  p: 2.5,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                  border: '2px solid rgba(102, 126, 234, 0.4)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                }}
              >
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Typography variant="h4" fontWeight="bold" sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    🎮 {game.name}
                  </Typography>
                  <Chip 
                    label={game.rateType === 'PER_HOUR' ? 'Per Hour' : 'Per Minute'} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: game.rateType === 'PER_HOUR' 
                        ? 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)'
                        : 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                      color: 'white',
                    }}
                  />
                  {game.description && (
                    <Typography variant="body2" sx={{ opacity: 0.8, flex: 1 }}>
                      {game.description}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Grid container spacing={3}>
                {gameTables.map((table: Table, index: number) => {
                  return renderTableCard(table, game, index + 1);
                })}
              </Grid>
            </Box>
          );
        })}

        {/* Create Table Card - moved outside game sections */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                borderRadius: 3,
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 10px 40px rgba(17, 153, 142, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 15px 50px rgba(17, 153, 142, 0.5)',
                  background: 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
                },
              }}
              onClick={() => {
                // Find the next available table number
                const maxTableNumber = tables.length > 0 
                  ? Math.max(...tables.map((t: Table) => t.tableNumber))
                  : 0;
                setNewTableNumber(maxTableNumber + 1);
                setCreateTableDialogOpen(true);
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Add sx={{ fontSize: 40, mb: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
                <Typography variant="h6" fontWeight="bold">Create Table</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Checkout Dialog */}
      <CheckoutDialog
        games={games}
        tables={tables}
        open={checkoutDialogOpen}
        onClose={() => {
          setCheckoutDialogOpen(false);
          setSelectedTable(null);
        }}
        table={selectedTable}
        cartItems={selectedTable ? (tableCartItems[selectedTable.id] || []) : []}
        onCheckout={(amount, skipSale, taxEnabled = true) => {
          if (selectedTable) {
            const tableId = selectedTable.id;
            stopTableMutation.mutate({ 
              tableId, 
              paymentAmount: amount,
              cartItems: tableCartItems[tableId] || [],
              skipSale: skipSale || false,
              taxEnabled: taxEnabled,
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
        items={selectedTable ? (tableCartItems[selectedTable.id] || []) : []}
        onItemsChange={(items) => {
          if (selectedTable) {
            setTableCartItems(prev => ({
              ...prev,
              [selectedTable.id]: items,
            }));
          }
        }}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
      />

      {/* Reports Dialog (Daily Closing) */}
      <ReportsDialog
        open={reportsDialogOpen}
        onClose={() => setReportsDialogOpen(false)}
      />

      {/* Custom Reports Dialog */}
      <CustomReportsDialog
        open={customReportsDialogOpen}
        onClose={() => setCustomReportsDialogOpen(false)}
      />

      {/* Shift Modal */}
      <ShiftModal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        mode="start"
      />

      {/* Games Dialog */}
      <GamesDialog
        open={gamesDialogOpen}
        onClose={() => setGamesDialogOpen(false)}
      />

      {/* Create Table Dialog */}
      <Dialog 
        open={createTableDialogOpen} 
        onClose={() => setCreateTableDialogOpen(false)} 
        maxWidth="sm" 
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
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.3rem',
            py: 2,
          }}
        >
          ➕ Create New Table
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Table Number"
            type="number"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(parseInt(e.target.value) || 1)}
            margin="normal"
            autoFocus
            inputProps={{ min: 1, inputMode: 'numeric', pattern: '[0-9]*' }}
            helperText="Enter the table number"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#11998e',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#11998e',
                  borderWidth: 2,
                },
              },
            }}
          />
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Game *</InputLabel>
              <Select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                label="Game *"
                sx={{ borderRadius: 2 }}
                required
              >
                {games.map((game: any) => (
                  <MenuItem key={game.id} value={game.id}>
                    {game.name} ({game.rateType === 'PER_HOUR' ? 'Per Hour' : 'Per Minute'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
          <Button 
            onClick={() => setCreateTableDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold',
              color: '#666',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (newTableNumber > 0 && selectedGameId) {
                createTableMutation.mutate({ tableNumber: newTableNumber, gameId: selectedGameId });
                setSelectedGameId(''); // Reset after creation
              }
            }}
            disabled={createTableMutation.isPending || newTableNumber <= 0 || !selectedGameId}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #11998e 30%, #38ef7d 90%)',
              boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #38ef7d 30%, #11998e 90%)',
                boxShadow: '0 6px 20px rgba(17, 153, 142, 0.6)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            ✨ Create Table
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Tables Dialog */}
      <Dialog 
        open={deleteAllTablesDialogOpen} 
        onClose={() => setDeleteAllTablesDialogOpen(false)} 
        maxWidth="sm" 
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
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.3rem',
            py: 2,
          }}
        >
          ⚠️ Delete All Tables
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete all available tables? This will only delete tables that are not currently in use.
          </Typography>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: 'rgba(244, 67, 54, 0.1)',
            border: '2px solid rgba(244, 67, 54, 0.3)',
          }}>
            <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
              ⚠️ Warning: This action cannot be undone. Tables that are currently occupied or paused will not be deleted.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
          <Button 
            onClick={() => setDeleteAllTablesDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold',
              color: '#666',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => deleteAllTablesMutation.mutate()}
            disabled={deleteAllTablesMutation.isPending}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #f44336 30%, #d32f2f 90%)',
              boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 30%, #f44336 90%)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.6)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            🗑️ Delete All Available Tables
          </Button>
        </DialogActions>
      </Dialog>

      {/* Start Table Dialog */}
      <Dialog 
        open={startTableDialogOpen} 
        onClose={() => setStartTableDialogOpen(false)} 
        maxWidth="sm" 
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
          ✅ Check In - {(() => {
            if (!selectedTable) return 'N/A';
            const tableGame = games.find((g: any) => g.id === selectedTable.gameId);
            const gameTables = tables.filter((t: any) => t.gameId === selectedTable.gameId);
            const gameTableNumber = gameTables.findIndex((t: any) => t.id === selectedTable.id) + 1;
            const gameName = tableGame?.name || 'Table';
            return `${gameName} ${gameTableNumber}`;
          })()}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {!activeShift && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              ⚠️ <strong>No Active Shift!</strong> Please start a shift first before checking in a table.
            </Alert>
          )}
          <TextField
            fullWidth
            label="Rate Per Minute (PKR)"
            type="number"
            value={ratePerMinute}
            onChange={(e) => setRatePerMinute(parseFloat(e.target.value) || 8)}
            margin="normal"
            autoFocus
            inputProps={{ min: 0, step: 0.01, inputMode: 'decimal', pattern: '[0-9.]*' }}
            helperText={`Default: PKR ${Math.ceil(ratePerMinute)}/min (PKR ${Math.ceil(ratePerMinute * 60)}/hour)`}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#4CAF50',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4CAF50',
                  borderWidth: 2,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
          <Button 
            onClick={() => setStartTableDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold',
              color: '#666',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!activeShift) {
                alert('⚠️ Please start a shift first before checking in a table!');
                setStartTableDialogOpen(false);
                return;
              }
              if (selectedTable) {
                startTableMutation.mutate({
                  tableId: selectedTable.id,
                  ratePerMinute: ratePerMinute || 8,
                });
              }
            }}
            disabled={startTableMutation.isPending || ratePerMinute <= 0 || !activeShift}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 'bold',
              background: activeShift
                ? 'linear-gradient(135deg, #4CAF50 30%, #45a049 90%)'
                : 'rgba(0, 0, 0, 0.2)',
              boxShadow: activeShift ? '0 4px 15px rgba(76, 175, 80, 0.4)' : 'none',
              '&:hover': activeShift ? {
                background: 'linear-gradient(135deg, #45a049 30%, #4CAF50 90%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
              } : {},
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'rgba(0, 0, 0, 0.5)',
              },
            }}
          >
            {startTableMutation.isPending 
              ? 'Starting...' 
              : !activeShift 
                ? '⚠️ Start Shift First' 
                : '🚀 Start Table'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Checkout Dialog Component
function CheckoutDialog({ open, onClose, table, onCheckout, cartItems = [], games = [], tables = [] }: { open: boolean; onClose: () => void; table: Table | null; onCheckout: (amount: number, skipSale?: boolean, taxEnabled?: boolean) => void; cartItems?: CartItem[]; games?: any[]; tables?: any[] }) {
  const [amount, setAmount] = useState(0);
  const [frozenCharge, setFrozenCharge] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(true); // Default to enabled

  // Calculate cart totals (rounded up)
  const cartSubtotal = Math.ceil(cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0));
  
  // Freeze the charge when dialog opens (use backend's currentCharge)
  useEffect(() => {
    if (open && table) {
      // Use backend's currentCharge (it's calculated and stored when paused)
      const charge = table.currentCharge ? Number(table.currentCharge) : 0;
      setFrozenCharge(charge);
      setTaxEnabled(true); // Reset to enabled when dialog opens
    } else if (!open) {
      setFrozenCharge(0);
      setTaxEnabled(true);
      setAmount(0);
    }
  }, [open, table?.id, table?.status, table?.currentCharge]);

  const tableCharge = Math.ceil(frozenCharge); // Round up table charge
  
  // Calculate tax on both table charge and cart items (rounded up)
  const tableTax = taxEnabled && tableCharge > 0 ? Math.ceil(tableCharge * 0.15) : 0;
  const cartTax = taxEnabled && cartSubtotal > 0 ? Math.ceil(cartSubtotal * 0.15) : 0;
  const totalTax = tableTax + cartTax;
  
  const tableChargeWithTax = tableCharge + tableTax;
  const cartTotal = cartSubtotal + cartTax;
  const totalCharge = Math.ceil(tableChargeWithTax + cartTotal);

  // Update amount when taxEnabled, cartSubtotal, or frozenCharge changes
  useEffect(() => {
    if (open && table) {
      const currentTableTax = taxEnabled && tableCharge > 0 ? Math.ceil(tableCharge * 0.15) : 0;
      const currentCartTax = taxEnabled && cartSubtotal > 0 ? Math.ceil(cartSubtotal * 0.15) : 0;
      const currentTotal = Math.ceil(tableCharge + currentTableTax + cartSubtotal + currentCartTax);
      setAmount(currentTotal);
    }
  }, [taxEnabled, cartSubtotal, tableCharge, open, table]);

  if (!table) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
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
        🧾 Check Out - {(() => {
            if (!table) return 'N/A';
            const tableGame = games.find((g: any) => g.id === table.gameId);
            const gameTables = tables.filter((t: any) => t.gameId === table.gameId);
            const gameTableNumber = gameTables.findIndex((t: any) => t.id === table.id) + 1;
            const gameName = tableGame?.name || 'Table';
            return `${gameName} ${gameTableNumber}`;
          })()}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box mb={2}>
          {/* Table Charge Section */}
          <Box sx={{ 
            mt: 2, 
            mb: 2,
            p: 2,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: '#667eea' }}>
              💰 Table Bill:
            </Typography>
            {table.status === 'PAUSED' ? (
              <>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Table Charge (Paused):
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PKR {tableCharge}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Charge is frozen at pause time
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="warning.main">
                  ⚠️ Table is not paused. Please pause the table first.
                </Typography>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Charge:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PKR {tableCharge}
                  </Typography>
                </Box>
              </>
            )}
            {taxEnabled && tableTax > 0 && (
              <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="body2">Tax (15%):</Typography>
                <Typography variant="body2">PKR {tableTax}</Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="body2" fontWeight="bold">Table Total:</Typography>
              <Typography variant="body2" fontWeight="bold">PKR {tableChargeWithTax}</Typography>
            </Box>
          </Box>

          {/* Cart Items Section */}
          {cartItems.length > 0 && (
            <Box sx={{ 
              mt: 2, 
              mb: 2,
              p: 2,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: '#667eea' }}>
                🛒 Cart Items:
              </Typography>
              {cartItems.map((item, index) => (
                <Box key={item.productId} display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">
                    {item.quantity}x {item.name}
                  </Typography>
                  <Typography variant="body2">
                    PKR {Math.ceil(Number(item.price) * item.quantity)}
                  </Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="body2">Cart Subtotal:</Typography>
                <Typography variant="body2">PKR {cartSubtotal}</Typography>
              </Box>
              {taxEnabled && cartTax > 0 && (
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="body2">Tax (15%):</Typography>
                  <Typography variant="body2">PKR {cartTax}</Typography>
                </Box>
              )}
              <Box display="flex" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="body2" fontWeight="bold">Cart Total:</Typography>
                <Typography variant="body2" fontWeight="bold">PKR {cartTotal}</Typography>
              </Box>
            </Box>
          )}
          
          {/* Tax Option - Always visible */}
          <Box sx={{ 
            mt: 2, 
            mb: 2, 
            p: 2.5, 
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: 2,
            border: '2px solid rgba(102, 126, 234, 0.2)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={taxEnabled}
                  onChange={(e) => {
                    const newTaxEnabled = e.target.checked;
                    setTaxEnabled(newTaxEnabled);
                  }}
                  sx={{
                    color: '#667eea',
                    '&.Mui-checked': {
                      color: '#667eea',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body1" fontWeight="bold" sx={{ color: '#667eea' }}>
                  💳 Apply Tax (15%) on Table Bill & Cart Items
                </Typography>
              }
            />
            {taxEnabled && totalTax > 0 && (
              <Box display="flex" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="body2" fontWeight="bold">Total Tax:</Typography>
                <Typography variant="body2" fontWeight="bold">PKR {totalTax}</Typography>
              </Box>
            )}
          </Box>
          
          <Box 
            display="flex" 
            justifyContent="space-between" 
            sx={{ 
              mt: 3, 
              pt: 2.5, 
              pb: 2,
              px: 2,
              borderTop: '3px solid #667eea',
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#667eea' }}>
              💵 Total Charge:
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              PKR {totalCharge}
            </Typography>
          </Box>
        </Box>
        <TextField
          fullWidth
          label="Payment Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          margin="normal"
          autoFocus
          inputProps={{ min: 0, step: 0.01, inputMode: 'decimal', pattern: '[0-9.]*' }}
          sx={{
            mt: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
                borderWidth: 2,
              },
            },
          }}
        />
        {amount > 0 && totalCharge > 0 && (
          <Typography 
            variant="body1" 
            fontWeight="bold"
            sx={{ 
              mt: 1,
              color: amount >= totalCharge ? '#4CAF50' : '#f44336',
              textAlign: 'center',
              p: 1,
              borderRadius: 1,
              bgcolor: amount >= totalCharge ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            }}
          >
            Change: PKR {Math.ceil(Math.max(0, amount - totalCharge))}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button 
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 'bold',
            color: '#666',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={() => {
            if (totalCharge > 0 && amount >= totalCharge && table.status === 'PAUSED') {
              onCheckout(amount, false, taxEnabled);
            }
          }}
          disabled={(totalCharge > 0 && amount < totalCharge) || table.status !== 'PAUSED'}
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: table.status === 'PAUSED' 
              ? 'linear-gradient(135deg, #4CAF50 30%, #45a049 90%)'
              : 'linear-gradient(135deg, #9E9E9E 30%, #757575 90%)',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
            '&:hover': {
              background: table.status === 'PAUSED'
                ? 'linear-gradient(135deg, #45a049 30%, #4CAF50 90%)'
                : 'linear-gradient(135deg, #757575 30%, #9E9E9E 90%)',
              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {table.status === 'PAUSED' ? '✅ Complete Checkout' : '⏸️ Pause Table First'}
        </Button>
        <Button 
          variant="contained"
          onClick={() => {
            // Reset table without creating sale
            if (confirm('Reset table without creating a sale? This will clear all data.')) {
              onCheckout(0, true, taxEnabled);
            }
          }}
          sx={{ 
            ml: 1,
            borderRadius: 2,
            px: 3,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)',
            boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
              boxShadow: '0 6px 20px rgba(255, 152, 0, 0.6)',
            },
          }}
        >
          Reset (No Sale)
        </Button>
      </DialogActions>
    </Dialog>
  );
}


