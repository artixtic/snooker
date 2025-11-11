'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import api from '@/lib/api';

interface CustomReportsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CustomReportsDialog({ open, onClose }: CustomReportsDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [reportType, setReportType] = useState<'daily' | 'range'>('range');

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['custom-report', startDate, endDate, reportType],
    queryFn: async () => {
      if (reportType === 'daily' && startDate) {
        const response = await api.get(`/reports/daily?date=${startDate}`);
        return response.data;
      } else if (reportType === 'range' && startDate && endDate) {
        // For now, we'll use daily endpoint for the start date
        // Ideally there should be a range endpoint on the backend
        const response = await api.get(`/reports/daily?date=${startDate}`);
        return response.data;
      }
      return null;
    },
    enabled: false, // Don't auto-fetch, only fetch when Generate is clicked
  });

  const handleGenerate = () => {
    refetch();
  };

  const gameTotals = report?.gameTotals || [];
  const snookerTotal = report?.snookerTotal || 0;
  const canteenTotal = report?.canteenTotal || 0;
  const totalTaxes = report?.totalTaxes || 0;
  const canteenTax = report?.canteenTax || 0;
  const canteenSalesWithTax = report?.canteenSalesWithTax || 0;
  const total = report?.totalSales || 0;
  const expense = report?.totalExpenses || 0;
  const profit = total - expense;
  const totalCash = report?.totalCash || 0;
  const totalCard = report?.totalCard || 0;
  const saleCount = report?.saleCount || 0;
  const topProducts = report?.topProducts || [];
  const tableSessions = report?.tableSessions || 0;
  const averageSaleValue = report?.averageSaleValue || 0;

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
          background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2,
        }}
      >
        📊 Custom Report Generation
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            mb: 3,
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              color: '#00BCD4',
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            📅 Report Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value as 'daily' | 'range')}
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="daily">Daily Report</MenuItem>
                  <MenuItem value="range">Date Range Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#00BCD4',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00BCD4',
                    },
                  },
                }}
              />
            </Grid>
            {reportType === 'range' && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#00BCD4',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00BCD4',
                      },
                    },
                  }}
                />
              </Grid>
            )}
          </Grid>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isLoading || !startDate || (reportType === 'range' && (!endDate || endDate < startDate))}
            sx={{
              mt: 2,
              borderRadius: 2,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00BCD4 30%, #0097A7 90%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(0, 188, 212, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0097A7 30%, #00BCD4 90%)',
                boxShadow: '0 6px 20px rgba(0, 188, 212, 0.6)',
              },
            }}
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </Box>

        {report && (
          <Box>
            {/* Report Header */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(0, 151, 167, 0.1) 100%)',
                mb: 3,
                border: '2px solid rgba(0, 188, 212, 0.2)',
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#00BCD4',
                  fontWeight: 'bold',
                  mb: 1,
                }}
              >
                📊 Detailed Report - {report.date || (reportType === 'daily' ? startDate : `${startDate} to ${endDate}`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generated on {new Date().toLocaleString()}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Revenue Summary */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    height: '100%',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#00BCD4',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    💵 Revenue Summary
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {/* Display each game's totals */}
                        {gameTotals.map((game: any) => (
                          <TableRow key={game.gameName}>
                            <TableCell sx={{ fontWeight: 'medium' }}>
                              🎮 {game.gameName} ({game.tableSessions} session{game.tableSessions !== 1 ? 's' : ''})
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                              PKR {Math.ceil(game.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {gameTotals.length === 0 && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>🎱 Games Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                              PKR {Math.ceil(snookerTotal)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>🛒 Canteen</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                            PKR {Math.ceil(canteenTotal)}
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'rgba(0, 188, 212, 0.1)' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Subtotal (Before Tax)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#00BCD4' }}>
                            PKR {Math.ceil(snookerTotal + canteenTotal)}
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'rgba(0, 188, 212, 0.1)' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Total Sales (With Tax)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#00BCD4' }}>
                            PKR {Math.ceil(total)}
                          </TableCell>
                        </TableRow>
                        
                        {/* Detailed Tax Information */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ pt: 2, pb: 1, fontWeight: 'bold', fontSize: '0.95rem', color: '#FF9800' }}>
                            💰 Tax Breakdown
                          </TableCell>
                        </TableRow>
                        {gameTotals.map((game: any) => (
                          game.tax > 0 && (
                            <TableRow key={`tax-${game.gameName}`}>
                              <TableCell sx={{ pl: 4, fontWeight: 'medium', fontSize: '0.85rem' }}>
                                🎮 {game.gameName} Tax ({game.sessionsWithTax} of {game.tableSessions} sessions)
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.85rem' }}>
                                PKR {Math.ceil(game.tax)}
                              </TableCell>
                            </TableRow>
                          )
                        ))}
                        {canteenTax > 0 && (
                          <TableRow>
                            <TableCell sx={{ pl: 4, fontWeight: 'medium', fontSize: '0.85rem' }}>
                              🛒 Canteen Tax ({canteenSalesWithTax} sale{canteenSalesWithTax !== 1 ? 's' : ''} with tax)
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.85rem' }}>
                              PKR {Math.ceil(canteenTax)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>💰 Total Taxes Collected</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#FF9800' }}>
                            PKR {Math.ceil(totalTaxes)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>

              {/* Payment Methods & Statistics */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    height: '100%',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#00BCD4',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    💳 Payment Methods & Statistics
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>💵 Cash</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                            PKR {Math.ceil(totalCash)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>💳 Card</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                            PKR {Math.ceil(totalCard)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>📊 Total Sales Count</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {saleCount}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>📈 Average Sale Value</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                            PKR {Math.ceil(averageSaleValue)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>🎱 Table Sessions</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {tableSessions}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>

              {/* Expenses & Profit */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    height: '100%',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#00BCD4',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    💰 Financial Summary
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>💸 Total Expenses</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                            PKR {Math.ceil(expense)}
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>💰 Net Profit</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#4CAF50' }}>
                            PKR {Math.ceil(profit)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>📊 Profit Margin</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: total > 0 ? '#4CAF50' : '#f44336' }}>
                            {total > 0 ? `${Math.ceil((profit / total) * 100)}%` : '0%'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>

              {/* Top Products */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    height: '100%',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#00BCD4',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    🏆 Top Products
                  </Typography>
                  {topProducts.length > 0 ? (
                    <TableContainer 
                      component={Paper}
                      sx={{
                        borderRadius: 2,
                        maxHeight: 300,
                        overflow: 'auto',
                      }}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0, 188, 212, 0.1)' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Revenue (PKR)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topProducts.map((item: any, index: number) => (
                            <TableRow 
                              key={item.product?.id || index}
                              sx={{
                                '&:hover': {
                                  bgcolor: 'rgba(0, 188, 212, 0.05)',
                                },
                                '&:nth-of-type(even)': {
                                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                                },
                              }}
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>{item.product?.name || 'N/A'}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                                PKR {Math.ceil(item.revenue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No product sales data available
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, background: 'rgba(255, 255, 255, 0.5)' }}>
        <Button 
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #00BCD4 30%, #0097A7 90%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0, 188, 212, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0097A7 30%, #00BCD4 90%)',
              boxShadow: '0 6px 20px rgba(0, 188, 212, 0.6)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

