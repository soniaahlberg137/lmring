-- Add attachments column to messages table for user-uploaded files (images, audio, video)
ALTER TABLE "public"."messages" ADD COLUMN "attachments" jsonb;
