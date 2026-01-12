DROP TABLE "model_rankings" CASCADE;--> statement-breakpoint
DROP TABLE "user_votes" CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "model_responses" ADD COLUMN IF NOT EXISTS "attachments" jsonb;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."vote_type";