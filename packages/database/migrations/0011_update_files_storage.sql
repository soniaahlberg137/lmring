-- Update files table to use S3/MinIO storage instead of inline file_data
-- This migration changes from storing file content directly to storing S3 object paths

-- Drop the old file_data column (stores file content inline)
ALTER TABLE "public"."files" DROP COLUMN IF EXISTS "file_data";

-- Add the new storage_path column (stores S3 object key)
ALTER TABLE "public"."files" ADD COLUMN "storage_path" TEXT NOT NULL DEFAULT '';

-- Remove the default after adding the column
ALTER TABLE "public"."files" ALTER COLUMN "storage_path" DROP DEFAULT;
