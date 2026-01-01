-- Migration: Add EXPIRED status to match status enum
-- Date: 2026-01-01
-- Description: Add 'expired' value to the match status enum type

-- Note: PostgreSQL requires special handling for enum modifications
-- If you're using PostgreSQL, use this approach:

-- For PostgreSQL:
-- First, add the new value to the enum type
ALTER TYPE matchstatus ADD VALUE IF NOT EXISTS 'expired';

-- For SQLite or other databases that don't support enums natively,
-- the status is stored as a string, so no migration is needed.
-- The application code will handle the new 'expired' status value.

-- Update any pending matches that have expired to the new status
UPDATE matches
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at IS NOT NULL
  AND expires_at < NOW();
