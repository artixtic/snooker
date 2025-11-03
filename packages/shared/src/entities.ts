// Entity type definitions for type-safe API communication

export type EntityType = 
  | 'product'
  | 'sale'
  | 'sale_item'
  | 'inventory_movement'
  | 'table'
  | 'shift'
  | 'user';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deleted?: boolean;
}

