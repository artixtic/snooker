'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ShiftModal } from '@/components/shift-modal';
import { format } from 'date-fns';

export default function AdminShiftsPage() {
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<'start' | 'close'>('start');
  const [selectedShiftId, setSelectedShiftId] = useState<string>();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await api.get('/shifts');
      return response.data;
    },
  });

  const activeShift = shifts.find((s: any) => s.status === 'ACTIVE');

  const handleStartShift = () => {
    setShiftModalMode('start');
    setSelectedShiftId(undefined);
    setShiftModalOpen(true);
  };

  const handleCloseShift = (shiftId: string) => {
    setShiftModalMode('close');
    setSelectedShiftId(shiftId);
    setShiftModalOpen(true);
  };

  const formatDuration = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diff = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Shift Management</Typography>
        {!activeShift && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleStartShift}
          >
            Start Shift
          </Button>
        )}
      </Box>

      {activeShift && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Active Shift
              </Typography>
              <Typography variant="body2">
                Started: {format(new Date(activeShift.startedAt), 'PPp')}
              </Typography>
              <Typography variant="body2">
                Opening Cash: ${Number(activeShift.openingCash).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                Duration: {formatDuration(activeShift.startedAt)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleCloseShift(activeShift.id)}
            >
              Close Shift
            </Button>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Opening Cash</TableCell>
              <TableCell>Closing Cash</TableCell>
              <TableCell>Sales Total</TableCell>
              <TableCell>Discrepancy</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map((shift: any) => (
              <TableRow key={shift.id}>
                <TableCell>{shift.employee?.name || 'N/A'}</TableCell>
                <TableCell>
                  {format(new Date(shift.startedAt), 'PPp')}
                </TableCell>
                <TableCell>
                  {shift.endedAt ? format(new Date(shift.endedAt), 'PPp') : '-'}
                </TableCell>
                <TableCell>
                  {shift.endedAt
                    ? formatDuration(shift.startedAt, shift.endedAt)
                    : formatDuration(shift.startedAt)}
                </TableCell>
                <TableCell>${Number(shift.openingCash).toFixed(2)}</TableCell>
                <TableCell>
                  {shift.closingCash
                    ? `$${Number(shift.closingCash).toFixed(2)}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {shift.salesTotal
                    ? `$${Number(shift.salesTotal).toFixed(2)}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {shift.cashDiscrepancy !== null && shift.cashDiscrepancy !== undefined ? (
                    <Chip
                      label={`$${Math.abs(Number(shift.cashDiscrepancy)).toFixed(2)}`}
                      color={Number(shift.cashDiscrepancy) >= 0 ? 'success' : 'error'}
                      size="small"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={shift.status}
                    color={shift.status === 'ACTIVE' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ShiftModal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        mode={shiftModalMode}
        shiftId={selectedShiftId}
      />
    </Container>
  );
}

