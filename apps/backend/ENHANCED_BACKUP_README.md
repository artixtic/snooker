# Enhanced Backup Service Documentation

## Overview

The enhanced backup service provides a comprehensive backup and synchronization solution with the following features:

1. **Full Database Backups** - Complete database backups every minute
2. **Two-Way Sync** - Constant synchronization between main and backup databases
3. **Incremental Backups** - Track and sync only changed records
4. **Backup History** - Track all backup operations with statistics
5. **Retention Management** - Automatic cleanup of old backups
6. **Conflict Resolution** - Handle sync conflicts between databases
7. **Export/Import** - Compressed backup files for external storage
8. **Restore Functionality** - Restore from backup files
9. **Monitoring & Alerting** - Track failures and system health

## Features

### 1. Full Database Backups
- Runs automatically every minute via cron job
- Backs up all tables in correct order (respecting foreign keys)
- Uses batch operations for better performance (1000 records per batch)
- Tracks backup history with statistics

### 2. Two-Way Sync
- Constant synchronization between main and backup databases
- Default sync interval: 30 seconds (configurable)
- Tracks changes in both databases
- Detects and handles conflicts
- Sync state tracking for each record

### 3. Backup History
- Tracks all backup operations
- Records: type, status, record count, duration, size
- Stores file paths for exported backups
- Automatic cleanup based on retention policy

### 4. Conflict Resolution
- Detects when same record is modified in both databases
- Stores conflict details for manual resolution
- API endpoints to view and resolve conflicts
- Resolution options: MAIN, BACKUP, or MERGE

### 5. Export/Import
- Export backups to compressed JSON files (gzip)
- Include/exclude backup history
- Restore from backup files to main or backup database
- Automatic file management

### 6. Monitoring & Alerting
- Tracks consecutive failures
- Stops sync after max failures (default: 5)
- Logs all operations with timestamps
- Status endpoint for health checks

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Enable Backup Service
ENABLE_BACKUP_SERVICE="true"

# Backup Database URL
BACKUP_DATABASE_URL="postgresql://user:password@localhost:5432/snooker_pos_backup?schema=public"

# Enable Two-Way Sync (default: true)
ENABLE_TWO_WAY_SYNC="true"

# Backup Retention Days (default: 30)
BACKUP_RETENTION_DAYS=30

# Two-Way Sync Interval in milliseconds (default: 30000 = 30 seconds)
SYNC_INTERVAL_MS=30000
```

## Database Schema

The enhanced backup service requires three new tables:

1. **backup_history** - Tracks all backup operations
2. **sync_state** - Tracks sync state for each record
3. **backup_config** - Stores backup configuration

Run migrations to create these tables:
```bash
cd apps/backend
npm run prisma:migrate:dev
```

## API Endpoints

All endpoints require admin authentication.

### Status
```
GET /backup/status
```
Returns current backup service status.

### Trigger Backup
```
POST /backup/trigger
```
Manually trigger a full backup.

### Backup History
```
GET /backup/history?limit=50
```
Get backup history (default limit: 50).

### Export Backup
```
POST /backup/export
Body: { "includeHistory": false }
```
Export backup to compressed file. Returns file path.

### Restore Backup
```
POST /backup/restore
Body: { 
  "filepath": "./backups/backup-2024-01-01.json.gz",
  "target": "MAIN" // or "BACKUP"
}
```
Restore from backup file.

### Get Conflicts
```
GET /backup/conflicts
```
Get all sync conflicts.

### Resolve Conflict
```
POST /backup/conflicts/:entity/:entityId/resolve
Body: { "resolution": "MAIN" } // or "BACKUP" or "MERGE"
```
Resolve a sync conflict.

### Get Stats
```
GET /backup/stats
```
Get comprehensive backup statistics.

## Usage Examples

### Check Backup Status
```bash
curl -X GET http://localhost:3001/backup/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Trigger Manual Backup
```bash
curl -X POST http://localhost:3001/backup/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Export Backup
```bash
curl -X POST http://localhost:3001/backup/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"includeHistory": true}'
```

### View Conflicts
```bash
curl -X GET http://localhost:3001/backup/conflicts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Resolve Conflict
```bash
curl -X POST http://localhost:3001/backup/conflicts/Product/clxxx123/resolve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resolution": "MAIN"}'
```

## How Two-Way Sync Works

1. **Change Detection**: Every 30 seconds, the service checks both databases for changes since last sync
2. **Change Application**: 
   - Changes from main → applied to backup
   - Changes from backup → applied to main
3. **Conflict Detection**: If same record modified in both, conflict is detected
4. **Conflict Storage**: Conflicts are stored in `sync_state` table for manual resolution
5. **State Tracking**: Each record's sync state is tracked with timestamps

## Conflict Resolution

When a conflict is detected:
- The conflict is logged in `sync_state` table
- Both versions are preserved
- Admin can resolve via API:
  - **MAIN**: Use main database version
  - **BACKUP**: Use backup database version
  - **MERGE**: Custom merge logic (requires implementation)

## Backup Files

Backup files are stored in `./backups/` directory:
- Format: `backup-YYYY-MM-DDTHH-MM-SS.json.gz`
- Compressed with gzip
- Contains all table data in JSON format
- Optionally includes backup history

## Performance Considerations

- **Batch Operations**: Processes 1000 records per batch
- **Async Operations**: All operations are asynchronous
- **Indexed Queries**: Uses indexed fields for change detection
- **Connection Pooling**: Reuses database connections

## Error Handling

- **Consecutive Failures**: Tracks failures and stops after threshold
- **Error Logging**: All errors are logged with details
- **Graceful Degradation**: Service continues even if some operations fail
- **Recovery**: Automatic retry on next sync cycle

## Monitoring

Monitor backup service health:
- Check `/backup/status` endpoint
- Review backup history for failures
- Monitor consecutive failures count
- Check sync conflicts regularly

## Next Steps

1. Run migrations to create new tables
2. Configure environment variables
3. Restart backend server
4. Monitor backup service logs
5. Test two-way sync by editing records in both databases

## Troubleshooting

### Backup Service Not Starting
- Check `ENABLE_BACKUP_SERVICE` is set to "true"
- Verify `BACKUP_DATABASE_URL` is correct
- Check database connection

### Two-Way Sync Not Working
- Check `ENABLE_TWO_WAY_SYNC` is set to "true"
- Verify both databases are accessible
- Check sync interval configuration

### Conflicts Not Resolving
- Verify conflict exists in `sync_state` table
- Check entity and entityId are correct
- Ensure resolution type is valid (MAIN/BACKUP/MERGE)

