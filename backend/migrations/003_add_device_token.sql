-- Migration: Add device_token to user_profiles
-- Date: 2026-01-02
-- Description: Add device_token field to user_profiles table for push notifications

-- Add device_token column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS device_token VARCHAR(512) NULL;

-- Add index on device_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_device_token
ON user_profiles(device_token);

-- Add comment explaining the column
COMMENT ON COLUMN user_profiles.device_token IS 'FCM (Firebase Cloud Messaging) device token for push notifications';
