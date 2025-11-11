# Offline-First Implementation Guide

## Overview

The Snooker POS system now fully supports offline operation with automatic synchronization when internet connectivity is restored. All data operations work seamlessly whether online or offline.

## Architecture

### 1. Local Storage (IndexedDB via Dexie)

All entities are stored locally in IndexedDB:
- **Products**: Product catalog
- **Sales**: All sales transactions
- **Tables**: Table sessions and status
- **Shifts**: Shift management
- **Games**: Game configurations
- **Expenses**: Expense records
- **Inventory Movements**: Stock adjustments
- **Sync Log**: Queue of pending operations

### 2. Sync Queue

When offline, all mutations (create, update, delete) are:
1. Saved to local IndexedDB immediately
2. Added to the sync queue
3. Automatically synced when internet is restored

### 3. Automatic Sync

The sync service:
- Runs every 30 seconds when online
- Automatically triggers when internet connection is restored
- Pushes local changes to server
- Pulls server changes to local database
- Handles conflicts with Last Writer Wins strategy

## How It Works

### Initialization

On app startup:
1. Pulls initial data from server (products, games, tables, shifts)
2. Saves to local IndexedDB
3. Starts automatic sync service
4. Listens for online/offline events

### Offline Operations

When offline:
1. **Read Operations**: Data is read from local IndexedDB
2. **Write Operations**: 
   - Saved to local IndexedDB immediately
   - Added to sync queue
   - User sees immediate feedback
   - Synced automatically when online

### Online Operations

When online:
1. **Read Operations**: 
   - Fetched from server
   - Cached in IndexedDB for offline access
2. **Write Operations**:
   - Sent to server immediately
   - Saved to local IndexedDB
   - If server call fails, falls back to offline mode

### Sync Process

1. **Push**: Local changes are sent to server
   - Server processes each operation
   - Returns server IDs for created entities
   - Updates local entities with server IDs
   - Marks operations as synced

2. **Pull**: Server changes are fetched
   - Gets all changes since last sync
   - Updates local IndexedDB
   - Merges with local data

3. **Conflict Resolution**:
   - **Last Writer Wins**: Server timestamp wins
   - **State Conflicts**: Detected and flagged for review
   - **Sales**: Append-only, no conflicts

## Supported Entities

All entities support offline operation:

- ✅ **Products**: Create, update, delete
- ✅ **Sales**: Create (append-only)
- ✅ **Tables**: Create, update, delete
- ✅ **Shifts**: Create, update
- ✅ **Games**: Create, update, delete
- ✅ **Expenses**: Create, update, delete
- ✅ **Inventory Movements**: Create

## Usage Examples

### Creating a Sale Offline

```typescript
// This works the same whether online or offline
const createSale = async (saleData) => {
  try {
    // Try online first
    const response = await api.post('/sales', saleData);
    return response.data;
  } catch (error) {
    // If offline, save locally and queue for sync
    if (!navigator.onLine) {
      const localSale = {
        ...saleData,
        id: `local_${Date.now()}`,
        synced: false,
        createdAt: new Date(),
      };
      await db.sales.add(localSale);
      await addToSyncQueue('sale', 'create', localSale.id, saleData);
      return localSale;
    }
    throw error;
  }
};
```

### Reading Data Offline

```typescript
// Data is always available from local DB
const getProducts = async () => {
  if (navigator.onLine) {
    // Fetch from server and cache
    const response = await api.get('/products');
    // Save to local DB
    for (const product of response.data) {
      await db.products.put(product);
    }
    return response.data;
  } else {
    // Read from local DB
    return await db.products.where('deleted').equals(0).toArray();
  }
};
```

## Sync Status

The system provides visual feedback:
- **Offline Indicator**: Shows when offline
- **Sync Status**: Operations are queued and synced automatically
- **Conflict Alerts**: Conflicts are flagged for review

## Testing Offline Mode

1. **Chrome DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Select "Offline" from throttling dropdown

2. **Test Scenarios**:
   - Create a sale while offline
   - Check that it appears in local storage
   - Go back online
   - Verify it syncs to server

## Database Schema

The IndexedDB schema includes:
- All entity tables
- Sync log for pending operations
- Indexes for efficient queries
- Version management for schema updates

## Benefits

1. **Uninterrupted Operations**: Business continues even without internet
2. **Fast Response**: Local operations are instant
3. **Automatic Sync**: No manual intervention needed
4. **Data Integrity**: Conflicts are detected and resolved
5. **Multi-terminal Support**: Multiple devices can sync independently

## Future Enhancements

- Conflict resolution UI for manual review
- Sync status dashboard
- Offline data size management
- Selective sync (sync only recent data)
- Background sync with Service Workers

