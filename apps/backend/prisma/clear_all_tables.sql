-- ============================================
-- SQL Script to Clear All Tables
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
-- Option 2: TRUNCATE (Faster - requires disabling constraints)
-- ============================================

-- Uncomment the following if you want to use TRUNCATE instead:

/*
BEGIN;

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables
TRUNCATE TABLE tournament_matches CASCADE;
TRUNCATE TABLE tournament_players CASCADE;
TRUNCATE TABLE tournaments CASCADE;
TRUNCATE TABLE match_players CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE kitchen_orders CASCADE;
TRUNCATE TABLE table_rate_rules CASCADE;
TRUNCATE TABLE table_maintenance CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE credit_transactions CASCADE;
TRUNCATE TABLE sale_items CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE inventory_movements CASCADE;
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE sync_log CASCADE;
TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE tables CASCADE;
TRUNCATE TABLE members CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

COMMIT;
*/

-- ============================================
-- Option 3: Reset Auto-increment Sequences (if using)
-- ============================================

-- Reset sync_log sequence (if using auto-increment)
-- ALTER SEQUENCE sync_log_id_seq RESTART WITH 1;

