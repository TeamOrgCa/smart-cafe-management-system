-- Migration: Add processed_by_id column to orders table
-- Run this in Supabase SQL Editor if you already have an existing database

-- Add processed_by_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processed_by_id UUID;

-- Optional: Add comment to explain the column
COMMENT ON COLUMN orders.processed_by_id IS 'Staff member who completed/processed the order';
