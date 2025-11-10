'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
} from '@mui/material';
import api from '@/lib/api';
import { TableTimer } from '@/components/table-timer';

export default function AdminTablesPage() {
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await api.get('/tables');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading tables...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Table Management
      </Typography>

      <Grid container spacing={3}>
        {tables.map((table: any) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
            <TableTimer
              tableId={table.id}
              tableNumber={table.tableNumber}
              ratePerHour={Number(table.ratePerHour)}
              startedAt={table.startedAt}
              pausedAt={table.pausedAt}
              totalPausedMs={table.totalPausedMs || 0}
              lastResumedAt={table.lastResumedAt}
              status={table.status}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

