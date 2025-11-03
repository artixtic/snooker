// Zustand store for cart state
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    sku?: string;
    barcode?: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  tableId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  addItem: (product: any, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  setTable: (tableId: string | null) => void;
  applyGlobalDiscount: (discount: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

const TAX_RATE = 0.15; // 15% tax - adjust as needed

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,

      addItem: (product: any, quantity: number = 1) => {
        const state = get();
        const existingItem = state.items.find((item) => item.productId === product.id);

        if (existingItem) {
          // Update quantity
          get().updateQuantity(product.id, existingItem.quantity + quantity);
        } else {
          // Add new item
          const unitPrice = product.price;
          const itemDiscount = 0;
          const itemSubtotal = unitPrice * quantity;
          const itemTax = itemSubtotal * TAX_RATE;

          set((state) => ({
            items: [
              ...state.items,
              {
                productId: product.id,
                product: {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  sku: product.sku,
                  barcode: product.barcode,
                },
                quantity,
                unitPrice,
                discount: itemDiscount,
                tax: itemTax,
                subtotal: itemSubtotal,
              },
            ],
          }));
        }
        get().calculateTotals();
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
        get().calculateTotals();
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId === productId) {
              const itemSubtotal = item.unitPrice * quantity - item.discount;
              const itemTax = itemSubtotal * TAX_RATE;
              return {
                ...item,
                quantity,
                subtotal: itemSubtotal,
                tax: itemTax,
              };
            }
            return item;
          }),
        }));
        get().calculateTotals();
      },

      updateDiscount: (productId: string, discount: number) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId === productId) {
              const itemSubtotal = item.unitPrice * item.quantity - discount;
              const itemTax = itemSubtotal * TAX_RATE;
              return {
                ...item,
                discount,
                subtotal: itemSubtotal,
                tax: itemTax,
              };
            }
            return item;
          }),
        }));
        get().calculateTotals();
      },

      setTable: (tableId: string | null) => {
        set({ tableId });
      },

      applyGlobalDiscount: (discount: number) => {
        set({ discount });
        get().calculateTotals();
      },

      clearCart: () => {
        set({
          items: [],
          tableId: null,
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
        });
      },

      calculateTotals: () => {
        const state = get();
        const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);
        const discount = state.discount;
        const taxableAmount = subtotal - discount;
        const tax = taxableAmount * TAX_RATE;
        const total = taxableAmount + tax;

        set({ subtotal, tax, total });
      },
    }),
    {
      name: 'snooker-pos-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

