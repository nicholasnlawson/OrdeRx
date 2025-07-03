-- This migration adds a dose column to the order_medications table.
-- It has been simplified to a single ALTER TABLE statement.
-- The init.js script is configured to ignore 'duplicate column' errors,
-- making this script idempotent.

-- The original version of this file used a complex temporary table and
-- transaction, which caused errors when run by the main init script.

ALTER TABLE order_medications ADD COLUMN dose TEXT;
