-- Migration: Add profile picture support
-- Date: 2026-01-02
-- Description: Add profile_picture_cid column to user_profiles for IPFS-stored profile pictures

-- Add profile_picture_cid column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS profile_picture_cid VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_picture_cid ON user_profiles(profile_picture_cid);
