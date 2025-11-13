# Backup Service Configuration

The backup service automatically backs up all database data to a separate backup database every minute.

## Environment Variables

Add the following environment variable to your `.env` file in the `apps/backend` directory:

```env
# Backup Database Configuration (Optional)
# If not provided, backup service will be disabled
# This should be a separate PostgreSQL database for backup purposes
BACKUP_DATABASE_URL="postgresql://user:password@localhost:5432/snooker_pos_backup?schema=public"

# Enable Backup Service (Optional)
# Set to "true" to enable the backup service, "false" to disable
# Note: This is automatically set by npm scripts (dev=true)
# ENABLE_BACKUP_SERVICE="true"
```

## Running the Application

The backup service can be controlled via npm scripts:

### Development Mode (`npm run dev`) - Ports 3000/3001
```bash
npm run dev
```
- **Main Database**: Uses `DATABASE_URL` (main database)
- **Backup Database**: Used for backups (backup service **enabled**)
- **Backup Service**: Runs every minute, copying data from main DB to backup DB
- **Ports**: Backend on 3001, Frontend on 3000

**Note:** The `ENABLE_BACKUP_SERVICE` environment variable is automatically set by the dev script. You can also set it manually in your `.env` file if needed.

## Setup Instructions

1. **Create a backup database:**
   ```sql
   CREATE DATABASE snooker_pos_backup;
   ```

2. **Run migrations on the backup database:**
   ```bash
   cd apps/backend
   npm run prisma:migrate:backup
   ```
   
   This command will automatically:
   - Read `BACKUP_DATABASE_URL` from your `.env` file
   - Run all pending migrations on the backup database
   - Keep your main database configuration unchanged

3. **Add BACKUP_DATABASE_URL to your .env file:**
   ```env
   BACKUP_DATABASE_URL="postgresql://user:password@localhost:5432/snooker_pos_backup?schema=public"
   ```

4. **Restart the backend server:**
   The backup service will automatically start and begin backing up data every minute.

## How It Works

- The backup service runs automatically every minute using a cron job
- It copies all data from the main database to the backup database
- The backup is a full sync (truncates and re-inserts all data)
- All tables are backed up in the correct order to respect foreign key constraints
- If `BACKUP_DATABASE_URL` is not configured, the service will be disabled

## Database Management Commands

The following commands automatically work with both main and backup databases:

### Clear Databases
```bash
npm run prisma:clear
```
This will clear both the main and backup databases (if `BACKUP_DATABASE_URL` is configured).

### Seed Databases
```bash
npm run prisma:seed
```
This will seed both the main and backup databases with initial data (if `BACKUP_DATABASE_URL` is configured).

## Manual Backup

You can manually trigger a backup by calling the API endpoint:

```bash
POST /backup/trigger
Authorization: Bearer <your-jwt-token>
```

## Check Backup Status

Check if the backup service is enabled and connected:

```bash
GET /backup/status
Authorization: Bearer <your-jwt-token>
```

## Logs

The backup service logs its activity:
- `✅ Backup database connected successfully` - Service initialized
- `🔄 Starting database backup...` - Backup started
- `✅ Backup completed successfully in Xms` - Backup finished
- `❌ Backup failed:` - Backup error (check logs for details)

