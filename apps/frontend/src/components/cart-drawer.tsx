'use client';

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  TextField,
  Paper,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCartStore } from '@/store/cart-store';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  tableCharge?: number;
}

export function CartDrawer({ open, onClose, onCheckout, tableCharge = 0 }: CartDrawerProps) {
  const { items, subtotal, discount, tax, total, updateQuantity, removeItem } = useCartStore();
  const tableChargeTax = tableCharge * 0.15; // 15% tax on table charge
  const finalTotal = total + tableCharge + tableChargeTax;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400 } }}>
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Cart ({items.length})
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
              Cart is empty
            </Typography>
          ) : (
            items.map((item) => (
              <Paper key={item.productId} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.product.name}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeItem(item.productId)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.productId, parseInt(e.target.value) || 1)
                    }
                    inputProps={{ min: 1, style: { textAlign: 'center', width: 60 } }}
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    <AddIcon />
                  </IconButton>
                  <Typography sx={{ ml: 'auto' }}>
                    ${item.subtotal.toFixed(2)}
                  </Typography>
                </Box>

                {item.discount > 0 && (
                  <Chip
                    label={`Discount: $${item.discount.toFixed(2)}`}
                    size="small"
                    color="secondary"
                    sx={{ mt: 1 }}
                  />
                )}
              </Paper>
            ))
          )}
        </Box>

        {items.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>${subtotal.toFixed(2)}</Typography>
              </Box>
              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="secondary">Discount:</Typography>
                  <Typography color="secondary">-${discount.toFixed(2)}</Typography>
                </Box>
              )}
              {tableCharge > 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Table Charge:</Typography>
                    <Typography>${tableCharge.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Table Tax:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${tableChargeTax.toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax:</Typography>
                <Typography>${(tax + tableChargeTax).toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  ${finalTotal.toFixed(2)}
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={onCheckout}
            >
              Checkout
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
}

