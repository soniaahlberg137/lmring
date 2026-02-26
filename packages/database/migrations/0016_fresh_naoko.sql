CREATE TYPE "public"."webdev_status" AS ENUM('generating', 'building', 'ready', 'error', 'expired');--> statement-breakpoint
CREATE TABLE "webdev_iterations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webdev_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"key_id" uuid NOT NULL,
	"status" "webdev_status" DEFAULT 'generating' NOT NULL,
	"files" jsonb,
	"sandbox_id" text,
	"preview_url" text,
	"generated_code" text,
	"error" text,
	"tokens_used" integer,
	"response_time_ms" integer,
	"display_position" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webdev_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"status" "webdev_status" DEFAULT 'generating' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webdev_iterations" ADD CONSTRAINT "webdev_iterations_session_id_webdev_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."webdev_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webdev_responses" ADD CONSTRAINT "webdev_responses_session_id_webdev_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."webdev_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webdev_sessions" ADD CONSTRAINT "webdev_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webdev_iterations_session_id_idx" ON "webdev_iterations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "webdev_responses_session_id_idx" ON "webdev_responses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "webdev_sessions_user_id_idx" ON "webdev_sessions" USING btree ("user_id");