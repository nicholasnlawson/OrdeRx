-- Add postcode and phone columns to the hospitals table
ALTER TABLE hospitals ADD COLUMN postcode TEXT;
ALTER TABLE hospitals ADD COLUMN phone TEXT;

-- Update the existing hospitals with default values if needed
UPDATE hospitals SET postcode = 'Unknown' WHERE postcode IS NULL;
UPDATE hospitals SET phone = 'Not provided' WHERE phone IS NULL;


