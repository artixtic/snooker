// Offline sync service for pushing/pulling changes
import { db, DBSyncLog } from './db';
import axios from 'axios';
// Sync types (inline to avoid import issues until shared package is built)
interface SyncOperation {
  opId: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  clientUpdatedAt: string;
  clientId: string;
}

interface SyncPushResponse {
  processed: number;
  createdServerIds: Record<string, string>;
  conflicts: Array<{ opId: string; [key: string]: any }>;
  errors: Array<{ opId: string; error: string }>;
}

interface SyncPullResponse {
  changes: Array<{
    entity: string;
    id: string;
    action: string;
    data: any;
    updatedAt: string;
    deleted?: boolean;
  }>;
  lastSyncTime: string;
  hasMore: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

// Get unique client ID (stored in localStorage)
function getClientId(): string {
  let clientId = localStorage.getItem('client_id');
  if (!clientId) {
    clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('client_id', clientId);
  }
  return clientId;
}

// Add operation to sync queue
export async function addToSyncQueue(
  entity: string,
  action: 'create' | 'update' | 'delete',
  entityId: string,
  payload: any,
): Promise<void> {
  const clientId = getClientId();
  
  await db.sync_log.add({
    entity,
    action,
    entityId,
    payload,
    clientId,
    clientUpdatedAt: new Date(),
    status: 'pending',
    createdAt: new Date(),
  });
}

// Push pending operations to server
export async function pushSyncQueue(): Promise<any> {
  if (isSyncing) return null;
  if (!navigator.onLine) return null;

  isSyncing = true;
  
  try {
    const pendingOps = await db.sync_log
      .where('status')
      .equals('pending')
      .toArray();

    if (pendingOps.length === 0) {
      return null;
    }

    const operations: SyncOperation[] = pendingOps.map((op) => ({
      opId: op.id!.toString(),
      entity: op.entity,
      action: op.action as any,
      payload: op.payload,
      clientUpdatedAt: op.clientUpdatedAt.toISOString(),
      clientId: op.clientId,
    }));

    const response = await axios.post<SyncPushResponse>(
      `${API_URL}/sync/push`,
      {
        clientId: getClientId(),
        operations,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      },
    );

    // Update sync log entries
    for (const op of pendingOps) {
      const result = response.data;
      
      if (result.createdServerIds[op.id!.toString()]) {
        // Update local entity with server ID if needed
        // This depends on entity type - implement per entity
      }

      // Mark as synced or conflict
      const conflict = result.conflicts.find((c) => c.opId === op.id!.toString());
      if (conflict) {
        await db.sync_log.update(op.id!, {
          status: 'conflict',
          conflictData: conflict,
        });
      } else {
        await db.sync_log.update(op.id!, {
          status: 'synced',
          serverId: result.createdServerIds[op.id!.toString()],
          serverUpdatedAt: new Date(),
        });
      }
    }

    return response.data;
  } catch (error: any) {
    console.error('Sync push error:', error);
    // Mark failed entries
    // You might want to retry logic here
    return null;
  } finally {
    isSyncing = false;
  }
}

// Pull changes from server
export async function pullSyncChanges(since?: Date): Promise<any> {
  if (!navigator.onLine) return;

  try {
    const sinceParam = since ? since.toISOString() : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const response = await axios.get<SyncPullResponse>(
      `${API_URL}/sync/pull?since=${sinceParam}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      },
    );

    // Apply changes to local DB
    for (const change of response.data.changes) {
      switch (change.entity) {
        case 'product':
          if (change.action === 'delete') {
            await db.products.update(change.id, { deleted: true });
          } else {
            await db.products.put({ ...change.data, id: change.id });
          }
          break;
        case 'sale':
          if (change.action !== 'delete') {
            await db.sales.put({ ...change.data, id: change.id, synced: true });
          }
          break;
        // Add other entity types as needed
      }
    }
  } catch (error) {
    console.error('Sync pull error:', error);
  }
}

// Start automatic sync
export function startSync(intervalMs: number = 30000) {
  if (syncInterval) return;

  // Initial sync
  pushSyncQueue();
  pullSyncChanges();

  // Periodic sync
  syncInterval = setInterval(() => {
    pushSyncQueue();
    pullSyncChanges();
  }, intervalMs);

  // Sync on online
  window.addEventListener('online', () => {
    pushSyncQueue();
    pullSyncChanges();
  });
}

// Stop automatic sync
export function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

