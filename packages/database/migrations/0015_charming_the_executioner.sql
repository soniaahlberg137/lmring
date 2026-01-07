DROP TABLE "model_rankings" CASCADE;--> statement-breakpoint
DROP TABLE "user_votes" CASCADE;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "storage_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "model_responses" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "file_data";--> statement-breakpoint
DROP TYPE "public"."vote_type";