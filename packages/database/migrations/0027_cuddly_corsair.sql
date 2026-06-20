CREATE TYPE "public"."eval_run_status" AS ENUM('queued', 'running', 'scored', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "eval_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"harness" text NOT NULL,
	"model_id" text NOT NULL,
	"suite" text NOT NULL,
	"domain" text NOT NULL,
	"status" "eval_run_status" DEFAULT 'queued' NOT NULL,
	"k" integer DEFAULT 1 NOT NULL,
	"pass_at_1" real,
	"pass_hat_k" real,
	"f1" real,
	"cost_usd" real,
	"latency_ms" integer,
	"total_tokens" integer,
	"runner_image_digest" text,
	"suite_hash" text,
	"triggered_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "run_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"task_slug" text NOT NULL,
	"metric" text NOT NULL,
	"value" real NOT NULL,
	"trial" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_scores" ADD CONSTRAINT "run_scores_run_id_eval_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."eval_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "eval_runs_suite_idx" ON "eval_runs" USING btree ("suite");--> statement-breakpoint
CREATE INDEX "eval_runs_model_idx" ON "eval_runs" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "eval_runs_harness_idx" ON "eval_runs" USING btree ("harness");--> statement-breakpoint
CREATE INDEX "run_scores_run_idx" ON "run_scores" USING btree ("run_id");