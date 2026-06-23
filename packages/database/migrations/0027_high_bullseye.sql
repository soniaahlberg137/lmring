CREATE TYPE "public"."benchmark_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "benchmark_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"benchmark_name" text NOT NULL,
	"status" "benchmark_run_status" DEFAULT 'pending' NOT NULL,
	"hal_run_id" text,
	"score" real,
	"error" text,
	"raw_results" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "benchmark_runs" ADD CONSTRAINT "benchmark_runs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "benchmark_runs_agent_id_idx" ON "benchmark_runs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "benchmark_runs_status_idx" ON "benchmark_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "benchmark_runs_benchmark_name_idx" ON "benchmark_runs" USING btree ("benchmark_name");