// Common types used across frontend and backend

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MIXED = 'MIXED',
}

export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

export enum SyncAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum ShiftStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  category?: string;
  barcode?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
  version?: number;
  lastModifiedBy?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  subtotal: number;
  notes?: string;
}

export interface Sale {
  id: string;
  receiptNumber?: string;
  tableId?: string;
  table?: TableSession;
  employeeId: string;
  employee?: User;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  synced?: boolean;
  clientId?: string;
}

export interface TableSession {
  id: string;
  tableNumber: number;
  status: TableStatus;
  startedAt?: Date;
  endedAt?: Date;
  ratePerHour: number;
  discount?: number;
  currentCharge: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  employeeId: string;
  employee?: User;
  startedAt: Date;
  endedAt?: Date;
  openingCash: number;
  closingCash?: number;
  status: ShiftStatus;
  salesTotal?: number;
  cashDiscrepancy?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  product?: Product;
  change: number; // positive for increase, negative for decrease
  reason: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export interface SyncLog {
  id?: number;
  entity: string; // 'product', 'sale', 'inventory_movement', etc.
  action: SyncAction;
  entityId: string;
  payload: Record<string, any>;
  clientId: string;
  clientUpdatedAt: Date;
  serverId?: string;
  serverUpdatedAt?: Date;
  status: SyncStatus;
  conflictData?: Record<string, any>;
  error?: string;
  createdAt: Date;
}

export interface Conflict {
  opId: string;
  entity: string;
  action: SyncAction;
  clientData: Record<string, any>;
  serverData: Record<string, any>;
  conflictType: string;
  createdAt: Date;
}

