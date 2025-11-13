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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function AdminActivityLogsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', startDate, endDate, entityFilter, userIdFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      if (entityFilter) params.append('entity', entityFilter);
      if (userIdFilter) params.append('userId', userIdFilter);

      const response = await api.get(`/activity-logs?${params.toString()}`);
      return response.data;
    },
  });

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'login':
        return 'default';
      default:
        return 'default';
    }
  };

  const entities = Array.from(new Set(logs.map((log: any) => log.entity))).filter(Boolean) as string[];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Activity Logs
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Entity</InputLabel>
              <Select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                label="Entity"
              >
                <MenuItem value="">All</MenuItem>
                {entities.map((entity) => (
                  <MenuItem key={entity} value={entity}>
                    {entity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              placeholder="Filter by user..."
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date & Time</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Entity ID</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.createdAt), 'PPp')}
                  </TableCell>
                  <TableCell>{log.user?.name || 'System'}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      color={getActionColor(log.action) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.entity || '-'}</TableCell>
                  <TableCell>
                    {log.entityId ? (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {log.entityId.slice(0, 8)}...
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {log.payload ? (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={JSON.stringify(log.payload)}
                      >
                        {JSON.stringify(log.payload).slice(0, 50)}...
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {isLoading ? 'Loading...' : 'No activity logs found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
