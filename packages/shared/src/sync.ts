// Sync-related types and interfaces

import { SyncAction, SyncStatus } from './types';

export interface SyncOperation {
  opId: string; // Unique operation ID from client
  entity: string; // Entity type: 'product', 'sale', etc.
  action: SyncAction;
  payload: Record<string, any>;
  clientUpdatedAt: string; // ISO 8601 timestamp
  clientId: string; // Unique client/device identifier
}

export interface SyncPushRequest {
  clientId: string;
  operations: SyncOperation[];
}

export interface SyncPushResponse {
  processed: number;
  createdServerIds: Record<string, string>; // opId -> serverId mapping
  conflicts: ConflictResponse[];
  errors: ErrorResponse[];
}

export interface ConflictResponse {
  opId: string;
  entity: string;
  action: SyncAction;
  conflictType: 'timestamp' | 'version' | 'state';
  clientData: Record<string, any>;
  serverData: Record<string, any>;
  message: string;
}

export interface ErrorResponse {
  opId: string;
  error: string;
  code?: string;
}

export interface SyncPullResponse {
  changes: EntityChange[];
  lastSyncTime: string; // ISO 8601 timestamp
  hasMore: boolean;
}

export interface EntityChange {
  entity: string;
  id: string;
  action: SyncAction;
  data: Record<string, any>;
  updatedAt: string;
  deleted?: boolean;
}

