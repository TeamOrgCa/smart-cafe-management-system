-- Migration: Add PIN column to users table
-- Run this in Supabase SQL Editor if you already have an existing database

-- Add PIN column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin TEXT;

-- Optional: Set default PIN for existing admin users
-- UPDATE users SET pin = '1234' WHERE role = 'admin' AND pin IS NULL;

-- Note: Uncomment the UPDATE statement above if you want to set a default PIN
-- for existing admin users. Make sure to change the PIN afterwards for security.
