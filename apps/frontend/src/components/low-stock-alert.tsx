'use client';

import { useEffect, useState } from 'react';
import { Snackbar, Alert, AlertTitle, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export function LowStockAlert() {
  const [open, setOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const router = useRouter();

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      try {
        const response = await api.get('/inventory/low-stock?threshold=10');
        return response.data;
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (lowStockProducts.length > 0) {
      setLowStockCount(lowStockProducts.length);
      setOpen(true);
    }
  }, [lowStockProducts.length]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleViewInventory = () => {
    router.push('/admin/inventory');
    setOpen(false);
  };

  if (lowStockCount === 0) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={10000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity="warning"
        variant="filled"
        action={
          <Button color="inherit" size="small" onClick={handleViewInventory}>
            View
          </Button>
        }
      >
        <AlertTitle>Low Stock Alert</AlertTitle>
        {lowStockCount} product{lowStockCount > 1 ? 's' : ''} running low (≤10 units)
      </Alert>
    </Snackbar>
  );
}

