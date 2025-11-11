# Testing Offline Functionality on Localhost

## Quick Testing Methods

### Method 1: Chrome DevTools (Easiest)

1. **Open Chrome DevTools**:
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

2. **Go to Network Tab**:
   - Click on the "Network" tab
   - Find the throttling dropdown (usually shows "No throttling")
   - Select "Offline" from the dropdown

3. **Test Your App**:
   - Try creating a sale, table, or other operation
   - Data should be saved locally
   - Check browser console for sync queue messages

4. **Go Back Online**:
   - Change throttling back to "No throttling"
   - Watch the console - sync should happen automatically
   - Verify data appears on the server

### Method 2: Using the Test Utility Component

We've created a test utility component that you can add to your app. See `apps/frontend/src/components/offline-test-utility.tsx`

### Method 3: Disconnect Network Adapter

1. **Windows**:
   - Open Network Settings
   - Disable your network adapter temporarily
   - Re-enable when done testing

2. **Mac/Linux**:
   - Disconnect WiFi or unplug Ethernet
   - Reconnect when done

### Method 4: Block Localhost in Browser

1. **Chrome Extension**: Use "Requestly" or similar to block requests to `localhost:3001`
2. **Manual Block**: Use browser settings to block the API URL

## Step-by-Step Testing Guide

### Test 1: Basic Offline Read

1. **Start with Online Mode**:
   - Open your app at `http://localhost:3000`
   - Navigate to dashboard
   - Verify data loads from server

2. **Go Offline** (using DevTools):
   - Open DevTools → Network → Select "Offline"
   - Refresh the page
   - Data should still load from IndexedDB

3. **Verify**:
   - Check browser console for "Reading from local DB" messages
   - Data should appear normally

### Test 2: Offline Write Operations

1. **Go Offline**:
   - Set Network to "Offline" in DevTools

2. **Create a Sale**:
   - Start a table session
   - Add items to cart
   - Complete checkout
   - Sale should be created immediately (check console)

3. **Verify Local Storage**:
   - Open DevTools → Application → IndexedDB
   - Check `snooker_pos_db` → `sales` table
   - Your sale should be there with `synced: false`

4. **Check Sync Queue**:
   - Check `sync_log` table
   - Should have an entry with `status: 'pending'`

### Test 3: Automatic Sync

1. **Create Data While Offline**:
   - Create a sale, update a table, etc.
   - Verify data is in IndexedDB

2. **Go Back Online**:
   - Change Network throttling to "No throttling"
   - Watch browser console

3. **Verify Sync**:
   - Console should show "Sync push" messages
   - Check `sync_log` - entries should change to `status: 'synced'`
   - Check server database - data should appear

### Test 4: Sync on Connection Restore

1. **Go Offline and Create Data**:
   - Create multiple sales while offline
   - Create/update tables
   - Add expenses

2. **Simulate Connection Restore**:
   - The `online` event listener should trigger automatically
   - Or manually trigger: In console, run:
     ```javascript
     window.dispatchEvent(new Event('online'));
     ```

3. **Verify**:
   - All pending operations should sync
   - Check console for sync progress
   - Verify all data on server

### Test 5: Conflict Resolution

1. **Setup**:
   - Open app in two browser windows/tabs
   - Both should be online initially

2. **Create Conflict**:
   - In Tab 1: Go offline, update a product
   - In Tab 2: Update the same product (different value)
   - Tab 2 syncs immediately (online)
   - Tab 1 goes online - should detect conflict

3. **Verify**:
   - Check `sync_log` for conflicts
   - Server should use Last Writer Wins
   - Conflicts should be flagged

## Using the Test Utility Component

Add the test utility to your dashboard or any page:

```tsx
import { OfflineTestUtility } from '@/components/offline-test-utility';

// In your component:
<OfflineTestUtility />
```

This component provides:
- Manual offline/online toggle
- View sync queue status
- View local database contents
- Trigger manual sync
- Clear local data (for testing)

## Checking IndexedDB Manually

1. **Open DevTools** → **Application** tab
2. **Expand "IndexedDB"** in left sidebar
3. **Click on "snooker_pos_db"**
4. **Browse tables**:
   - `sales` - Check for unsynced sales
   - `sync_log` - Check pending operations
   - `products`, `tables`, etc. - Verify data

## Console Commands for Testing

Open browser console and use these commands:

```javascript
// Check if online
navigator.onLine

// Manually trigger online event
window.dispatchEvent(new Event('online'));

// Manually trigger offline event
window.dispatchEvent(new Event('offline'));

// Check sync queue
import { db } from '@/lib/db';
const pending = await db.sync_log.where('status').equals('pending').toArray();
console.log('Pending sync operations:', pending);

// Check unsynced sales
const unsynced = await db.sales.where('synced').equals(0).toArray();
console.log('Unsynced sales:', unsynced);

// Manually trigger sync
import { pushSyncQueue, pullSyncChanges } from '@/lib/sync';
await pushSyncQueue();
await pullSyncChanges();

// Clear all local data (for testing)
await db.delete();
location.reload();
```

## Expected Behavior

### When Offline:
- ✅ All read operations work from IndexedDB
- ✅ All write operations save to IndexedDB immediately
- ✅ Operations are queued in `sync_log`
- ✅ User sees immediate feedback
- ✅ Offline indicator shows at top of page

### When Online:
- ✅ Data is fetched from server
- ✅ Local DB is updated with server data
- ✅ Pending operations sync automatically
- ✅ Sync happens every 30 seconds
- ✅ Sync happens immediately when connection restored

### When Going Online:
- ✅ All pending operations sync automatically
- ✅ Server changes are pulled and merged
- ✅ Conflicts are detected and resolved
- ✅ Local entities get server IDs
- ✅ Sync status updates in `sync_log`

## Troubleshooting

### Data Not Syncing:
1. Check browser console for errors
2. Verify API URL is correct
3. Check authentication token
4. Verify sync service is running

### Data Not Persisting Offline:
1. Check IndexedDB in DevTools
2. Verify database schema version
3. Check for errors in console
4. Try clearing IndexedDB and reloading

### Sync Conflicts:
1. Check `sync_log` for conflict entries
2. Review conflict data
3. Manually resolve if needed
4. Check server logs for conflicts

## Testing Checklist

- [ ] App loads data from IndexedDB when offline
- [ ] Creating sale while offline saves locally
- [ ] Sync queue shows pending operations
- [ ] Going online triggers automatic sync
- [ ] Synced data appears on server
- [ ] Server changes are pulled to local DB
- [ ] Conflicts are detected and handled
- [ ] Multiple offline operations sync correctly
- [ ] App works normally after sync
- [ ] Offline indicator shows/hides correctly

