-- ========================================
-- Fix RLS Policies for Auth System Tables
-- ========================================
--
-- Architecture Overview:
-- - Better-Auth uses DATABASE_URL with Transaction pooler (port 6543)
-- - This connection uses the postgres role, which BYPASSES RLS
-- - RLS policies only apply to direct Supabase client queries from app code
--
-- Auth Table Strategy:
-- - users: SELECT (read user info) + UPDATE (profile editing) policies
-- - session: Full CRUD policies for session management via app
-- - account: Full CRUD policies for OAuth account linking via app
-- - verification: RLS DISABLED (internal Better-Auth table only)
--
-- Fixes:
-- 1. Disable RLS on verification table (no user-facing access needed)
-- 2. Add UPDATE policy to users table (for profile editing feature)
--

-- Fix 1: Disable RLS on verification table
-- This table is managed exclusively by Better-Auth for email verification and password reset tokens
-- No user-facing access is required, so RLS adds unnecessary complexity
ALTER TABLE "verification" DISABLE ROW LEVEL SECURITY;

-- Fix 2: Add UPDATE policy to users table for profile editing
-- Allows authenticated users to update their own profile information (name, avatar, etc.)
-- Better-Auth handles user creation (INSERT) via postgres role, bypassing RLS
CREATE POLICY "users_update_own"
ON "users" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "id")
WITH CHECK ((SELECT auth.uid()) = "id");
