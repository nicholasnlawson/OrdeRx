-- This migration adds postcode and phone columns to the hospitals table.
-- The init.js script is configured to ignore 'duplicate column' errors,
-- making this script idempotent.

ALTER TABLE hospitals ADD COLUMN postcode TEXT;
ALTER TABLE hospitals ADD COLUMN phone TEXT;

-- Update existing rows with default values.
-- This runs every time but is safe.
UPDATE hospitals SET postcode = 'Unknown' WHERE postcode IS NULL;
UPDATE hospitals SET phone = 'Not provided' WHERE phone IS NULL;
