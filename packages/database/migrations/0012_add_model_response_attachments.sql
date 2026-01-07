-- Add attachments column to model_responses table for AI-generated media (images, audio, video)
ALTER TABLE "public"."model_responses" ADD COLUMN "attachments" jsonb;
