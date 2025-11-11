# Clear All Database Tables

This document provides SQL queries to clear all data from the Smart Cue Snooker POS database.

## ⚠️ WARNING
**This will delete ALL data from all tables!** Make sure you have a backup before running these queries.

## Quick Commands

### Using Prisma Studio
```bash
cd apps/backend
npx prisma studio
```
Then manually delete records from each table.

### Using psql (PostgreSQL CLI)

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Then run the SQL file
\i apps/backend/prisma/clear_all_tables_psql.sql
```

### Using Prisma Migrate Reset (Recommended)

This will drop the database, recreate it, and run all migrations:

```bash
cd apps/backend
npx prisma migrate reset
```

**Note:** This will also reset the database schema. Use this if you want a completely fresh start.

### Using TypeScript Script (Recommended for Clearing Data Only)

A TypeScript script is available that clears all data while preserving the schema:

```bash
cd apps/backend
npx ts-node prisma/clear-database.ts
```

**Note:** This script clears all data including games and tables, but preserves users by default. It respects foreign key constraints and deletes in the correct order.

## SQL Queries

### Option 1: DELETE (Safer)

This approach respects foreign key constraints and deletes in the correct order:

```sql
BEGIN;

DELETE FROM tournament_matches;
DELETE FROM tournament_players;
DELETE FROM tournaments;
DELETE FROM match_players;
DELETE FROM matches;
DELETE FROM kitchen_orders;
DELETE FROM table_rate_rules;
DELETE FROM table_maintenance;
DELETE FROM bookings;
DELETE FROM expenses;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM inventory_movements;
DELETE FROM activity_logs;
DELETE FROM sync_log;
DELETE FROM shifts;
DELETE FROM tables;
DELETE FROM games;
DELETE FROM products;
DELETE FROM users;

COMMIT;
```

### Option 2: TRUNCATE CASCADE (Faster)

This is faster but requires CASCADE to handle foreign keys:

```sql
BEGIN;

TRUNCATE TABLE 
  tournament_matches,
  tournament_players,
  tournaments,
  match_players,
  matches,
  kitchen_orders,
  table_rate_rules,
  table_maintenance,
  bookings,
  expenses,
  sale_items,
  sales,
  inventory_movements,
  activity_logs,
  sync_log,
  shifts,
  tables,
  games,
  products,
  users
CASCADE;

COMMIT;
```

### Option 3: Drop and Recreate Database

**⚠️ This will delete the entire database and recreate it:**

```bash
cd apps/backend

# Drop and recreate database
npx prisma migrate reset

# Or manually:
# Drop database
psql -U postgres -c "DROP DATABASE IF EXISTS your_database_name;"

# Create database
psql -U postgres -c "CREATE DATABASE your_database_name;"

# Run migrations
npx prisma migrate deploy
```

## Tables Cleared (in order)

1. `tournament_matches` - Tournament match links
2. `tournament_players` - Tournament participants
3. `tournaments` - Tournament records
4. `match_players` - Match player records
5. `matches` - Match records
6. `kitchen_orders` - Kitchen order records
7. `table_rate_rules` - Table rate rules
8. `table_maintenance` - Table maintenance records
9. `bookings` - Booking records
10. `expenses` - Expense records
11. `sale_items` - Sale item records
12. `sales` - Sale records
13. `inventory_movements` - Inventory movement records
14. `activity_logs` - Activity log records
15. `sync_log` - Sync log records
16. `shifts` - Shift records
17. `tables` - Table session records (must be deleted before games)
18. `games` - Game records
19. `products` - Product records
20. `users` - User records

## After Clearing

After clearing the database, you may want to:

1. **Reseed the database:**
   ```bash
   cd apps/backend
   npm run prisma:seed
   ```

2. **Verify tables are empty:**
   ```sql
   SELECT 
     schemaname,
     tablename,
     n_tup_ins - n_tup_del AS row_count
   FROM pg_stat_user_tables
   ORDER BY tablename;
   ```

## Backup Before Clearing

Always create a backup before clearing:

```bash
# Using pg_dump
pg_dump -U your_username -d your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U your_username -d your_database_name < backup_file.sql
```

