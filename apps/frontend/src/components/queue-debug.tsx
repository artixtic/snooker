/**
 * Queue Debug Component
 * 
 * Shows detailed information about queued requests for debugging.
 * Only visible in development mode.
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Collapse, Chip } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { requestQueueStorage } from '@/lib/db/request-queue-storage';
import { syncQueue } from '@/lib/db/sync-queue';

export function QueueDebug() {
  const [expanded, setExpanded] = useState(false);
  const [queuedRequests, setQueuedRequests] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const updateQueue = async () => {
      const requests = await requestQueueStorage.getAll();
      setQueuedRequests(requests);
    };

    updateQueue();
    const interval = setInterval(updateQueue, 1000);

    const unsubscribe = syncQueue.subscribe((processing) => {
      setIsProcessing(processing);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        p: 2,
        maxWidth: 500,
        maxHeight: 400,
        overflow: 'auto',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          Queue Debug ({queuedRequests.length})
        </Typography>
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ color: 'white', minWidth: 'auto' }}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </Button>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Chip
            label={isProcessing ? 'Processing...' : 'Idle'}
            color={isProcessing ? 'warning' : 'default'}
            size="small"
          />
          
          {queuedRequests.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No queued requests
            </Typography>
          ) : (
            queuedRequests.map((req, index) => (
              <Paper
                key={req.id}
                sx={{
                  p: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  fontSize: '0.75rem',
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                  #{index + 1}: {req.method} {req.url}
                </Typography>
                {req.data && (
                  <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Data: {JSON.stringify(req.data).substring(0, 100)}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Retries: {req.retryCount}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

