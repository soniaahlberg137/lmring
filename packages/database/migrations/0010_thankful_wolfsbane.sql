CREATE TYPE "public"."comparison_type" AS ENUM('text', 'image_gen', 'video_gen', 'tts', 'stt');--> statement-breakpoint
CREATE TYPE "public"."vote_outcome" AS ENUM('winner', 'loser', 'tie', 'all_bad');--> statement-breakpoint
CREATE TABLE "comparison_vote_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comparison_vote_id" uuid NOT NULL,
	"model_response_id" uuid NOT NULL,
	"model_name" text NOT NULL,
	"provider_name" text NOT NULL,
	"outcome" "vote_outcome" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparison_vote_results_vote_response_unique" UNIQUE("comparison_vote_id","model_response_id")
);
--> statement-breakpoint
CREATE TABLE "comparison_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"comparison_type" "comparison_type" NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparison_votes_user_message_unique" UNIQUE("user_id","message_id")
);
--> statement-breakpoint
CREATE TABLE "model_comparison_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_name" text NOT NULL,
	"provider_name" text NOT NULL,
	"comparison_type" "comparison_type" NOT NULL,
	"total_comparisons" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"ties" integer DEFAULT 0 NOT NULL,
	"all_bad_count" integer DEFAULT 0 NOT NULL,
	"elo_rating" real DEFAULT 1500 NOT NULL,
	"win_rate" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_comparison_stats_unique" UNIQUE("model_name","provider_name","comparison_type")
);
--> statement-breakpoint
ALTER TABLE "comparison_vote_results" ADD CONSTRAINT "comparison_vote_results_comparison_vote_id_comparison_votes_id_fk" FOREIGN KEY ("comparison_vote_id") REFERENCES "public"."comparison_votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_vote_results" ADD CONSTRAINT "comparison_vote_results_model_response_id_model_responses_id_fk" FOREIGN KEY ("model_response_id") REFERENCES "public"."model_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_votes" ADD CONSTRAINT "comparison_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_votes" ADD CONSTRAINT "comparison_votes_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comparison_vote_results_vote_id_idx" ON "comparison_vote_results" USING btree ("comparison_vote_id");--> statement-breakpoint
CREATE INDEX "comparison_vote_results_model_response_id_idx" ON "comparison_vote_results" USING btree ("model_response_id");--> statement-breakpoint
CREATE INDEX "comparison_votes_user_id_idx" ON "comparison_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comparison_votes_message_id_idx" ON "comparison_votes" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "model_comparison_stats_elo_idx" ON "model_comparison_stats" USING btree ("elo_rating");--> statement-breakpoint
CREATE INDEX "model_comparison_stats_type_idx" ON "model_comparison_stats" USING btree ("comparison_type");
