-- ============================================
-- PostgreSQL Script to Clear All Tables
-- Smart Cue Snooker POS Database
-- ============================================
-- WARNING: This will delete ALL data from all tables!
-- Make sure you have a backup before running this!
-- ============================================

-- Option 1: DELETE (Safer - respects foreign keys)
-- Delete in reverse dependency order (child tables first)

BEGIN;

-- Delete child records first (respects foreign key constraints)
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
DELETE FROM credit_transactions;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM inventory_movements;
DELETE FROM activity_logs;
DELETE FROM sync_log;
DELETE FROM shifts;
DELETE FROM tables; -- TableSession
DELETE FROM members;
DELETE FROM products;
DELETE FROM users;

COMMIT;

-- ============================================
-- Option 2: TRUNCATE CASCADE (Faster)
-- ============================================

-- Uncomment to use TRUNCATE instead (faster but requires CASCADE):

/*
BEGIN;

-- Truncate all tables with CASCADE to handle foreign keys
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
  credit_transactions,
  sale_items,
  sales,
  inventory_movements,
  activity_logs,
  sync_log,
  shifts,
  tables,
  members,
  products,
  users
CASCADE;

COMMIT;
*/

-- ============================================
-- Option 3: Reset Sequences
-- ============================================

-- Reset sync_log sequence (if using auto-increment)
-- ALTER SEQUENCE sync_log_id_seq RESTART WITH 1;

