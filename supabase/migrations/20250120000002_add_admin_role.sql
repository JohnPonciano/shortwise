-- Add admin role to profiles table
-- This migration adds role-based access control for admin features

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add comment explaining the role system
COMMENT ON COLUMN public.profiles.role IS 'User role: user (default), admin (full access), moderator (limited admin access)';

-- Update RLS policies to allow admins to access all data
-- Note: These policies will be created in the admin components 