-- ===============================================================
-- FIX AGENCIES TABLE STRUCTURE
-- Add missing columns that the frontend expects
-- ===============================================================

BEGIN;

-- Add missing columns to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Add status constraint to ensure valid values
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS valid_agency_status;
ALTER TABLE agencies ADD CONSTRAINT valid_agency_status 
    CHECK (status IN ('active', 'suspended', 'pending', 'inactive'));

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_agencies_email ON agencies(email);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);
CREATE INDEX IF NOT EXISTS idx_agencies_city ON agencies(city);
CREATE INDEX IF NOT EXISTS idx_agencies_state ON agencies(state);

-- Update existing records to have a valid status if they don't
UPDATE agencies SET status = 'active' WHERE status IS NULL;

-- Add unique constraint for email (if desired)
-- Note: Comment out if you don't want emails to be unique
-- ALTER TABLE agencies ADD CONSTRAINT unique_agency_email UNIQUE(email);

COMMIT;

-- Verification query
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'agencies' 
  AND table_schema = 'public'
ORDER BY ordinal_position;