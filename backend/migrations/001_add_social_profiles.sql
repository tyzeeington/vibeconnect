-- Migration: Add social profiles and match expiration
-- Date: 2024-12-31
-- Description: Add social_profiles, social_visibility to user_profiles and expires_at to matches

-- Add social profiles columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_visibility VARCHAR(20) DEFAULT 'connection_only';

-- Add expires_at to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Update existing matches to expire 72 hours from creation
UPDATE matches
SET expires_at = created_at + INTERVAL '72 hours'
WHERE expires_at IS NULL;
