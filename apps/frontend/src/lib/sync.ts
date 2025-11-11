// Offline sync service for pushing/pulling changes
import { db, DBSyncLog } from './db';
import api from './api';
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

// Check if user is authenticated
function isAuthenticated(): boolean {
  const token = localStorage.getItem('accessToken');
  return !!token;
}

// Push pending operations to server
export async function pushSyncQueue(): Promise<any> {
  if (isSyncing) return null;
  if (!navigator.onLine) return null;
  if (!isAuthenticated()) {
    console.warn('Cannot sync: User not authenticated');
    return null;
  }

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

    const response = await api.post<SyncPushResponse>(
      '/sync/push',
      {
        clientId: getClientId(),
        operations,
      },
    );

    // Update sync log entries and local entities with server IDs
    for (const op of pendingOps) {
      const result = response.data;
      const serverId = result.createdServerIds[op.id!.toString()];
      
      // Update local entity with server ID if needed
      if (serverId && op.entityId !== serverId) {
        switch (op.entity) {
          case 'sale':
            // Update sale with server ID
            const sale = await db.sales.get(op.entityId);
            if (sale) {
              await db.sales.delete(op.entityId);
              await db.sales.add({ ...sale, id: serverId, synced: true });
            }
            break;
          case 'table':
            const table = await db.tables.get(op.entityId);
            if (table) {
              await db.tables.delete(op.entityId);
              await db.tables.add({ ...table, id: serverId });
            }
            break;
          case 'shift':
            const shift = await db.shifts.get(op.entityId);
            if (shift) {
              await db.shifts.delete(op.entityId);
              await db.shifts.add({ ...shift, id: serverId });
            }
            break;
          case 'game':
            const game = await db.games.get(op.entityId);
            if (game) {
              await db.games.delete(op.entityId);
              await db.games.add({ ...game, id: serverId });
            }
            break;
          case 'expense':
            const expense = await db.expenses.get(op.entityId);
            if (expense) {
              await db.expenses.delete(op.entityId);
              await db.expenses.add({ ...expense, id: serverId });
            }
            break;
        }
      } else if (serverId) {
        // Just mark as synced if IDs match
        switch (op.entity) {
          case 'sale':
            await db.sales.update(op.entityId, { synced: true });
            break;
        }
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
          serverId: serverId || op.entityId,
          serverUpdatedAt: new Date(),
        });
      }
    }

    return response.data;
  } catch (error: any) {
    console.error('Sync push error:', error);
    
    // Handle authentication errors gracefully
    if (error.response?.status === 401) {
      console.warn('Sync failed: Authentication required. Please login.');
      // Don't mark as failed - will retry when user logs in
      return null;
    }
    
    // For other errors, mark as failed but don't throw
    // Operations will remain in pending state for retry
    return null;
  } finally {
    isSyncing = false;
  }
}

// Pull changes from server
export async function pullSyncChanges(since?: Date): Promise<any> {
  if (!navigator.onLine) return;
  if (!isAuthenticated()) {
    console.warn('Cannot pull sync: User not authenticated');
    return;
  }

  try {
    // Get last sync time from localStorage
    const lastSyncTime = since || new Date(localStorage.getItem('lastSyncTime') || Date.now() - 24 * 60 * 60 * 1000);
    const sinceParam = lastSyncTime.toISOString();
    
    const response = await api.get<SyncPullResponse>(
      `/sync/pull?since=${sinceParam}`,
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
        case 'table':
          if (change.action === 'delete') {
            try {
              if (db.tables && typeof db.tables.delete === 'function') {
                await db.tables.delete(change.id);
              }
            } catch (error) {
              console.warn('Failed to delete table from local DB:', error);
            }
          } else {
            try {
              const tableData = { ...change.data, id: change.id };
              // Ensure required fields exist
              if (tableData.id && tableData.tableNumber !== undefined && db.tables && typeof db.tables.put === 'function') {
                await db.tables.put(tableData);
              } else if (tableData.id && tableData.tableNumber !== undefined && db.tables && typeof db.tables.add === 'function') {
                // Fallback to add if put doesn't exist
                await db.tables.add(tableData);
              }
            } catch (error) {
              console.warn('Failed to save table to local DB:', error);
            }
          }
          break;
        case 'shift':
          if (change.action === 'delete') {
            try {
              if (db.shifts && typeof db.shifts.delete === 'function') {
                await db.shifts.delete(change.id);
              }
            } catch (error) {
              console.warn('Failed to delete shift from local DB:', error);
            }
          } else {
            try {
              const shiftData = { ...change.data, id: change.id };
              // Ensure required fields exist
              if (shiftData.id && shiftData.employeeId && db.shifts) {
                if (typeof db.shifts.put === 'function') {
                  await db.shifts.put(shiftData);
                } else if (typeof db.shifts.add === 'function') {
                  await db.shifts.add(shiftData);
                }
              }
            } catch (error) {
              console.warn('Failed to save shift to local DB:', error);
            }
          }
          break;
        case 'game':
          if (change.action === 'delete') {
            try {
              if (db.games && typeof db.games.delete === 'function') {
                await db.games.delete(change.id);
              }
            } catch (error) {
              console.warn('Failed to delete game from local DB:', error);
            }
          } else {
            try {
              const gameData = { ...change.data, id: change.id };
              // Ensure required fields exist
              if (gameData.id && gameData.name && db.games) {
                if (typeof db.games.put === 'function') {
                  await db.games.put(gameData);
                } else if (typeof db.games.add === 'function') {
                  await db.games.add(gameData);
                }
              }
            } catch (error) {
              console.warn('Failed to save game to local DB:', error);
            }
          }
          break;
        case 'expense':
          if (change.action === 'delete') {
            try {
              if (db.expenses && typeof db.expenses.delete === 'function') {
                await db.expenses.delete(change.id);
              }
            } catch (error) {
              console.warn('Failed to delete expense from local DB:', error);
            }
          } else {
            try {
              const expenseData = { ...change.data, id: change.id };
              // Ensure required fields exist
              if (expenseData.id && expenseData.amount !== undefined && db.expenses) {
                if (typeof db.expenses.put === 'function') {
                  await db.expenses.put(expenseData);
                } else if (typeof db.expenses.add === 'function') {
                  await db.expenses.add(expenseData);
                }
              }
            } catch (error) {
              console.warn('Failed to save expense to local DB:', error);
            }
          }
          break;
        case 'inventory_movement':
          if (change.action !== 'delete') {
            await db.inventory_movements.put({ ...change.data, id: change.id });
          }
          break;
      }
    }

    // Update last sync time
    localStorage.setItem('lastSyncTime', new Date().toISOString());
    
    return response.data;
  } catch (error: any) {
    console.error('Sync pull error:', error);
    
    // Handle authentication errors gracefully
    if (error.response?.status === 401) {
      console.warn('Sync pull failed: Authentication required. Please login.');
      // Don't throw - just return silently
      return;
    }
    
    // For other errors, log but don't throw
    // Will retry on next sync cycle
    return;
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

