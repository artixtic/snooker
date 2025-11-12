'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Typography,
  Box,
  Divider,
  Alert,
} from '@mui/material';
import { PaymentMethod } from '@prisma/client';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onComplete: (data: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
  }) => void;
}

export function PaymentModal({ open, onClose, total, onComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [error, setError] = useState('');

  const change = paymentMethod === PaymentMethod.CASH && cashReceived > total 
    ? cashReceived - total 
    : 0;

  const handleComplete = () => {
    if (paymentMethod === PaymentMethod.CASH && cashReceived < total) {
      setError('Cash received must be greater than or equal to total');
      return;
    }

    onComplete({
      paymentMethod,
      cashReceived: paymentMethod === PaymentMethod.CASH ? cashReceived : undefined,
      change,
    });
    
    // Reset
    setPaymentMethod(PaymentMethod.CASH);
    setCashReceived(0);
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" align="right" color="primary">
            Total: ${total.toFixed(2)}
          </Typography>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Payment Method</FormLabel>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <FormControlLabel
              value={PaymentMethod.CASH}
              control={<Radio />}
              label="Cash"
            />
            <FormControlLabel
              value={PaymentMethod.CARD}
              control={<Radio />}
              label="Card"
            />
            <FormControlLabel
              value={PaymentMethod.MIXED}
              control={<Radio />}
              label="Mixed (Cash + Card)"
            />
          </RadioGroup>
        </FormControl>

        {paymentMethod === PaymentMethod.CASH && (
          <TextField
            fullWidth
            label="Cash Received"
            type="number"
            value={cashReceived}
            onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
            margin="normal"
            autoFocus
            inputProps={{ step: 0.01, min: 0 }}
          />
        )}

        {paymentMethod === PaymentMethod.CASH && change > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Change: ${change.toFixed(2)}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleComplete}
          variant="contained"
          color="primary"
          disabled={paymentMethod === PaymentMethod.CASH && cashReceived < total}
        >
          Complete Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

