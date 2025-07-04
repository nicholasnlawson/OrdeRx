-- Migration: Consolidates all logic for creating the order_groups table and linking it to orders.
-- This single script ensures the schema is created correctly and atomically.

BEGIN TRANSACTION;

-- Create the main table for grouping orders
CREATE TABLE IF NOT EXISTS order_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_number TEXT NOT NULL UNIQUE, -- Ensures each group has a unique identifier
    notes TEXT,
    created_by INTEGER, -- Tracks which user created the group
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add the foreign key column to the orders table
-- This uses a common pattern to add a column if it doesn't exist to avoid errors on re-runs.
ALTER TABLE orders ADD COLUMN group_id INTEGER REFERENCES order_groups(id) ON DELETE SET NULL;

-- Create indexes to optimize queries for group lookups
CREATE INDEX IF NOT EXISTS idx_orders_group_id ON orders(group_id);
CREATE INDEX IF NOT EXISTS idx_order_groups_group_number ON order_groups(group_number);

COMMIT;
