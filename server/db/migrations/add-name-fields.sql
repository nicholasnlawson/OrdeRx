-- Add first_name and surname columns to the users table
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN surname TEXT;

-- Update existing users to have empty name fields
UPDATE users SET first_name = '' WHERE first_name IS NULL;
UPDATE users SET surname = '' WHERE surname IS NULL;


