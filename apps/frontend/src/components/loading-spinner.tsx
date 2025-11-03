'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullHeight?: boolean;
}

export function LoadingSpinner({ message, fullHeight = false }: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        ...(fullHeight && { minHeight: '100vh' }),
        py: fullHeight ? 0 : 4,
      }}
    >
      <CircularProgress />
      {message && <Typography color="text.secondary">{message}</Typography>}
    </Box>
  );
}

