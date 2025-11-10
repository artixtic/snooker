'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Typography,
  Divider,
} from '@mui/material';
import api from '@/lib/api';

interface TableHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  table: any;
}

export function TableHistoryDialog({ open, onClose, table }: TableHistoryDialogProps) {
  const [tab, setTab] = useState(0);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [canteenDialogOpen, setCanteenDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const { data: sales = [] } = useQuery({
    queryKey: ['table-sales', table?.id],
    queryFn: async () => {
      if (!table?.id) return [];
      const response = await api.get('/sales', {
        params: { tableId: table.id },
      });
      return response.data;
    },
    enabled: open && !!table?.id,
  });

  const { data: tableData } = useQuery({
    queryKey: ['table', table?.id],
    queryFn: async () => {
      if (!table?.id) return null;
      const response = await api.get(`/tables/${table.id}`);
      return response.data;
    },
    enabled: open && !!table?.id,
  });

  const getTabLabel = (index: number) => {
    switch (index) {
      case 0:
        return 'Playing';
      case 1:
        return 'Unpaid';
      case 2:
        return 'Paid';
      default:
        return '';
    }
  };

  const getTabColor = (index: number) => {
    switch (index) {
      case 0:
        return '#1976d2'; // Blue
      case 1:
        return '#ff9800'; // Orange
      case 2:
        return '#2e7d32'; // Green
      default:
        return 'default';
    }
  };

  // For Playing tab, show active session if table is occupied
  const playingData = tab === 0 && tableData?.status === 'OCCUPIED' ? [tableData] : [];
  
  // For Unpaid/Paid tabs, filter sales
  const filteredSales = tab === 0 ? [] : sales.filter((sale: any) => {
    if (tab === 1) {
      // Unpaid - sales with credit payment or unpaid
      return sale.paymentMethod === 'CREDIT' || !sale.paymentMethod;
    }
    if (tab === 2) {
      // Paid - completed sales with cash/card payment
      return sale.paymentMethod && sale.paymentMethod !== 'CREDIT';
    }
    return true;
  });
  
  const displayData = tab === 0 ? playingData : filteredSales;

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
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          color: '#000',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        📜 Table History - Snooker {table?.tableNumber}
      </DialogTitle>
      <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto', pt: 3 }}>
        <Box 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <Tabs 
            value={tab} 
            onChange={(_, newValue) => setTab(newValue)}
            sx={{
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: '4px 4px 0 0',
              },
            }}
          >
            <Tab
              label="🎮 Playing"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                background: tab === 0 
                  ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' 
                  : 'transparent',
                color: tab === 0 ? 'white' : '#666',
                borderRadius: '8px 8px 0 0',
                '&.Mui-selected': { 
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: 'white',
                },
                transition: 'all 0.3s ease',
              }}
            />
            <Tab
              label="⏳ Unpaid"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                background: tab === 1 
                  ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' 
                  : 'transparent',
                color: tab === 1 ? 'white' : '#666',
                borderRadius: '8px 8px 0 0',
                '&.Mui-selected': { 
                  background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                  color: 'white',
                },
                transition: 'all 0.3s ease',
              }}
            />
            <Tab
              label="✅ Paid"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                background: tab === 2 
                  ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' 
                  : 'transparent',
                color: tab === 2 ? 'white' : '#666',
                borderRadius: '8px 8px 0 0',
                '&.Mui-selected': { 
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                },
                transition: 'all 0.3s ease',
              }}
            />
          </Tabs>
        </Box>

        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: '60vh', 
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            overflow: 'auto',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Rate (PKR/min)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Table Charge (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Canteen (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Total (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.8)',
                    }}>
                      <Typography variant="h6" color="text.secondary">
                        📭 No data available
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((item: any, index: number) => {
                  // For Playing tab, item is tableData
                  // For other tabs, item is sale
                  const isPlaying = tab === 0;
                  const sale = isPlaying ? null : item;
                  const tableSession = isPlaying ? item : sale?.table;
                  
                  // Calculate duration properly
                  let duration = 0;
                  if (tableSession?.startedAt) {
                    const startTime = new Date(tableSession.startedAt).getTime();
                    const endTime = tableSession?.endedAt 
                      ? new Date(tableSession.endedAt).getTime()
                      : (isPlaying ? Date.now() : new Date(sale?.createdAt || Date.now()).getTime());
                    
                    // Ensure we don't get negative values
                    duration = Math.max(0, Math.round((endTime - startTime) / 60000));
                  } else if (sale?.createdAt && sale?.table?.startedAt) {
                    // Fallback: use sale creation time as end time
                    const startTime = new Date(sale.table.startedAt).getTime();
                    const endTime = new Date(sale.createdAt).getTime();
                    duration = Math.max(0, Math.round((endTime - startTime) / 60000));
                  }
                  // ratePerHour is actually stored as per minute
                  const ratePerMinute = Number(tableSession?.ratePerHour || sale?.table?.ratePerHour || 0);
                  
                  // Calculate table charge from sale subtotal minus canteen items
                  const canteenItemsTotal = sale?.items?.reduce(
                    (sum: number, item: any) => sum + Number(item.subtotal),
                    0
                  ) || 0;
                  const tableCharge = sale ? (Number(sale.subtotal) - canteenItemsTotal) : (duration * ratePerMinute);
                  const canteenTotal = canteenItemsTotal;
                  const grandTotal = isPlaying ? tableCharge : (Number(sale?.total) || 0);

                  return (
                    <TableRow 
                      key={isPlaying ? tableSession?.id : sale?.id}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(102, 126, 234, 0.05)',
                        },
                        '&:nth-of-type(even)': {
                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {(tableSession?.startedAt || sale?.table?.startedAt || sale?.createdAt)
                          ? new Date(tableSession?.startedAt || sale?.table?.startedAt || sale?.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {(tableSession?.endedAt || (sale && !isPlaying ? sale.createdAt : null))
                          ? new Date(tableSession?.endedAt || sale?.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : isPlaying ? 'Playing...' : '-'}
                      </TableCell>
                      <TableCell>
                        {duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>PKR {Math.ceil(ratePerMinute)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>PKR {Math.ceil(tableCharge)}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>PKR {Math.ceil(canteenTotal)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>PKR {Math.ceil(grandTotal)}</TableCell>
                      <TableCell>
                        {tab === 2 ? (
                          <Chip
                            label="✅ Paid"
                            sx={{
                              background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                              color: 'white',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                            }}
                            size="small"
                          />
                        ) : (
                          <Chip
                            label={tab === 0 ? "🎮 Playing" : "⏳ Unpaid"}
                            sx={{
                              background: tab === 0 
                                ? 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)'
                                : 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)',
                              color: 'white',
                              fontWeight: 'bold',
                              boxShadow: tab === 0 
                                ? '0 2px 8px rgba(33, 150, 243, 0.3)'
                                : '0 2px 8px rgba(255, 152, 0, 0.3)',
                            }}
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {sale && (
                            <>
                              <Button 
                                size="small" 
                                variant="contained"
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setBillDialogOpen(true);
                                }}
                                sx={{
                                  borderRadius: 2,
                                  fontWeight: 'bold',
                                  background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
                                  color: '#000',
                                  boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #FFA500 30%, #FFD700 90%)',
                                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.5)',
                                  },
                                }}
                              >
                                View Bill
                              </Button>
                              {canteenTotal > 0 && (
                                <Button 
                                  size="small" 
                                  variant="contained"
                                  onClick={() => {
                                    setSelectedSale(sale);
                                    setCanteenDialogOpen(true);
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)',
                                    color: 'white',
                                    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                                    '&:hover': {
                                      background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.5)',
                                    },
                                  }}
                                >
                                  Canteen
                                </Button>
                              )}
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
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
            background: 'linear-gradient(135deg, #FFD700 30%, #FFA500 90%)',
            color: '#000',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FFA500 30%, #FFD700 90%)',
              boxShadow: '0 6px 20px rgba(255, 215, 0, 0.6)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>

      {/* Bill Details Dialog */}
      <Dialog 
        open={billDialogOpen} 
        onClose={() => setBillDialogOpen(false)} 
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
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '1.3rem',
            py: 2,
          }}
        >
          🧾 Bill Details - Receipt #{selectedSale?.receiptNumber || 'N/A'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedSale && (
            <Box>
              <Box 
                mb={3} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: 'rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 1, color: '#667eea' }}>
                  📅 Date: {new Date(selectedSale.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 1, color: '#667eea' }}>
                  🎱 Table: Snooker {table?.tableNumber}
                </Typography>
                {selectedSale.employee && (
                  <Typography variant="body1" fontWeight="bold" sx={{ color: '#667eea' }}>
                    👤 Staff: {selectedSale.employee.name}
                  </Typography>
                )}
              </Box>

              {/* Table Time and Cost Section */}
              {selectedSale.table && (
                <>
                  <Box 
                    mb={3}
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 2, 
                      background: 'rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold', mb: 2 }}>
                      🎱 Snooker Table
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {selectedSale.table.startedAt && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Check In:
                          </Typography>
                          <Typography variant="body2">
                            {new Date(selectedSale.table.startedAt).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      {(selectedSale.table.endedAt || selectedSale.createdAt) && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Check Out:
                          </Typography>
                          <Typography variant="body2">
                            {new Date(selectedSale.table.endedAt || selectedSale.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      {selectedSale.table.startedAt && (
                        <>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Duration:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {(() => {
                                const startTime = new Date(selectedSale.table.startedAt).getTime();
                                const endTime = selectedSale.table.endedAt
                                  ? new Date(selectedSale.table.endedAt).getTime()
                                  : new Date(selectedSale.createdAt).getTime();
                                const duration = Math.max(0, Math.round((endTime - startTime) / 60000));
                                const hours = Math.floor(duration / 60);
                                const minutes = duration % 60;
                                return `${hours}h ${minutes}m`;
                              })()}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Rate:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              PKR {Math.ceil(Number(selectedSale.table.ratePerHour || 0))}/min
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Table Charge:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              PKR {(() => {
                                const canteenItemsTotal = selectedSale.items?.reduce(
                                  (sum: number, item: any) => sum + Number(item.subtotal),
                                  0
                                ) || 0;
                                const tableCharge = Number(selectedSale.subtotal) - canteenItemsTotal;
                                return Math.ceil(tableCharge);
                              })()}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                </>
              )}
              
              {/* Canteen Items Section */}
              <Box 
                mb={3}
                sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  background: 'rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold', mb: 2 }}>
                  {selectedSale.items && selectedSale.items.length > 0 ? '🛒 Canteen Items' : '📦 No Items'}
                </Typography>
                {selectedSale.items && selectedSale.items.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSale.items.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.product?.name || 'Item'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">PKR {Math.ceil(Number(item.unitPrice))}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>PKR {Math.ceil(Number(item.subtotal))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No canteen items in this sale.
                  </Typography>
                )}
              </Box>
              
              {/* Totals Section */}
              <Box 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1.5}>
                  <Box display="flex" justifyContent="space-between" width="100%" maxWidth={350}>
                    <Typography variant="body1" fontWeight="medium">Subtotal:</Typography>
                    <Typography variant="body1" fontWeight="bold">PKR {Math.ceil(Number(selectedSale.subtotal))}</Typography>
                  </Box>
                  {selectedSale.discount > 0 && (
                    <Box display="flex" justifyContent="space-between" width="100%" maxWidth={350}>
                      <Typography variant="body1" fontWeight="medium">Discount:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="error">-PKR {Math.ceil(Number(selectedSale.discount))}</Typography>
                    </Box>
                  )}
                  {selectedSale.tax && Number(selectedSale.tax) > 0 && (
                    <Box display="flex" justifyContent="space-between" width="100%" maxWidth={350}>
                      <Typography variant="body1" fontWeight="medium">Tax:</Typography>
                      <Typography variant="body1" fontWeight="bold">PKR {Math.ceil(Number(selectedSale.tax))}</Typography>
                    </Box>
                  )}
                  <Box sx={{ width: '100%', maxWidth: 350, my: 1 }}>
                    <Divider />
                  </Box>
                  <Box display="flex" justifyContent="space-between" width="100%" maxWidth={350}>
                    <Typography variant="h5" fontWeight="bold" sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Total:
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      PKR {Math.ceil(Number(selectedSale.total))}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" width="100%" maxWidth={350} mt={2} pt={2} sx={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <Typography variant="body1" fontWeight="medium">Payment Method:</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedSale.paymentMethod}</Typography>
                  </Box>
                  {selectedSale.cashReceived && (
                    <Box display="flex" justifyContent="space-between" width="100%" maxWidth={350}>
                      <Typography variant="body1" fontWeight="medium">Cash Received:</Typography>
                      <Typography variant="body1" fontWeight="bold">PKR {Math.ceil(Number(selectedSale.cashReceived))}</Typography>
                    </Box>
                  )}
                  {selectedSale.change > 0 && (
                    <Box display="flex" justifyContent="space-between" width="100%" maxWidth={350}>
                      <Typography variant="body1" fontWeight="medium">Change:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">PKR {Math.ceil(Number(selectedSale.change))}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
          <Button 
            onClick={() => setBillDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFD700 30%, #FFA500 90%)',
              color: '#000',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FFA500 30%, #FFD700 90%)',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.6)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Canteen Items Dialog */}
      <Dialog 
        open={canteenDialogOpen} 
        onClose={() => setCanteenDialogOpen(false)} 
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
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.3rem',
            py: 2,
          }}
        >
          🛒 Canteen Items - Receipt #{selectedSale?.receiptNumber || 'N/A'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedSale && selectedSale.items && selectedSale.items.length > 0 ? (
            <TableContainer
              sx={{
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedSale.items.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.product?.name || 'Item'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">PKR {Math.ceil(Number(item.unitPrice))}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>PKR {Math.ceil(Number(item.subtotal))}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        Total:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        PKR {Math.ceil(selectedSale.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.8)',
            }}>
              <Typography variant="h6" color="text.secondary">
                📦 No canteen items in this sale.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
          <Button 
            onClick={() => setCanteenDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #2196F3 30%, #1976D2 90%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1976D2 30%, #2196F3 90%)',
                boxShadow: '0 6px 20px rgba(33, 150, 243, 0.6)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

