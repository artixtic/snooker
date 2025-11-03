'use client';

import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mr: 2 }}
            >
              Reload Page
            </Button>
            <Button variant="outlined" onClick={this.handleReset}>
              Try Again
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 4,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  textAlign: 'left',
                }}
              >
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.stack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

