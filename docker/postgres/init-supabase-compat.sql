-- Supabase compatibility layer for local development
-- Creates stub roles and functions that Supabase provides automatically
--
-- This script runs on first PostgreSQL container start (empty data volume)
-- It allows Supabase RLS migrations to run on standard PostgreSQL

-- Create the 'authenticated' role (used in RLS policies)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END
$$;

-- Create auth schema and uid() function stub
CREATE SCHEMA IF NOT EXISTS auth;

-- Stub function - in local dev, returns NULL (RLS effectively disabled)
-- In Supabase, this returns the actual authenticated user's UUID
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT NULL::uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
