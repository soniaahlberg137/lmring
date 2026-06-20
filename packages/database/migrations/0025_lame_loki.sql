CREATE TYPE "public"."eval_run_status" AS ENUM('queued', 'running', 'scored', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."eval_visibility" AS ENUM('public', 'private', 'unlisted');--> statement-breakpoint
CREATE TYPE "public"."grader_kind" AS ENUM('programmatic', 'llm_judge', 'external');--> statement-breakpoint
CREATE TYPE "public"."harness_kind" AS ENUM('oh-my-claudecode', 'claude-code', 'cline', 'custom');--> statement-breakpoint
CREATE TYPE "public"."model_backend" AS ENUM('platform', 'byo');--> statement-breakpoint
CREATE TYPE "public"."run_result_status" AS ENUM('pending', 'running', 'passed', 'failed', 'errored', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."suite_rotation" AS ENUM('static', 'rotating', 'canary');--> statement-breakpoint
CREATE TYPE "public"."task_kind" AS ENUM('programmatic', 'llm_judge', 'agentic');--> statement-breakpoint
CREATE TABLE "benchmark_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"kind" "task_kind" NOT NULL,
	"prompt_ref" text,
	"fixture_ref" text,
	"grader_kind" "grader_kind" NOT NULL,
	"grader_config" jsonb,
	"max_score" real,
	"timeout_seconds" integer,
	"held_out" boolean DEFAULT true NOT NULL,
	"content_hash" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "benchmark_tasks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "eval_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"harness_version_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"suite_id" uuid NOT NULL,
	"triggered_by" uuid,
	"backend" "model_backend" DEFAULT 'platform' NOT NULL,
	"api_key_id" uuid,
	"visibility" "eval_visibility" DEFAULT 'public' NOT NULL,
	"status" "eval_run_status" DEFAULT 'queued' NOT NULL,
	"error" text,
	"runner_image_digest" text,
	"suite_snapshot_hash" text,
	"seed" integer,
	"tasks_total" integer,
	"tasks_completed" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"cost_usd" real,
	"latency_ms_p50" integer,
	"latency_ms_p95" integer,
	"wall_clock_ms" integer,
	"queued_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harness_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"harness_id" uuid NOT NULL,
	"version" text NOT NULL,
	"git_sha" text,
	"image_digest" text,
	"manifest_ref" text,
	"manifest" jsonb,
	"manifest_hash" text,
	"notes" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "harness_versions_harness_version_unique" UNIQUE("harness_id","version")
);
--> statement-breakpoint
CREATE TABLE "harnesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "harness_kind" NOT NULL,
	"description" text,
	"repo_url" text,
	"homepage_url" text,
	"license" text,
	"maintainer" text,
	"submitted_by" uuid,
	"visibility" "eval_visibility" DEFAULT 'public' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"tags" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "harnesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leaderboard_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"harness_id" uuid NOT NULL,
	"harness_version_id" uuid,
	"model_id" uuid NOT NULL,
	"suite_id" uuid NOT NULL,
	"score" real,
	"score_stderr" real,
	"rank" integer,
	"avg_cost_usd" real,
	"cost_per_solved_task" real,
	"avg_latency_ms" integer,
	"avg_total_tokens" integer,
	"pareto_optimal" boolean DEFAULT false NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"sample_size" integer,
	"arena_elo" real,
	"last_run_at" timestamp with time zone,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_entries_harness_model_suite_unique" UNIQUE("harness_id","model_id","suite_id")
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"depot_model_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"display_name" text,
	"organization" text,
	"context_window_tokens" integer,
	"input_price_per_mtok" real,
	"output_price_per_mtok" real,
	"cached_input_price_per_mtok" real,
	"price_currency" text,
	"abilities" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_depot_provider_unique" UNIQUE("depot_model_id","provider_id")
);
--> statement-breakpoint
CREATE TABLE "run_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"status" "run_result_status" DEFAULT 'pending' NOT NULL,
	"raw_score" real,
	"normalized_score" real,
	"trace_ref" text,
	"artifact_ref" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"cost_usd" real,
	"latency_ms" integer,
	"attempt" integer DEFAULT 1 NOT NULL,
	"grader_output" jsonb,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "run_results_run_task_attempt_unique" UNIQUE("run_id","task_id","attempt")
);
--> statement-breakpoint
CREATE TABLE "run_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_result_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"role" text,
	"tool_name" text,
	"summary" text,
	"content_ref" text,
	"tokens" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "run_steps_run_result_step_unique" UNIQUE("run_result_id","step_index")
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"value" real,
	"stderr" real,
	"sample_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scores_run_metric_unique" UNIQUE("run_id","metric")
);
--> statement-breakpoint
CREATE TABLE "task_suite_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suite_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_suite_tasks_suite_task_unique" UNIQUE("suite_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "task_suites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rotation" "suite_rotation" DEFAULT 'static' NOT NULL,
	"rotation_period_days" integer,
	"rotation_seed" text,
	"active_from" timestamp with time zone,
	"active_until" timestamp with time zone,
	"superseded_by_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_suites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_harness_version_id_harness_versions_id_fk" FOREIGN KEY ("harness_version_id") REFERENCES "public"."harness_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_suite_id_task_suites_id_fk" FOREIGN KEY ("suite_id") REFERENCES "public"."task_suites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harness_versions" ADD CONSTRAINT "harness_versions_harness_id_harnesses_id_fk" FOREIGN KEY ("harness_id") REFERENCES "public"."harnesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harnesses" ADD CONSTRAINT "harnesses_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_harness_id_harnesses_id_fk" FOREIGN KEY ("harness_id") REFERENCES "public"."harnesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_harness_version_id_harness_versions_id_fk" FOREIGN KEY ("harness_version_id") REFERENCES "public"."harness_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_suite_id_task_suites_id_fk" FOREIGN KEY ("suite_id") REFERENCES "public"."task_suites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_results" ADD CONSTRAINT "run_results_run_id_eval_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."eval_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_results" ADD CONSTRAINT "run_results_task_id_benchmark_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."benchmark_tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_run_result_id_run_results_id_fk" FOREIGN KEY ("run_result_id") REFERENCES "public"."run_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_run_id_eval_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."eval_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_suite_tasks" ADD CONSTRAINT "task_suite_tasks_suite_id_task_suites_id_fk" FOREIGN KEY ("suite_id") REFERENCES "public"."task_suites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_suite_tasks" ADD CONSTRAINT "task_suite_tasks_task_id_benchmark_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."benchmark_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_suites" ADD CONSTRAINT "task_suites_superseded_by_id_task_suites_id_fk" FOREIGN KEY ("superseded_by_id") REFERENCES "public"."task_suites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "benchmark_tasks_slug_idx" ON "benchmark_tasks" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "benchmark_tasks_kind_idx" ON "benchmark_tasks" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "benchmark_tasks_grader_kind_idx" ON "benchmark_tasks" USING btree ("grader_kind");--> statement-breakpoint
CREATE INDEX "benchmark_tasks_held_out_idx" ON "benchmark_tasks" USING btree ("held_out");--> statement-breakpoint
CREATE INDEX "benchmark_tasks_deleted_at_idx" ON "benchmark_tasks" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "eval_runs_cell_idx" ON "eval_runs" USING btree ("harness_version_id","model_id","suite_id");--> statement-breakpoint
CREATE INDEX "eval_runs_harness_version_id_idx" ON "eval_runs" USING btree ("harness_version_id");--> statement-breakpoint
CREATE INDEX "eval_runs_model_id_idx" ON "eval_runs" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "eval_runs_suite_id_idx" ON "eval_runs" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "eval_runs_triggered_by_idx" ON "eval_runs" USING btree ("triggered_by");--> statement-breakpoint
CREATE INDEX "eval_runs_api_key_id_idx" ON "eval_runs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "eval_runs_status_idx" ON "eval_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "harness_versions_harness_id_idx" ON "harness_versions" USING btree ("harness_id");--> statement-breakpoint
CREATE INDEX "harness_versions_is_current_idx" ON "harness_versions" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "harnesses_slug_idx" ON "harnesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "harnesses_kind_idx" ON "harnesses" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "harnesses_submitted_by_idx" ON "harnesses" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "harnesses_visibility_idx" ON "harnesses" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "harnesses_deleted_at_idx" ON "harnesses" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "leaderboard_entries_harness_id_idx" ON "leaderboard_entries" USING btree ("harness_id");--> statement-breakpoint
CREATE INDEX "leaderboard_entries_harness_version_id_idx" ON "leaderboard_entries" USING btree ("harness_version_id");--> statement-breakpoint
CREATE INDEX "leaderboard_entries_model_id_idx" ON "leaderboard_entries" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "leaderboard_entries_suite_id_idx" ON "leaderboard_entries" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "leaderboard_entries_suite_score_idx" ON "leaderboard_entries" USING btree ("suite_id","score");--> statement-breakpoint
CREATE INDEX "models_depot_model_id_idx" ON "models" USING btree ("depot_model_id");--> statement-breakpoint
CREATE INDEX "models_provider_id_idx" ON "models" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "models_active_idx" ON "models" USING btree ("active");--> statement-breakpoint
CREATE INDEX "run_results_run_id_idx" ON "run_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "run_results_task_id_idx" ON "run_results" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "run_results_status_idx" ON "run_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "run_steps_run_result_id_idx" ON "run_steps" USING btree ("run_result_id");--> statement-breakpoint
CREATE INDEX "scores_run_id_idx" ON "scores" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "task_suite_tasks_suite_id_idx" ON "task_suite_tasks" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "task_suite_tasks_task_id_idx" ON "task_suite_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_suites_slug_idx" ON "task_suites" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "task_suites_rotation_idx" ON "task_suites" USING btree ("rotation");--> statement-breakpoint
CREATE INDEX "task_suites_superseded_by_id_idx" ON "task_suites" USING btree ("superseded_by_id");--> statement-breakpoint
CREATE INDEX "task_suites_is_active_idx" ON "task_suites" USING btree ("is_active");