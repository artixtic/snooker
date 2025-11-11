# Fix: db.tables.put is not a function

## Problem
This error occurs when your browser has an old version of the IndexedDB database that doesn't match the new schema.

## Solution

### Option 1: Clear IndexedDB (Recommended)

1. **Open Chrome DevTools** (F12)
2. Go to **Application** tab
3. In the left sidebar, expand **IndexedDB**
4. Right-click on **snooker_pos_db**
5. Click **Delete database**
6. Refresh the page

The database will be recreated with the correct schema.

### Option 2: Clear All Site Data

1. **Open Chrome DevTools** (F12)
2. Go to **Application** tab
3. Click **Clear storage** in the left sidebar
4. Check **IndexedDB**
5. Click **Clear site data**
6. Refresh the page

### Option 3: Use Browser Settings

1. Open Chrome Settings
2. Go to **Privacy and security** → **Site settings**
3. Click **View permissions and data stored across sites**
4. Search for `localhost:3000`
5. Click on it and clear data

## Why This Happens

When we updated the database schema to version 2 (adding `games` and `expenses` tables), browsers that already had version 1 might not upgrade properly. Clearing the database forces a fresh start with the correct schema.

## After Clearing

Once you clear the database:
1. The app will recreate it with the correct schema
2. All offline functionality will work properly
3. Data will be pulled from the server on first load
4. Future schema changes will upgrade automatically

## Prevention

The code now includes:
- Proper version migration handling
- Error handling for missing tables
- Fallback methods for database operations

This should prevent similar issues in the future.

