-- This migration adds first_name and surname columns to the users table.
-- The init.js script is configured to ignore 'duplicate column' errors,
-- making this script idempotent.

ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN surname TEXT;

-- Update existing rows with default values.
-- This runs every time but is safe.
UPDATE users SET first_name = '' WHERE first_name IS NULL;
UPDATE users SET surname = '' WHERE surname IS NULL;
