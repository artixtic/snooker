# Quick Guide: Testing Offline Mode on Localhost

## 🚀 Fastest Method (Chrome DevTools)

### Step 1: Open Your App
1. Start your backend: `cd apps/backend && npm run dev`
2. Start your frontend: `cd apps/frontend && npm run dev`
3. Open `http://localhost:3000` in Chrome

### Step 2: Open DevTools
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)

### Step 3: Go Offline
1. Click the **Network** tab
2. Find the dropdown that says "No throttling" (top toolbar)
3. Click it and select **"Offline"**

### Step 4: Test Offline Operations
1. **Create a Sale**:
   - Start a table session
   - Add items to cart
   - Complete checkout
   - ✅ Should work immediately (saved locally)

2. **Check Local Storage**:
   - In DevTools, go to **Application** tab
   - Expand **IndexedDB** → **snooker_pos_db**
   - Check `sales` table - your sale should be there with `synced: false`
   - Check `sync_log` table - should have pending operations

### Step 5: Go Back Online
1. In Network tab, change back to **"No throttling"**
2. Watch the browser console - you should see sync messages
3. Check `sync_log` - entries should change to `status: 'synced'`
4. Check your backend database - data should appear!

## 🛠️ Using the Test Utility Component

The dashboard now includes a test utility (only in development mode):

1. **View the Utility**:
   - It appears at the top of the dashboard
   - Shows online/offline status
   - Shows sync queue statistics
   - Shows local database stats

2. **Toggle Offline/Online**:
   - Click "Go Offline" button
   - App will simulate offline mode
   - Click "Go Online" to restore

3. **Manual Sync**:
   - Click "Manual Sync" button
   - Forces immediate sync (when online)

4. **View Stats**:
   - See pending operations count
   - See unsynced sales count
   - See total records in local DB

## 📊 What to Check

### When Offline:
- ✅ App still loads and works
- ✅ Data is read from IndexedDB
- ✅ Operations save immediately
- ✅ Offline indicator shows at top
- ✅ Operations appear in sync queue

### When Going Online:
- ✅ Sync happens automatically
- ✅ Console shows sync progress
- ✅ `sync_log` entries become "synced"
- ✅ Data appears on server
- ✅ Local entities get server IDs

## 🔍 Inspecting IndexedDB

1. **Open DevTools** → **Application** tab
2. **Expand "IndexedDB"** in left sidebar
3. **Click "snooker_pos_db"**
4. **Browse tables**:
   - `sales` - Check for unsynced sales (`synced: false`)
   - `sync_log` - Check pending operations (`status: 'pending'`)
   - `products`, `tables`, `games` - Verify data exists

## 🧪 Test Scenarios

### Scenario 1: Basic Offline Sale
1. Go offline
2. Create a sale
3. Verify it's in IndexedDB
4. Go online
5. Verify it syncs to server

### Scenario 2: Multiple Offline Operations
1. Go offline
2. Create 3 sales
3. Update a table
4. Create an expense
5. Go online
6. All should sync automatically

### Scenario 3: Offline Read
1. Load app while online (data cached)
2. Go offline
3. Refresh page
4. Data should still load from IndexedDB

### Scenario 4: Connection Restore
1. Go offline
2. Create data
3. Simulate connection restore (go online)
4. Watch automatic sync happen

## 🐛 Troubleshooting

### Data Not Syncing?
- Check browser console for errors
- Verify backend is running on `localhost:3001`
- Check authentication token is valid
- Verify API URL in `.env.local`

### Can't See Test Utility?
- Make sure you're in development mode
- Check browser console for errors
- Try refreshing the page

### IndexedDB Not Working?
- Check browser supports IndexedDB
- Clear browser cache and reload
- Check console for errors
- Try in incognito mode

## 💡 Pro Tips

1. **Keep DevTools Open**: Easier to monitor sync activity
2. **Watch Console**: Sync messages appear there
3. **Check Network Tab**: See actual API calls when online
4. **Use Test Utility**: Quick way to toggle offline mode
5. **Inspect IndexedDB**: Verify data is stored correctly

## ✅ Success Checklist

After testing, you should verify:
- [ ] App works completely offline
- [ ] Data is saved to IndexedDB
- [ ] Sync queue tracks pending operations
- [ ] Going online triggers automatic sync
- [ ] Data appears on server after sync
- [ ] Local entities get server IDs
- [ ] Multiple operations sync correctly
- [ ] Offline indicator shows/hides correctly

---

**Need Help?** Check `TESTING_OFFLINE_MODE.md` for detailed testing guide.

