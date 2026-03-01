-- Migration 004: Add individual role support
-- Allows users managing their own reputation (not consultants)

-- Add 'individual' to the role check constraint
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('consultant', 'individual', 'client_view', 'admin'));

-- Add is_self_profile flag to clients table
-- When true, this profile belongs to the user themselves (individual mode)
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS is_self_profile BOOLEAN DEFAULT FALSE;
